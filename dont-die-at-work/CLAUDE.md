# Don't Die at Work Today

A YouTube channel. **Goal: 100,000 subscribers.** Everything here serves that one number.

Short, animated reconstructions of documented workplace fatalities and serious injuries:
what happened, why, and how you don't die.

## The lane

- OSHA workplace incidents only. If an idea is not a documented workplace incident, it is rejected.
- **Approved sources, and no others:** OSHA fatality inspection records, NIOSH FACE reports
  (federal and state), Chemical Safety Board (CSB) investigations.
- No murders, no politics, no kids' content, no off-topic videos.
- **Specials** are the one exception: a film outside the lane that Nick asks for by name. They
  live in `specials/`, are not numbered channel videos, and have their own source rule (see
  Specials, below). A special does not widen the lane.

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

**The spine of every video** (Nick, 2026-11-21, after cut 2 still called it "this refinery tank"):
"It's not interesting to me that two guys went into a tank and they died. It's interesting to know
what the tank is, what its goal is, how it works, and then how two guys died." So, in this order:

1. What the thing is.
2. What it is for (its goal), in terms of something the viewer uses.
3. How it works.
4. Why people have to work on it, and what makes that work dangerous.
5. What these people were doing.
6. Why it killed them: what they did not know, what was skipped, what nobody had flagged.

**Assume the viewer knows nothing.** No trade words without saying what they mean. That means
naming the thing and explaining it, not hiding it: cuts 2 to 4 said "a material that makes that
happen", and Nick asked (2026-11-22) "why does it say just material... dumb it down but still give
people some good info". Now: "pellets called catalyst. They're what break the oil apart." If a
line would not make sense to someone who has never seen a refinery, a barge or a grain silo,
rewrite it. Background on how the equipment
works may come from OSHA, NIOSH or CSB reference documents (for 001, OSHA's Technical Manual on
refining), saved and cited like any other source.

