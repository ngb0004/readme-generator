"""Write upload.json for the special from script.json (sources) and timings.json (chapters)."""
import json, sys
from pathlib import Path
video = Path(sys.argv[1])
script = json.loads((video / "script.json").read_text())
timings = json.loads((video / "assets" / "timings.json").read_text())

CHAPTER = {
    "cold": "68 barrels under a mound of dirt", "what": "What lead azide is", "surplus": "Why there is a stockpile",
    "storage": "How it has to be stored", "timeline": "Who knew, and when", "failure": "How it went bad",
    "decision": "The decision to detonate", "zone": "Where the dust goes", "ours": "Our own map", "evac": "Who leaves, who stays",
    "lead": "Why lead matters", "farms": "The farms", "ending": "What nobody knows yet", "thanks": "One more thing",
}
def stamp(t):
    t = int(t)
    return f"{t // 60}:{t % 60:02d}"
starts = {}
for b in timings["beats"]:
    starts.setdefault(b["section"], b["start"])
chapters = [f"{stamp(0 if s == script['sections'][0] else starts[s] - 0.3)} {CHAPTER[s]}" for s in script["sections"]]
chapters.append(f"{stamp(timings['speech_end'] + 0.6)} Sources")

OFFICIAL = {
    "army_announce": "U.S. Army announcement, Nov. 24, 2026",
    "army_advisory": "U.S. Army public safety advisory, Nov. 24, 2026",
    "army_nov15": "U.S. Army public advisory, Nov. 15, 2026",
    "epa_notice": "U.S. EPA public notice on the emergency permit",
    "epa_letter": "U.S. EPA letter to Gov. Reynolds, Nov. 20, 2026",
    "paper": "\"Complexities of Lead Azide\", U.S. Army safety officer, 1984 (DTIC ADP004872)",
    "nws": "National Weather Service forecast for the plant, issued 6:26 p.m. CST, Nov. 24",
}
NEWS = {"ap_wednesday": "Associated Press via PBS News", "ap_brace": "Associated Press via PBS News", "ap_whattoknow": "PBS News",
        "ipr_residents": "The Midwest Newsroom / Iowa Public Radio", "beef": "Beef Magazine (Iowa Beef Center)", "cbs2_gov": "CBS 2 Iowa"}
official = [f"{OFFICIAL[s['id']]}\n{s['url']}" for s in script["sources"] if s["kind"] == "official"]
news = [f"{NEWS.get(s['id'], s['publisher'])}\n{s['url']}" for s in script["sources"] if s["kind"] != "official"]

description = f"""Today, Wednesday, November 25, 2026, at about 9 a.m. Central, the Army plans to detonate 68 barrels of lead azide where they sit in southeast Iowa: more than 9,700 pounds of an explosive so sensitive it cannot be moved. Its own advisory says the dust will contain lead.

Finished the night before the detonation: what lead azide is, why the whole U.S. stockpile ended up in Middletown, what an Army safety officer wrote down in 1984, how the barrels went bad, who was told what and when, where the dust is headed, and what it could mean for families and farms. We will update this when the sampling results are in.

Every factual line is tied to a quote from a source below; the source is named on screen while the line plays. Lines marked COMMENTARY are opinion. The Army's maps are drawn as schematics of what was reported. "Our own map" is our estimate of where the National Weather Service's forecast wind carries the cloud, hour by hour; it is not an official map and says nothing about lead levels. If you live near Middletown, follow the Army and your county emergency management, not a YouTube video.

{chr(10).join(chapters)}

OFFICIAL DOCUMENTS
{chr(10).join(official)}

NEWS REPORTING
{chr(10).join(news)}

Narration is an AI voice. The animation is an explainer, not footage."""

upload = {
    # Until the blast has happened. Nick's line was "it's raining lead in IOWA today!"; "about to" and
    # "dust" make it true (the Army's own words: "a dust plume that will contain some lead").
    # Switch to title_after once it has gone off.
    "title": "It's About to Rain Lead Dust in Iowa TODAY. The Army Is Doing It on Purpose.",
    "title_after": "Five Tons of Neglect: The Army's Lead Bomb in Iowa",
    "description": description,
    "tags": ["lead azide", "Middletown Iowa", "Iowa Army Ammunition Plant", "controlled detonation", "lead dust", "lead exposure",
             "U.S. Army", "EPA", "Iowa", "Missouri", "Illinois", "explainer", "Iowa detonation", "lead dust cloud", "plume map"],
    "categoryId": "27",
    "privacyStatus": "public",   # Nick, 2026-11-25, before the blast: "don't go private fucking send it"
    "selfDeclaredMadeForKids": False,
    "containsSyntheticMedia": True,
    "notes": ("A long-form special, outside the channel's workplace-incident lane (see CLAUDE.md, Specials). categoryId 27 = Education. "
              "containsSyntheticMedia is YouTube's altered/synthetic content disclosure: the voice is synthetic and the picture is an animated explainer. "
              "Chapter times come from assets/timings.json (the start of each section); regenerate them if the narration is re-recorded. "
              "Edition: " + script["edition"] + ". Published straight to public on Nick's instruction, without a listen-through first."),
}
(video / "upload.json").write_text(json.dumps(upload, indent=2, ensure_ascii=False) + "\n")
# The same text laid out for pasting into YouTube Studio by hand, until the upload step is built.
(video / "youtube-upload.txt").write_text(
    "TITLE (use this until the blast has happened)\n\n" + upload["title"]
    + "\n\n\nTITLE AFTER THE BLAST (switch to this in YouTube Studio once it has gone off)\n\n" + upload["title_after"]
    + "\n\n\nDESCRIPTION (paste into Description)\n\n" + description
    + "\n\n\nTAGS (paste into Tags, under Show more)\n\n" + ", ".join(upload["tags"]) + "\n")
print(description)
print(len(description), "characters (YouTube's limit is 5,000)")
