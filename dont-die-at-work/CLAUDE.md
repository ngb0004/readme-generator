# Don't Die at Work Today

A YouTube channel. **Goal: 100,000 subscribers.** Everything here serves that one number.

Short, animated reconstructions of documented workplace fatalities and serious injuries:
what happened, why, and how you don't die.

## The lane

- OSHA workplace incidents only. If an idea is not a documented workplace incident, it is rejected.
- **Approved sources, and no others:** OSHA fatality inspection records, NIOSH FACE reports
  (federal and state), Chemical Safety Board (CSB) investigations.
- No murders, no politics, no kids' content, no off-topic videos.

## Hard rules

1. **No source document, no video.** Every script starts from an official report. The report is
   saved in the video's `source/` folder with its URL and checksum in `script.json`.
2. **Never invent facts.** If the report does not say it, the script does not say it and the
   picture does not show it. Gaps are stated as unknown ("Nobody saw him go in"), not filled in.
3. **Every key claim gets a source.** Cause, timeline, number of victims, violations: each maps to
   a verbatim quote and page number. This covers on-screen text too. All on-screen text lives in
   `script.json` and the animation reads it from there; nothing factual is typed into a component.
   No count-up animations on factual numbers: a paused frame must never show a figure that is not
   in the report.
4. **Stick to the template** (below). No experimenting with structure unless a test calls for it.
5. **Respect the victims.** No mocking, no gore, **no real names of the people who died**. Every
   video ends with a short tribute and the mission line (so no other family goes through this).
   Dark and direct, never cruel. Figures are faceless and stylised; a death is shown as a still
   figure, briefly, never as suffering.
6. **Code-driven animation.** JavaScript (Remotion + Three.js). No hand-built Blender scenes.
7. **Label AI content.** The voice is synthetic and the picture is a reconstruction: set YouTube's
   altered/synthetic content disclosure on upload, and keep the on-screen
   "ANIMATED RECONSTRUCTION / SOURCE" line.
8. **One variable at a time.** Each new video changes one thing (hook, thumbnail, length or title
   style) and records it in `script.json` (`tested_variable`) and `performance-log.md`.

## The template

Enforced by `pipeline/verify.py`; sections must appear in this order.

| section            | job                                                                        |
|--------------------|----------------------------------------------------------------------------|
| `hook`             | 0-2 s. The promise of the title, delivered at once. Opens a loop.          |
| `buildup`          | The people, the job, the small decisions. The viewer senses it going wrong.|
| `hidden_cause`     | The thing nobody had flagged.                                              |
| `reveal`           | Exactly how it went down, step by step.                                    |
| `stoppable_moment` | The moment it could have been stopped, and who made the call.              |
| `lesson`           | How you don't die. One instruction a viewer can act on.                    |
| `tribute`          | Those who died, and the mission line.                                      |
| `signoff`          | "Don't die at work today."                                                 |