**Practical, not technical.** Nick on cut 3 (2026-11-21): "very technical... but it's not
practical. It's not explaining why they were doing the things that they were doing and what they
didn't understand." Steps 5 and 6 of the spine are the heart of the video, not a coda. Say what the
people believed, what nobody had told them, and the exact thing that turned an ordinary action
into a fatal one (for 001, his words: "there is a tank that is spewing nitrogen, and it is insanely
dangerous to have your head anywhere near the opening"). Then say how the viewer avoids it. Give
the reason behind the rule, not the rule: everyone in the story already knew the rule.

Required sections (enforced by `pipeline/verify.py`). The video opens on `hook` and closes on
`tribute` then `signoff`; the rest can come in whatever order tells the story best.

| section            | job                                                                        |
|--------------------|----------------------------------------------------------------------------|
| `hook`             | The first seconds. A bold, true claim. Opens a loop.                       |
| `mechanism`        | What the thing is, its goal, how it works, why people work on it; where    |
|                    | the hazard came from, why it could not be sensed, why it felt safe.        |
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

Nick on the audience (2026-11-21). They are told that everything is dangerous, every month, in
training videos they click through: "you've watched so many videos, you don't actually know about
anything", and "nobody understands how dangerous it is until it goes south and somebody dies". The
channel is that death, told well enough to stick, for people who were not there. He calls the aim
risk management: the job is risk, so a video cannot say "avoid risk"; it shows which part of the
job is the part that kills. And it is "for the masses": "something that somebody completely
outside of this genre would understand and find interesting."

Format: YouTube Short, 1080x1920, 30 fps, **under 3:00**, which is YouTube's limit for a Short
(Nick lifted the 60 s cap on 2026-11-21 and asked for the full explanation). Cut 4 of 001 runs
2:52; treat that as the ceiling, not the target. The build fails over the `max_runtime_s` set in
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

How video 001 (cut 4) applies it: the hook promises two deaths and a killer you are breathing; the
viewer is shown the gas leaking out of the open hole and the men are not; each stretch of the
middle adds one thing the men had not been told (no sign, the permit, the training, why you cannot
hold your breath); a new picture every two to three seconds.

## Daily loop

1. **Research and pick.** Dig through the approved sources and commit to the most shocking,
   well-documented incident. No pitch list, no approval step. Prefer reports that print the human
   reasons (what the crew discussed, what the permit said, who saw what): CSB investigations and
   NIOSH FACE reports do; a bare OSHA citation rarely does.
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
    src/lead/             the first long-form special (16:9): stage, kit, drawings, one file per
                          scene, and dev/ entries that render one scene on its own
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
  specials/<slug>/        a long-form film outside the lane; laid out like a video. Not committed:
                          source/news/ (articles are quoted, not redistributed), assets/voice.wav
                          (about 78 MB; voice.py rebuilds it) and render/final.mp4 (too big for git)
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

Some mistakes get past the recogniser, because it hears the wrong word and writes the right one.
Found on the first special: Kokoro reads the metal "lead" as "leed", says "EPA" and "FEMA" as
words, and reads "1984" as "nineteen hundred eighty-four". For any word with two readings, any
acronym and any year, look at the phonemes (`Kokoro(...).tokenizer.phonemize(text)`), and put a
respelling in the beat's `say` field ("led", "E.P.A.", "nineteen eighty-four"). Captions and
claims keep using `narration`. `voice.py` also keeps each beat's audio in `assets/.voice-cache/`,
so a re-run only records the lines that changed.

**Pauses.** Nick, on the first Short of the special (2026-11-25): "why do you sometimes have
these super unnatural pauses?" The engine picks the length of every stop itself, from the
punctuation. Measured on that film, word to word: 0.40 s between two beats and 0.54 s at a full
stop inside a beat (medians), which is fine; 0.22 s at a typical comma, but 37 of 116 commas got
0.35 s or more, as long as the break between two sentences. The worst are the commas around an
aside: "so sensitive that, [0.40] the Army says, [0.42] slight friction or movement can set it
off". The recogniser cannot catch this (the words are right) and I cannot hear it, but
`timings.json` shows it, and I had not looked. So: do not wedge an attribution between two commas
(put "the Army says" first, last, or in its own sentence); no comma straight after "that"; and
before any render, list the stops inside each beat from `timings.json` and rewrite every line
where a comma got more than about 0.3 s.

**Nick's verdict on the voice** (2026-11-25, after hearing the first Short): "right now you sound
like a straight fucking AI... we just have to figure out in the future how to make you sound more
natural and less AI". Fixing the pauses will not change that: the engine reads flat, with no
emphasis. What would, in the order I would try them (my ranking, not his decision): Nick reads
the script into his phone and the picture is timed to his recording; a paid voice, possibly a
clone of his own, which is a new tool and needs his approval and a key; and with either one,
lines written to be spoken (short, contractions, his rewrites). He has not chosen.

## Working with Nick

- **Push back.** Nick asked for this directly (2026-11-21, reviewing the first cut of 001): do not
  just agree with his feedback. He describes his notes as his interpretation, "not necessarily
  correct". Give an independent view, say where you disagree and why, and only then change things.
- **His ideas are inputs, not instructions.** Same day: "I can't give you ideas without them being
  incorporated into what the final product is." Take the point behind an idea, check it against the
  report, and make the call yourself. Do not bolt each suggestion on.
- **Decide and show.** He responds to a finished cut far better than to questions. Do not ask him
  to approve details; build it on your own judgment and let him react.
- **He is in the field; you are not.** He was an engineer and now works as a mechanic. When he
  describes how crews behave, that is evidence, not a claim to balance. On 2026-11-21 I guessed
  that training videos get skipped because they talk down, and softened his point about education;
  he corrected both ("they don't talk down... people don't care"). Push back with the report, not
  with guesses or politeness.
- **When the talking has done its job, build.** The same night, after a long conversation: "we're
  getting into the weeds... I believe that you are capable of creating a good video." (I read that
  as the go-ahead for cut 4; that reading is mine.)
