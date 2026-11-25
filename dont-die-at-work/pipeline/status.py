#!/usr/bin/env python3
"""Read back from YouTube the state of what upload.py and shorts.py sent for one video folder.

    YT_TOKEN_FILE=... python pipeline/status.py specials/five-tons-of-neglect

For each id in upload-result.json and upload-result-short-*.json it prints the channel it is on,
whether it is public or held private, its release time, and whether YouTube has finished
processing it. Needs a sign-in that can read (scope https://www.googleapis.com/auth/youtube).
Run it after every upload, and tell Nick what it prints, not what the upload reply said.
"""
import json, os, subprocess, sys, tempfile, glob
from pathlib import Path
sys.path.insert(0, 'pipeline')
import upload
v = sys.argv[1]
tok = upload.token(Path(os.environ['YT_TOKEN_FILE']))
files = [f'{v}/upload-result.json'] + sorted(glob.glob(f'{v}/upload-result-short-*.json'))
ids = [json.load(open(f))['id'] for f in files]
with tempfile.TemporaryDirectory() as tmp:
    os.chmod(tmp, 0o700)
    auth = Path(tmp) / 'auth'; auth.write_text(f"Authorization: Bearer {tok}\n"); os.chmod(auth, 0o600)
    def get(url):
        r = subprocess.run(['curl', '-sS', '-m', '60', '-H', f'@{auth}', url], capture_output=True, text=True)
        try: return json.loads(r.stdout)
        except Exception: return {'raw': r.stdout[:300], 'err': r.stderr[:300]}
    x = get('https://www.googleapis.com/youtube/v3/videos?part=snippet,status,processingDetails,contentDetails,statistics&id=' + ','.join(ids))
    if 'error' in x: print('videos error:', x['error'].get('code'), x['error'].get('message')); raise SystemExit(1)
    by = {it['id']: it for it in x.get('items', [])}
    print(f"{len(by)} of {len(ids)} found")
    for i in ids:
        it = by.get(i)
        if not it: print(i, 'NOT FOUND'); continue
        s, st, pd, cd = it['snippet'], it['status'], it.get('processingDetails', {}), it.get('contentDetails', {})
        print(f"{i} | {s.get('channelTitle')} | {st.get('privacyStatus')} | release {st.get('publishAt')} | upload {st.get('uploadStatus')} | processing {pd.get('processingStatus')} | {cd.get('duration')} {cd.get('definition')} | synthetic {st.get('containsSyntheticMedia')} kids {st.get('madeForKids')} | views {it.get('statistics', {}).get('viewCount')} | {s.get('title')}")
    c = get('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true')
    for it in c.get('items', []):
        print('channel:', it['snippet'].get('title'), it['snippet'].get('customUrl'), '| videos counted public:', it['statistics'].get('videoCount'))
