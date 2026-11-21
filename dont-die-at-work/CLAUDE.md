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

1. **No source document, no video.** Every script starts from an official report. Every document
   used is saved in the video's `source/` folder with its URL and checksum in `script.json`. The
   first source is the incident report; further sources (still from approved publishers) may supply
   background: how the hazard works, how often it kills.
2. **Never invent facts.** If the report does not say it, the script does not say it and the
   picture does not show it. Gaps are stated as unknown ("Nobody saw him go in"), not filled in.
3. **Every key claim gets a source.** Cause, timeline, number of victims, violations: each maps to
   a verbatim quote and page number. This covers on-screen text too. All on-screen text lives in
   `script.json` and the animation reads it from there; nothing factual is typed into a component.
   No count-up animations on factual numbers: a paused frame must never show a figure that is not
   in the report.
4. **Hook, line and sinker** (below). The sections are required; their order in the middle is a
   storytelling decision.
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

## Hook, line and sinker

Nick's words (2026-11-21, after rejecting cut 1): "It's a hook, line, and sinker. It's like
catching a fish."

- **Hook.** A bold claim that stops the scroll, and is true. ("Both of these men are about to
  die.") The real numbers are outrageous enough; a made-up one gets torn apart in the comments.
- **Line.** Now they want to know how. Explain it in plain words with the picture always moving:
  what the hazard is, where it came from, why nobody sensed it, and why doing the job this way felt
  normal. Not too deep; people click off.
- **Sinker.** The tragedy. Real people, true details, no gore. This is what makes someone in the
  field think "that could be me".

Required sections (enforced by `pipeline/verify.py`). The video opens on `hook` and closes on
`tribute` then `signoff`; the rest can come in whatever order tells the story best.

| section            | job                                                                        |
|--------------------|----------------------------------------------------------------------------|
| `hook`             | The first seconds. A bold, true claim. Opens a loop.                       |
| `mechanism`        | Where the hazard came from, why it could not be sensed, why it felt safe.  |
| `incident`         | What happened, played out, with the viewer knowing more than the people.   |
| `stoppable_moment` | The moment it could have been stopped.                                     |
| `lesson`           | How you don't die. One thing a viewer can act on.                          |
| `tribute`          | Those who died, and the mission line.                                      |
| `signoff`          | "Don't die at work today."                                                 |

**Who this is for, and the voice.** People who do this work. Nick does it: he opens live 480 V
panels without the full suit, because nobody wears it and an arc flash is rare. So never "they
broke the rules, don't break the rules". The truth is that they did what everybody does, nothing
had ever gone wrong, and that is exactly why it killed them. Find the facts in the report that show
why it felt normal (how long it had been that way, what was and was not posted, what everyone else
was doing), and say what the report could not establish.

Format: YouTube Short, 1080x1920, 30 fps, **about 1:30 to 2:00** (Nick lifted the 60 s cap on
2026-11-21; YouTube allows Shorts up to 3 minutes). The build fails over the `max_runtime_s` set in
the video's `script.json`. Narrate at a natural pace: cut 1 was sped up to 186 words a minute to
fit eight sections under 60 s, and it showed.

## Retention playbook

Starting point: the leaked MrBeast production memo, "How to succeed in MrBeast production" (2024).
References Nick supplied: the memo summary by Simon Willison and the memo text via Alexander Jarvis.

Cut 1 followed "fast progression, no dwelling on setup" to the letter and came out as a rushed
summary. That advice is for challenge videos. In a tragedy the tension *is* the dwelling: show the
viewer what the people in the story cannot see, then let them carry on.

- The first minute is everything; make the opening the most engaging part.
- Match the promise: the opening delivers what the title and thumbnail set up, immediately.
- Open loops early, close them later; keep at least one unresolved until the payoff.
- Re-hook constantly: every few seconds in a Short, something new (question, twist, escalation).
- Fast progression. No dwelling on setup.
- No dull moments. Every second earns its place.
- Satisfying payoff, then end. No long outros.
- Measure it: average view duration and percentage viewed are the scores.
- Keep learning: add findings here **with their source**. Unsourced tips do not go in.

How video 001 (cut 2) applies it: the hook promises two deaths and a killer you are breathing; the
viewer is shown the gas in the first five seconds and the men are not; the gas is drawn, then
switched off on "it stops looking dangerous"; a new picture every two to three seconds.

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
    src/engine/           reusable across videos: theme, timing maths, captions, HUD kit
    src/engine2d/         the diagram look: 2D camera, the safety-sign figure rig
    src/v001/             one folder per video: drawing, actors, direction, cards, overlay
    tools/                stills.mjs (look-dev), frames.mjs (final render), cues.mjs,
                          sheet.py / strip.py (contact sheets for review)
  videos/<nnn>-<slug>/
    source/               the official report, as downloaded
    script.json           narration, on-screen text, claims; the single source of truth
    arrangement.py        where this video places the sound instruments on its cue sheet
    claim-map.md          generated: every line next to its quote and page (for spot-checks)
    upload.json           title, description, tags, disclosure flag
    assets/               voice.wav, timings.json, cues.json, score.wav, mix.wav
    render/               final.mp4, thumbnail.jpg  (frames/ is never committed; final.mp4 is
                          committed with `git add -f` only once Nick approves the cut: ~45 MB each)
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

Rendering takes about 15 minutes for a two-minute video (`DDAWT_CONCURRENCY=4`). Always check a
contact sheet of stills before a full render, and motion strips (`tools/strip.py`) after it.

## How the animation is put together

The look is a **diagram**: an engineering cross-section drawn to the report's dimensions, with the
people as figures from a safety sign. Pure SVG through Remotion. Cut 1 was a 3D reconstruction with
mannequin figures; Nick called it "scuffed", and code-generated 3D people cannot reach the bar. Its
code is in git history (commit `3242bb1` and earlier) if 3D is ever wanted again.

- **Everything is a pure function of time.** No state, no simulation; any frame renders alone.
- **The voice drives the picture.** `voice.py` writes word timings; `timeline.ts` turns them into
  named cues. Cuts, graphics and sound all hang off those. Re-record the voice and the film retimes.
- **Draw to the report's dimensions** and record them in `dims.ts` with the figure they came from.
- **Show the viewer what the people cannot see.** The hazard is drawn (cyan for the invisible gas)
  from the start; that is where the tension comes from.
- **Explain with cards.** Anything that is an idea rather than an event (a statistic, how the gas
  works on the body, the rule that was skipped) gets its own full-screen card.
- **Show what the report shows.** Where it gives the investigators' conclusion rather than a
  witnessed fact, say so on screen ("CSB: MOST LIKELY"). Where nobody knows, cut to black and say
  that. Anything shown but not narrated still needs a claim in `script.json`.
- **All on-screen text comes from `script.json`** through `os()`; nothing factual is typed into a
  component, and no number counts up.
- **Captions** are word-synced, two or three words at a time, inside the Shorts safe area.
- **Palette:** near-black night, hazard yellow for the brand and the first man, cyan for the gas,
  red for danger and for what was missing.

## Voice

Kokoro-82M (`am_michael`, near natural speed), run locally: free, no API key, Apache-2.0. `voice.py` checks
every word with a speech recogniser that has never seen the script and flags anything it mishears;
rewrite the line until it passes. An AI cannot hear the result: **the voice is the part that most
needs a human ear.** Swapping to a paid voice is a change to `voice.py` only, and counts as a new
tool (needs Nick's approval).

## Working with Nick

- **Push back.** Nick asked for this directly (2026-11-21, reviewing the first cut of 001): do not
  just agree with his feedback. He describes his notes as his interpretation, "not necessarily
  correct". Give an independent view, say where you disagree and why, and only then change things.
- **His ideas are inputs, not instructions.** Same day: "I can't give you ideas without them being
  incorporated into what the final product is." Take the point behind an idea, check it against the
  report, and make the call yourself. Do not bolt each suggestion on.
- **Decide and show.** He responds to a finished cut far better than to questions. Do not ask him
  to approve details; build it on your own judgment and let him react.
- **Rules are not a substitute for thinking.** Cut 1 met every rule and was shallow. If the rules
  are producing a bad video, say so before building, not after.
- His bar for the picture is "top echelon", not "decent". A cut that merely works is not done.

## Guardrails

- Small, scoped tasks. Never "build the whole channel".
- The build fails automatically if a source is missing, a claim is unsourced, a number is not in
  its quotes, a required section is absent, a victim is named, or the runtime is over the limit.
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