- **Caution is not a reason to do less.** On the first special I refused his idea of an
  independent plume map because a bad one could mislead people, and offered the Army's maps
  instead. He overruled it, bluntly (2026-11-25, see Specials). The lesson I take from it (my
  reading): when an idea carries a risk, the answer is to do it rigorously and label it, and to
  say exactly which part cannot be done honestly, not to fall back on the official account.
- **He writes the last draft of the words.** After the first special (2026-11-25): "the script is
  so hard. Like I almost need to do the talking... You need to give me a baseline script... I'm
  gonna make it my own a little bit, and then you can clean it up." So: send him the baseline as
  plain text, one line per row; he rewrites what he wants; then check every changed line against
  the sources, fix the length, and re-record only those lines. "Ideally, I don't have to do the
  script every time, but it would make the videos better if I did." Keep his rewrites: they are
  the best guide to how the next baseline should sound. He has also been offered the option of
  recording the narration himself (the picture can be timed to his voice); he has not answered.
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

## Specials

A special is a long-form film outside the lane, made because Nick asked for that film. The first
is `specials/five-tons-of-neglect`: the Army's detonation of its lead azide stockpile at
Middletown, Iowa. Nick handed over a full draft script on 2026-11-24, the night before the blast,
and said "build this video". Building it as a special and not as channel video 002 was my call
(it is not a workplace death and there is no OSHA, NIOSH or CSB report); where it gets published
is his.

What is different for a special (`"lane": "special"` in `script.json`; `verify.py` enforces it):

- **Sources** are official documents and news reporting, each with its URL. Official documents
  are saved in `source/` with a checksum. News articles are quoted, not redistributed: the copies
  the gate checks against sit in `source/news/`, which is not committed. A source that could not
  be fetched at all is marked `"check": "search"`, and the gate reports its quotes as not
  re-checked. Keep those rare, and tell Nick which lines rest on them.
- **Every factual line still maps to a verbatim quote**, and the stage names the publisher in the
  corner while the line plays.
- **Opinion is allowed, and labelled.** A beat marked `"exempt": "opinion"` carries no claims
  and no numbers, and the corner reads COMMENTARY while it plays. Nick's draft was written as a
  "pissed-off citizen"; the anger goes in those lines and the facts stay checkable. The people
  who disagree with the film's argument get their best point too (here: the scientists who expect
  little harm far from the plant, and the court, governor and mayor who backed the blast).
- **Check the draft before building it.** His script is an input like any other idea. The first
  draft had three facts wrong and several that could not be confirmed (`performance-log.md`).
- **Our own estimates are allowed, done properly.** I first ruled out a homemade dust map for
  this film, on the grounds that it could send someone the wrong way. Nick overruled that
  (2026-11-25): "We can make our own fucking plume map... It doesn't have to be only what the
  army says... we're doing it based on all of our research." He was right, and the film's own
  argument says so: the Army had not shown how its maps were made. The rules that came out of it:
  every input is public and saved in `source/`; the arithmetic is one file beside the script
  (`estimate.py`, result in `estimate.json`), and `verify.py` re-runs it; a line that states our
  result is marked `"exempt": "estimate"`, may say only the figures that file lists, and shows
  OUR ESTIMATE in the corner; the picture is drawn from `estimate.json`, not by hand. And it
  estimates only what the inputs support. Here that is where the forecast wind carries the cloud
  and when. It is not how much lead is in it: nobody outside the Army has that number, so the
  film says so instead of inventing one. What the authorities published is still shown, drawn
  as a schematic and labelled as theirs.
- **Leave out how-to detail for anything dangerous.** The film says what the explosive is and why
  it went bad. It does not explain how it is made, treated or neutralised, and it has no drawing
  of a munition's insides: a builder asked to draw a shell in cutaway was stopped by the model's
  safety filter (2026-11-25). Type, hazard signs and the storage drums told that part instead.
