#!/usr/bin/env python3
"""Upload a finished film to YouTube (Data API v3, videos.insert, resumable upload).

    python pipeline/upload.py specials/five-tons-of-neglect
    python pipeline/upload.py videos/<id> --thumbnail render/thumbnail.jpg --privacy private

Reads <video>/upload.json (title, description, tags, category, flags) and <video>/render/final.mp4.
Writes <video>/upload-result.json: the video's id and links. Nothing secret is written there.

The film always goes up as the privacy set in upload.json ("private" unless Nick says otherwise):
he watches it, then publishes it himself.

Signing in. No secret lives in this repository:
  - The uploader app (a Google Cloud OAuth client) is saved as a network secret on the cloud
    environment for oauth2.googleapis.com. The environment's proxy adds it to token requests, so
    this script never sees the client ID or secret.
  - Nick's grant for his channel is a token file (access_token, refresh_token) whose path is
    given in YT_TOKEN_FILE. It is made once per grant by opening Google's consent link and
    exchanging the code (see CLAUDE.md, Upload). Scope: youtube.upload only.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

TOKEN_URL = "https://oauth2.googleapis.com/token"
API = "https://www.googleapis.com/upload/youtube/v3"


def curl(args: list[str], timeout: int = 120) -> subprocess.CompletedProcess:
    return subprocess.run(["curl", "-sS", "--fail-with-body", "-m", str(timeout), *args], capture_output=True, text=True)


def token(path: Path) -> str:
    """The current access token, refreshed through the environment's proxy when it is about to expire."""
    grant = json.loads(path.read_text())
    age = time.time() - grant.get("obtained_at", 0)
    if age > grant.get("expires_in", 3600) - 300:
        r = curl(["-X", "POST", TOKEN_URL, "--data-urlencode", "grant_type=refresh_token", "--data-urlencode", f"refresh_token={grant['refresh_token']}"])
        fresh = json.loads(r.stdout or "{}")
        if "access_token" not in fresh:
            sys.exit(f"UPLOAD FAILED: could not refresh the sign-in ({fresh.get('error', r.stderr.strip())}: {fresh.get('error_description', '')}). "
                     "The grant has probably expired; make a new one (CLAUDE.md, Upload).")
        grant.update(fresh)
        grant["obtained_at"] = int(time.time())
        path.write_text(json.dumps(grant))
        os.chmod(path, 0o600)
    return grant["access_token"]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("--thumbnail", default=None, help="path under the video folder (default: render/thumbnail.jpg)")
    ap.add_argument("--privacy", default=None, choices=["private", "unlisted", "public"], help="override upload.json")
    args = ap.parse_args()

    video = args.video.resolve()
    meta = json.loads((video / "upload.json").read_text())
    film = video / "render" / "final.mp4"
    thumb = video / (args.thumbnail or "render/thumbnail.jpg")
    token_file = os.environ.get("YT_TOKEN_FILE")
    if not token_file or not Path(token_file).exists():
        sys.exit("UPLOAD FAILED: set YT_TOKEN_FILE to the grant file (see CLAUDE.md, Upload).")
    if not film.exists():
        sys.exit(f"UPLOAD FAILED: {film} is missing; build the film first.")
    if len(meta["title"]) > 100 or len(meta["description"]) > 5000 or "<" in meta["description"] or ">" in meta["description"]:
        sys.exit("UPLOAD FAILED: title over 100 characters, description over 5,000, or an angle bracket in the description.")

    body = {
        "snippet": {"title": meta["title"], "description": meta["description"], "tags": meta.get("tags", []),
                    "categoryId": meta.get("categoryId", "27"), "defaultLanguage": "en", "defaultAudioLanguage": "en"},
        "status": {"privacyStatus": args.privacy or meta.get("privacyStatus", "private"),
                   "selfDeclaredMadeForKids": bool(meta.get("selfDeclaredMadeForKids", False)),
                   "containsSyntheticMedia": bool(meta.get("containsSyntheticMedia", True))},
    }

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        os.chmod(tmp, 0o700)
        auth = tmp / "auth"          # the bearer token goes to curl in a file, never on a command line
        auth.write_text(f"Authorization: Bearer {token(Path(token_file))}\n")
        os.chmod(auth, 0o600)
        (tmp / "meta.json").write_text(json.dumps(body))

        # 1. open an upload session
        r = curl(["-X", "POST", f"{API}/videos?uploadType=resumable&part=snippet,status", "-H", f"@{auth}",
                  "-H", "Content-Type: application/json; charset=UTF-8", "-H", "X-Upload-Content-Type: video/mp4",
                  "-H", f"X-Upload-Content-Length: {film.stat().st_size}", "--data-binary", f"@{tmp / 'meta.json'}",
                  "-D", str(tmp / "headers"), "-o", str(tmp / "open.json")])
        headers = (tmp / "headers").read_text() if (tmp / "headers").exists() else ""
        where = next((line.split(":", 1)[1].strip() for line in headers.splitlines() if line.lower().startswith("location:")), None)
        if r.returncode != 0 or not where:
            detail = (tmp / "open.json").read_text()[:600] if (tmp / "open.json").exists() else r.stderr
            sys.exit(f"UPLOAD FAILED opening the session: {detail.strip()}")

        # 2. send the film
        print(f"uploading {film.name} ({film.stat().st_size / 1e6:.0f} MB) as {body['status']['privacyStatus']} ...", flush=True)
        t0 = time.time()
        r = curl(["-X", "PUT", where, "-H", f"@{auth}", "-H", "Content-Type: video/mp4", "--upload-file", str(film), "-o", str(tmp / "video.json")], timeout=3600)
        reply = json.loads((tmp / "video.json").read_text() or "{}") if (tmp / "video.json").exists() else {}
        if r.returncode != 0 or "id" not in reply:
            sys.exit(f"UPLOAD FAILED sending the film: {json.dumps(reply)[:600] or r.stderr.strip()}")
        vid = reply["id"]
        print(f"uploaded in {time.time() - t0:.0f} s: video id {vid}, status {reply.get('status', {})}")

        # 3. the thumbnail (needs a phone-verified channel; the film is up either way)
        thumb_note = "not sent"
        if thumb.exists():
            r = curl(["-X", "POST", f"{API}/thumbnails/set?videoId={vid}&uploadType=media", "-H", f"@{auth}", "-H", "Content-Type: image/jpeg",
                      "--data-binary", f"@{thumb}", "-o", str(tmp / "thumb.json")], timeout=300)
            treply = json.loads((tmp / "thumb.json").read_text() or "{}") if (tmp / "thumb.json").exists() else {}
            thumb_note = "set" if r.returncode == 0 and "items" in treply else f"NOT set: {json.dumps(treply.get('error', {}).get('message', treply))[:300]}"
        print(f"thumbnail {thumb.name}: {thumb_note}")

    result = {"id": vid, "watch": f"https://youtu.be/{vid}", "studio": f"https://studio.youtube.com/video/{vid}/edit",
              "privacy": body["status"]["privacyStatus"], "title": meta["title"], "thumbnail": f"{thumb.name}: {thumb_note}",
              "uploaded_at": time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime())}
    (video / "upload-result.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
