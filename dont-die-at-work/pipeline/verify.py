#!/usr/bin/env python3
"""Fact-check gate for Don't Die at Work Today.

The build fails (exit 1) if any of these is true:

  1. The source report is missing, is not from an approved publisher, or its
     checksum no longer matches the one recorded in script.json.
  2. A beat has narration or on-screen text but no claims (only the sign-off
     may be exempt, and an exempt beat may not carry numbers).
  3. A claim's quote is not found, verbatim, on the page it cites.
  4. A number in the narration or on-screen text does not appear in any quote
     that beat cites.
  5. The beats do not follow the channel template, in order.
  6. A name on the video's do_not_name list appears anywhere in the script.
  7. (--final) The rendered video is over the runtime limit or the wrong size.

A script may declare "lane": "special" for a video outside the channel's lane (long-form,
news-pegged, not a workplace-fatality report). Its rules differ in three ways:
  - sources may come from any publisher, but each still needs a URL. Official documents are
    saved with the project ("file" + checksum). News articles are quoted, not copied into the
    repo: a source may name a "local" copy that is kept out of git; when that copy is on this
    machine its quotes are checked, and when it is not they are reported as not re-checked. A
    source marked "check": "search" could only be read through search results; its quotes are
    always reported as not re-checked.
  - the sections are the ones the script lists in "sections", in that order.
  - commentary beats are marked "exempt": "opinion" (or "note"). They may not state numbers.

What this does NOT do: judge whether a quote actually supports its claim. That
is a reading-comprehension call, made when the script is written and
spot-checked by a human using the generated claim-map.md.

Usage:
  python pipeline/verify.py videos/<id>            # script gate
  python pipeline/verify.py videos/<id> --final    # script gate + render gate
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

from pypdf import PdfReader

APPROVED_HOSTS = {
    "www.csb.gov": "U.S. Chemical Safety Board",
    "csb.gov": "U.S. Chemical Safety Board",
    "www.osha.gov": "OSHA",
    "osha.gov": "OSHA",
    "www.cdc.gov": "NIOSH FACE (CDC)",
    "cdc.gov": "NIOSH FACE (CDC)",
    "wwwn.cdc.gov": "NIOSH FACE (CDC)",
}

# Hook, line and sinker. Every video must contain each of these sections; it opens
# on the hook and closes on the tribute and the sign-off. What happens in between,
# and in what order, is a storytelling decision, not a rule.
#   mechanism         where the hazard came from and why nobody sensed it
#   incident          what happened, played out
#   stoppable_moment  the moment it could have been stopped
#   lesson            how you don't die
REQUIRED = {"hook", "mechanism", "incident", "stoppable_moment", "lesson", "tribute", "signoff"}
EXEMPT_ALLOWED = {"signoff"}

UNITS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
    "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13,
    "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
}
TENS = {"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90}
NUMBER_WORD = re.compile(
    r"\b(?:(%s)(?:[- ](%s))?|(%s))\b" % ("|".join(TENS), "|".join(list(UNITS)[1:10]), "|".join(UNITS)),
    re.I,
)
DIGITS = re.compile(r"(?<![A-Za-z\d.])\d+(?:\.\d+)?(?![A-Za-z]*\d)")


def normalise(text: str) -> str:
    """Fold typography so a quote typed on a keyboard matches text pulled from a PDF."""
    text = text.replace("­", "")
    for a, b in (("“", '"'), ("”", '"'), ("‘", "'"), ("’", "'"),
                 ("–", "-"), ("—", "-"), (" ", " ")):
        text = text.replace(a, b)
    text = re.sub(r"-\s*\n\s*", "-", text)   # co-\nworker -> co-worker
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([.,;:!?])", r"\1", text)   # a link inside a sentence leaves "word ." behind
    return text.strip().lower()


def numbers_in(text: str, *, skip_bare_one: bool) -> set[float]:
    """Every number written in `text`, as digits or as words."""
    found: set[float] = set()
    for m in DIGITS.finditer(text):
        found.add(float(m.group()))
    for m in NUMBER_WORD.finditer(text):
        tens, unit, single = m.group(1), m.group(2), m.group(3)
        if tens:
            found.add(float(TENS[tens.lower()] + (UNITS[unit.lower()] if unit else 0)))
        else:
            word = single.lower()
            # "one" is usually a pronoun ("one died trying to save the other"),
            # so it is only counted on the source side.
            if word == "one" and skip_bare_one:
                continue
            found.add(float(UNITS[word]))
    return found


class Gate:
    def __init__(self) -> None:
        self.failures: list[str] = []
        self.passed = 0

    def check(self, ok: bool, message: str) -> bool:
        if ok:
            self.passed += 1
        else:
            self.failures.append(message)
        return ok


def load_pages(doc: Path) -> list[str]:
    """Text of a source document, one string per page. A saved web page counts as a single page."""
    if doc.suffix.lower() in (".html", ".htm"):
        import html as htmllib
        raw = doc.read_text(encoding="utf-8", errors="ignore")
        raw = re.sub(r"<script.*?</script>|<style.*?</style>", " ", raw, flags=re.S | re.I)
        return [normalise(htmllib.unescape(re.sub(r"<[^>]+>", " ", raw)))]
    if doc.suffix.lower() == ".txt":
        return [normalise(doc.read_text(encoding="utf-8", errors="ignore"))]
    return [normalise(page.extract_text() or "") for page in PdfReader(str(doc)).pages]


def verify_script(video: Path, gate: Gate, name: str = "script.json") -> dict:
    script_path = video / name
    if not gate.check(script_path.exists(), f"missing {script_path}"):
        return {}
    script = json.loads(script_path.read_text())

    special = script.get("lane") == "special"

    # 1. Sources --------------------------------------------------------------
    # The first source is the incident report; any others are background documents.
    sources = script.get("sources") or ([{"id": "case", **script["source"]}] if script.get("source") else [])
    gate.check(bool(sources), "script names no source document")
    docs: dict[str, list[str] | None] = {}
    unchecked: set[str] = set()          # special lane: sources whose quotes cannot be re-read on this machine
    for src in sources:
        sid = src.get("id", "?")
        host = urlparse(src.get("url", "")).hostname or ""
        if special:
            gate.check(bool(host), f"[{sid}] source has no url")
        else:
            gate.check(host in APPROVED_HOSTS,
                       f"[{sid}] source url host '{host}' is not an approved publisher (CSB, OSHA, NIOSH FACE)")
        docs[sid] = []
        if special and not src.get("file"):
            local = video / src["local"] if src.get("local") else None
            if local is not None and local.exists():
                docs[sid] = load_pages(local)
            elif local is not None or src.get("check") == "search":
                docs[sid] = None
                unchecked.add(sid)
            else:
                gate.check(False, f"[{sid}] source has no saved file, no local copy and is not marked check=search")
            continue
        pdf = video / src.get("file", "__missing__")
        if gate.check(pdf.exists(), f"[{sid}] source document not saved with the project: {pdf}"):
            digest = hashlib.sha256(pdf.read_bytes()).hexdigest()
            gate.check(digest == src.get("sha256"),
                       f"[{sid}] source document checksum changed: {digest} != {src.get('sha256')}")
            docs[sid] = load_pages(pdf)
    default_src = sources[0].get("id", "?") if sources else "?"

    beats = script.get("beats", [])
    gate.check(bool(beats), "script has no beats")

    # 5. Template -------------------------------------------------------------
    order: list[str] = []
    for beat in beats:
        if not order or order[-1] != beat.get("section"):
            order.append(beat.get("section"))
    have = set(order)
    if special:
        wanted = script.get("sections", [])
        gate.check(bool(wanted), "a special must list its sections")
        gate.check(order == wanted, f"sections out of order or missing: have {order}, want {wanted}")
    else:
        gate.check(have >= REQUIRED, f"missing section(s): {sorted(REQUIRED - have)}")
        gate.check(have <= REQUIRED, f"unknown section(s): {sorted(have - REQUIRED)}")
        gate.check(order[:1] == ["hook"], "the video must open on the hook")
        gate.check(order[-2:] == ["tribute", "signoff"], "the video must close on the tribute, then the sign-off")

    banned = [n.lower() for n in script.get("do_not_name", [])]

    for beat in beats:
        bid = beat.get("id", "?")
        spoken = beat.get("narration", "")
        shown = " | ".join(beat.get("onscreen", []))
        text = f"{spoken} | {shown}"
        claims = beat.get("claims", [])

        # 6. Names ------------------------------------------------------------
        for name in banned:
            gate.check(name not in text.lower(), f"[{bid}] names a victim: '{name}'")

        # 2. Every beat is sourced --------------------------------------------
        exempt = beat.get("exempt")
        if exempt:
            ok = exempt in ("opinion", "note") if special else exempt in EXEMPT_ALLOWED and beat.get("section") == exempt
            gate.check(ok, f"[{bid}] exempt='{exempt}' is not allowed here")
            gate.check(not numbers_in(text, skip_bare_one=True),
                       f"[{bid}] an exempt beat may not state numbers")
            continue
        if not gate.check(bool(claims), f"[{bid}] UNSOURCED: no claims for \"{spoken}\""):
            continue

        # 3. Quotes exist on the cited page -----------------------------------
        cited = ""
        for claim in claims:
            quote, page = claim.get("quote", ""), claim.get("page", 0)
            sid = claim.get("src", default_src)
            pages = docs.get(sid)
            cited += " " + quote
            if not gate.check(sid in docs, f"[{bid}] claim cites unknown source '{sid}'"):
                continue
            if pages is None:                      # quoted from a source that is not on this machine
                gate.check(bool(quote), f"[{bid}] claim '{claim.get('claim')}' has no quote")
                gate.unchecked = getattr(gate, "unchecked", 0) + 1
                continue
            if not gate.check(bool(quote) and 1 <= page <= len(pages),
                              f"[{bid}] claim '{claim.get('claim')}' has no quote or a bad page ({sid} p.{page})"):
                continue
            gate.check(normalise(quote) in pages[page - 1],
                       f"[{bid}] quote not found in {sid} on page {page}: \"{quote}\"")

        # 4. Every number is in a cited quote ---------------------------------
        allowed = numbers_in(normalise(cited), skip_bare_one=False)
        for n in sorted(numbers_in(text, skip_bare_one=True)):
            gate.check(n in allowed,
                       f"[{bid}] number {n:g} appears in the script but in none of the quotes it cites")
    # Thumbnail text makes claims too: it borrows the quotes of the beat it names.
    thumb = script.get("thumbnail")
    if thumb:
        by_id = {b.get("id"): b for b in beats}
        src_beat = by_id.get(thumb.get("claims_from"))
        if gate.check(bool(src_beat and src_beat.get("claims")), "[thumbnail] claims_from must name a sourced beat"):
            text = " | ".join(thumb.get("lines", []))
            allowed = numbers_in(normalise(" ".join(c.get("quote", "") for c in src_beat["claims"])), skip_bare_one=False)
            for n in sorted(numbers_in(text, skip_bare_one=True)):
                gate.check(n in allowed, f"[thumbnail] number {n:g} is not in the quotes of {thumb['claims_from']}")
            for name in banned:
                gate.check(name not in text.lower(), f"[thumbnail] names a victim: '{name}'")
    if unchecked:
        print(f"  note: {getattr(gate, 'unchecked', 0)} quote(s) not re-checked here (no copy on this machine): {', '.join(sorted(unchecked))}")
    return script


def write_claim_map(video: Path, script: dict) -> None:
    sources = script.get("sources") or [{"id": "case", **script["source"]}]
    out = [
        f"# Claim-to-source map: {script['title']}",
        "",
        "Generated by `pipeline/verify.py` from `script.json`. Do not edit by hand.",
        "",
        "## Sources",
        "",
    ]
    for src in sources:
        number = f", no. {src['report_no']}" if src.get("report_no") else ""
        out.append(f"- **{src['id']}**: {src['publisher']}, *{src['title']}*{number} ({src['published']}). "
                   f"<{src['url']}>  ")
        if src.get("file"):
            out.append(f"  Saved copy: `{src['file']}` (sha256 `{src['sha256'][:16]}...`). Page numbers are PDF pages.")
        elif src.get("check") == "search":
            out.append(f"  Read through search results only on {src.get('retrieved', '?')}: the page could not be opened from here.")
        else:
            out.append(f"  Read on {src.get('retrieved', '?')}. Quoted, not copied into the repository.")
    out.append("")
    default = sources[0]["id"]
    for beat in script["beats"]:
        out.append(f"## {beat['id']} ({beat['section']})")
        out.append("")
        out.append(f"> {beat['narration']}")
        if beat.get("onscreen"):
            out.append(">")
            out.append("> On screen: " + " / ".join(beat["onscreen"]))
        out.append("")
        if beat.get("exempt"):
            out.append(f"*No factual claim ({beat['exempt']}).*")
        for claim in beat.get("claims", []):
            out.append(f"- **{claim['claim']}** ({claim.get('src', default)} p. {claim['page']}): \"{claim['quote']}\"")
        out.append("")
    (video / "claim-map.md").write_text("\n".join(out))


def verify_render(video: Path, script: dict, gate: Gate) -> None:
    final = video / "render" / "final.mp4"
    if not gate.check(final.exists(), f"no final render at {final}"):
        return
    probe = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(final)],
        capture_output=True, text=True, check=True).stdout)
    duration = float(probe["format"]["duration"])
    limit = float(script.get("max_runtime_s", 60))
    gate.check(duration <= limit, f"runtime {duration:.2f}s is over the {limit:g}s limit")
    video_streams = [s for s in probe["streams"] if s["codec_type"] == "video"]
    audio_streams = [s for s in probe["streams"] if s["codec_type"] == "audio"]
    gate.check(len(video_streams) == 1 and len(audio_streams) == 1, "final render needs one video and one audio stream")
    if video_streams:
        v = video_streams[0]
        size = (int(script.get("width", 1080)), int(script.get("height", 1920)))
        gate.check((v["width"], v["height"]) == size,
                   f"final render is {v['width']}x{v['height']}, expected {size[0]}x{size[1]}")
    print(f"  render: {duration:.2f}s of {limit:g}s allowed")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path, help="path to the video folder, e.g. videos/001-...")
    ap.add_argument("--final", action="store_true", help="also gate the rendered video (runtime, size)")
    ap.add_argument("--script", default="script.json", help="check a draft instead, e.g. script-v2-draft.json (no claim map is written)")
    args = ap.parse_args()

    gate = Gate()
    script = verify_script(args.video, gate, args.script)
    if script and not gate.failures and args.script == "script.json":
        write_claim_map(args.video, script)
    if script and args.final:
        verify_render(args.video, script, gate)

    if gate.failures:
        print(f"VERIFY FAILED: {len(gate.failures)} problem(s), {gate.passed} checks passed")
        for f in gate.failures:
            print("  x " + f)
        return 1
    n_claims = sum(len(b.get("claims", [])) for b in script["beats"])
    print(f"VERIFY OK: {gate.passed} checks passed, {n_claims} claims across {len(script['beats'])} beats all found in the source")
    return 0


if __name__ == "__main__":
    sys.exit(main())