Format: YouTube Short, **45-60 seconds**, 1080x1920, 30 fps. The build fails over 60 s.
Shorts that perform get an 8-15 minute deep-dive (not built yet; needs Nick's go-ahead).

## Retention playbook

Starting point: the leaked MrBeast production memo, "How to succeed in MrBeast production" (2024).
References Nick supplied: the memo summary by Simon Willison and the memo text via Alexander Jarvis.

- The first minute is everything; make the opening the most engaging part.
- Match the promise: the opening delivers what the title and thumbnail set up, immediately.
- Open loops early, close them later; keep at least one unresolved until the payoff.
- Re-hook constantly: every few seconds in a Short, something new (question, twist, escalation).
- Fast progression. No dwelling on setup.
- No dull moments. Every second earns its place.
- Satisfying payoff, then end. No long outros.
- Measure it: average view duration and percentage viewed are the scores.
- Keep learning: add findings here **with their source**. Unsourced tips do not go in.

How video 001 applies it: a new shot or graphic every 1.5-3 s; three open loops (how does tape kill
two men? / what are you breathing? / nobody saw him go in); the picture holds something back
(the gas is invisible until the reveal, switches off again on "No color").

## Daily loop

1. **Research and pick.** Dig through the approved sources and commit to the most shocking,
   well-documented incident. No pitch list, no approval step.
2. **Script** from the report, under the hard rules, into `script.json`.
3. **Verify.** `pipeline/verify.py`. Any unsourced claim fails the build.
4. **Produce.** Voice, animation, captions, sound, thumbnail.
5. **Review (optional).** Nick spot-checks before publishing, especially early on.
6. **Upload** via the YouTube Data API (not built yet; see Not built yet).
7. **Measure** at 48 hours and 7 days.
8. **Learn.** Write results to `performance-log.md`; choose the next tested variable from it.

## Folder structure

```
dont-die-at-work/
  CLAUDE.md               this file: rules, template, structure
  performance-log.md      one entry per video: what was tested, what happened
  pipeline/               Python. Scripts, not a framework.
    verify.py             the fact-check gate + render gate (run by build.py)
    voice.py              Kokoro narration, word timings, pronunciation check
    sound.py              procedural score + effects + mix (no samples, nothing to license)
    build.py              runs every step in order; stops at the first failure
    fetch_models.sh       downloads the local models (not committed)
    requirements.txt
  studio/                 Remotion + Three.js project
    src/engine/           reusable across videos: theme, timing maths, camera rig, figure rig,
                          captions, HUD kit, frame sync
    src/v001/             one folder per video: set, actors, direction, overlay
    tools/                stills.mjs (look-dev), frames.mjs (final render), cues.mjs, bench.mjs
  videos/<nnn>-<slug>/
    source/               the official report, as downloaded
    script.json           narration, on-screen text, claims; the single source of truth
    claim-map.md          generated: every line next to its quote and page (for spot-checks)
    upload.json           title, description, tags, disclosure flag
    assets/               voice.wav, timings.json, cues.json, score.wav, mix.wav
    render/               final.mp4, thumbnail.jpg  (frames/ is not committed)
    analytics/            48 h and 7 d pulls go here
```

## Building a video

```bash
cd dont-die-at-work
uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python -r pipeline/requirements.txt
pipeline/fetch_models.sh                      # ~840 MB, once
(cd studio && npm install)

.venv/bin/python pipeline/build.py videos/001-valero-nitrogen-duct-tape
```

Useful while working:

```bash
.venv/bin/python pipeline/verify.py videos/<id>                 # script gate only
.venv/bin/python pipeline/build.py videos/<id> --from sound      # keep the voice
.venv/bin/python pipeline/build.py videos/<id> --frames 600-760 --from frames   # re-render one shot
(cd studio && node tools/stills.mjs V001 /tmp/stills 0.4 12.0s 27.4s)           # look at frames
(cd studio && npm run studio)                                    # scrub the film in a browser
```

Rendering is the slow step: about 2 s per frame with no GPU (an hour for a Short). On a machine
with a GPU set `DDAWT_GL=angle`. Always check a contact sheet of stills before a full render.

## How the animation is put together

- **Everything is a pure function of time.** No state, no simulation; any frame renders alone.
- **The voice drives the picture.** `voice.py` writes word timings; `timeline.ts` turns them into
  named cues (`T.nitrogen`, `T.black`...). Cuts, graphics and sound all hang off those. Re-record
  the voice and the film retimes itself.
- **Build the set to the report's dimensions** and record them in `dims.ts` with the figure they
  came from. Modelling choices that are not from the report are labelled as such.
- **Show what the report shows.** Where it gives the investigators' conclusion rather than a
  witnessed fact, say so on screen ("CSB: HE LIKELY SAT ON THE LEDGE"). Where nobody knows, cut
  away. Anything shown but not narrated still needs a claim in `script.json`.
- **Captions** are word-synced, two or three words at a time, inside the Shorts safe area
  (`SAFE` in `engine/theme.ts`): nothing important in the bottom 20% or the right-hand strip.
- **Look:** near-black night, hazard yellow for the brand and for cut surfaces, cyan for "the
  invisible made visible", red for danger and for what was missing.

## Voice

Kokoro-82M (`am_michael`, speed 1.15), run locally: free, no API key, Apache-2.0. `voice.py` checks
every word with a speech recogniser that has never seen the script and flags anything it mishears;
rewrite the line until it passes. An AI cannot hear the result: **the voice is the part that most
needs a human ear.** Swapping to a paid voice is a change to `voice.py` only, and counts as a new
tool (needs Nick's approval).

## Guardrails

- Small, scoped tasks. Never "build the whole channel".
- The build fails automatically if the source is missing, a claim is unsourced, a number is not in
  its quotes, the template is out of order, a victim is named, or the runtime is over the limit.
- No new tools, styles or formats without Nick's approval.
- Weekly review of `performance-log.md`: what is working, what to test next.
- Monetisation: YouTube demonetises mass-produced, repetitive content. Each video needs a specific
  incident, a clear explanation and a lesson. Vary hooks and visuals within the template; never
  the same script with the names swapped.

## Not built yet

- **Upload** (YouTube Data API v3 `videos.insert`). Needs a Google Cloud project and OAuth on the
  channel account. Uploads from an unverified API project are locked to private until the app
  passes Google's audit, so apply early. Default quota allows only a handful of uploads a day.
- **Analytics pull** (YouTube Analytics API): views, CTR, average view duration, retention curve,
  subscribers gained, at 48 h and 7 d, into `videos/<id>/analytics/`.
- **Long-form** deep dives.

## Milestones

- 1,000 subscribers: the format works; apply for the YouTube Partner Program once eligible.
- 10,000: add long-form deep dives.
- 100,000: the goal. Then decide what's next.