- **Investigations start from someone's claim.** Nick, 2026-11-25: "all investigative videos I
  create are created because of morons like this where I'm forced to fact check them and get the
  real facts". He wants this to be a staple, under a name like "Peak Moron Investigator", and to
  name public figures ("I can investigate Tucker Carlson... and say his name proudly"). How the
  first one handled it: the claim is quoted exactly ("We are under attack!!"), answered with a
  sourced line, and the insult ("peak moron") is spoken about the claim and marked as commentary.
  The frame of his reel is on screen with the stamp across it. I had left the picture out twice
  (a frame of someone else's video gives them a takedown form on the day the film matters, and I
  had seen only that one frame); Nick overruled it: "I don't give a fuck if it gets pulled, we'll
  deal with that later, it's part of the channel!... it's a 2 second public image of something he
  posted, it's fair use." He had seen the reel and the risk is his to take, so it went in. For
  the next one: when he asks for the person's post on screen, put it on screen, say once what it
  risks, and move on. The frame he supplies stays out of git (`studio/public/reel/`). The man is
  not named and nothing is said about him beyond what is in the frame. The workplace-death
  videos must not sit under the "moron" name.
- **Say which edition it is.** A film finished before the event says so on screen and in the
  description, and gets a new ending when the facts are in.
- **Sections** are whatever the film needs (`"sections"` in `script.json`), not the Short's seven.
  1920x1080. There is no length target beyond `max_runtime_s`: long is fine, slow is not.

Building one:

- `make_script.py` in the special's folder writes `script.json` (it is far easier to edit than
  the JSON); `make_upload.py` writes `upload.json`, with chapter times from the narration.
- One scene per section in `studio/src/lead/scenes/`, each with a `dev/` entry that renders it
  alone. Scenes can be built in parallel, but not many at once: six builders at full effort ran
  the account into its five-hour usage limit in about twenty minutes (2026-11-25) and everything
  stopped for half an hour. Two or three at a time, each told to write its file to disk before
  anything else; the drafts on disk are what survived that night's two machine restarts.

```bash
.venv/bin/python specials/five-tons-of-neglect/make_script.py specials/five-tons-of-neglect
.venv/bin/python pipeline/build.py specials/five-tons-of-neglect
(cd studio && DDAWT_ENTRY=src/lead/dev/zone.tsx node tools/stills.mjs LeadDev /tmp/stills 0.5 480s 500s)   # one scene alone
```

## Upload

`pipeline/upload.py <video folder>` sends `render/final.mp4` with the title, description, tags and
flags from `upload.json`, sets the thumbnail, and writes `upload-result.json`. It uploads as
Private unless `upload.json` says otherwise: Nick watches it and publishes it himself.

**Check the rule on the day, and find out what Nick is looking at (2026-11-25).** On the first
night I told Nick the film and five Shorts were "uploaded and scheduled". He opened Studio on the
Shorts tab three minutes after the Shorts went up, saw nothing, and said so. I then made it
worse. From memory and one stale search result I told him that YouTube locks every upload from
an unaudited API project as private, that the videos were on some other channel, and that he had
to upload all six files by hand. I had checked none of it. The lock rule was withdrawn on
2026-11-02: YouTube's own API description says "Videos uploaded from unverified API projects are
not restricted to private viewing mode." He lost two hours of that night to a rule that no longer
exists, after spending an hour giving me the access. What to do differently:

- My memory of YouTube's rules is older than the rules. Before telling Nick what YouTube will or
  will not do, read the live API description
  (`https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest`, which this environment can
  fetch) and the revision history, and say which one the statement rests on.
- When he says "I can't see it", find out what he is looking at before explaining why it failed.
  Scheduled videos are in Studio, Content, the **Videos** tab, with "Scheduled" in the Visibility
  column; a new Short can sit there too until YouTube has sorted it. The public channel page
  shows nothing until the release time, and a private link opens only for the signed-in owner.
- A video id in the reply means YouTube took the file. The upload-only sign-in cannot read
  anything back: not the channel, not the status. Ask for a sign-in that can (scope
  `https://www.googleapis.com/auth/youtube`), read the status back, and report that.
  `upload.py` writes the channel's name from the reply into the result.

How the sign-in works (set up with Nick on 2026-11-25; nothing secret is in the repository):

- Nick's Google Cloud project is called "Oauth". The YouTube Data API v3 is enabled there, and the
  uploader app is the OAuth client "Web client 4" (redirect address
  `https://developers.google.com/oauthplayground`). Its ID and secret are saved by Nick as a
  network secret on the cloud environment for `oauth2.googleapis.com`; the proxy adds them to
  token requests and they are never visible in a session.
- Nick's grant for his channel is made by sending him the consent link (the client ID, that
  redirect address, scope `https://www.googleapis.com/auth/youtube.upload`, `access_type=offline`,
  `prompt=consent`). He clicks Allow, lands on the Playground page and pastes its address into the
  chat. The `code` in it is exchanged at once at `https://oauth2.googleapis.com/token` and the
  reply is saved to a private file outside the repository; `YT_TOKEN_FILE` points the script at it.
  The code is single-use and dead after the exchange. Never print a token.
- The grant file lives only on the session's machine. While the Google app is in "Testing" the
  refresh token expires after seven days, and a new machine has no grant file at all, so expect
  to send Nick the link again: it takes him about thirty seconds. Making it permanent needs the
  app published in Google Cloud (Audience, Publish app) and the refresh token stored by Nick in
  the environment's settings; not done yet.
- Uploads go to whichever account Nick picked on the Allow screen. A different channel means a
  new grant. **He has two Google accounts with a YouTube channel each:** a personal one under his
  own name, and the channel account (renamed "Peak Moron Investigator" on 2026-11-25). The first
  grant was made on the personal one, so the film and five Shorts landed there, and he spent
  hours looking for them on the other. The consent link now carries
  `prompt=select_account consent`; tell him which account to pick, and read the channel's name
  back to him before uploading anything.
- Lesson from that night: a secure card for a secret closes if he sends a chat message while it
  is open. Tell him to fill it in before typing. And ask for screenshots only of pages where the
  secret is hidden; the "client created" box shows it in full.

## Shorts from a film

`pipeline/shorts.py <video folder> [id]` cuts the Shorts listed under `"shorts"` in `script.json`
out of the finished film: each runs from one beat to another inside one section, with the film's
own narration, sound and picture. The film is drawn wide, so the picture sits in a band across
the middle (`studio/src/lead/Short.tsx`), with the thumbnail's headline above and phone-sized
captions below. A Short marked `"day_of"` carries the hour of the event and must go out before
it. Nick asked for these on 2026-11-25 to get the film traction; none is posted without his say.

`pipeline/shorts.py <video folder> --upload` sends each one with its own `title` and `publish_at`
from that list: YouTube holds it private and releases it at that time. The description is the
Short's `blurb` plus a link to the full film (read from `upload-result.json`, so the film goes up
first). Each upload writes `upload-result-short-<id>.json`. The first five went out forty minutes
apart, after the film and before the event (Nick: "go, all 5"). The sign-in can only upload: a
title, a thumbnail or a release time cannot be changed from here afterwards, only by Nick in
YouTube Studio. So check the title and the time before sending, not after.

## Not built yet

- **Upload: built on 2026-11-25** (`pipeline/upload.py`; see Upload, above). Still to do: make the
  sign-in permanent (it lasts seven days while the Google app is in "Testing").
- **Analytics pull** (YouTube Analytics API): views, CTR, average view duration, retention curve,
  subscribers gained, at 48 h and 7 d, into `videos/<id>/analytics/`.
- **Long-form** deep dives for the channel itself. The 16:9 stage built for the first special
  (`studio/src/lead`) is the place to start.

## Milestones

- 1,000 subscribers: the format works; apply for the YouTube Partner Program once eligible.
- 10,000: add long-form deep dives.
- 100,000: the goal. Then decide what's next.
