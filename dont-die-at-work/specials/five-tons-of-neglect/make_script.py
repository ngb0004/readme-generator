"""Writes specials/five-tons-of-neglect/script.json. Edit the film's words, claims and on-screen text here, then run:

    .venv/bin/python specials/five-tons-of-neglect/make_script.py specials/five-tons-of-neglect
    .venv/bin/python pipeline/verify.py specials/five-tons-of-neglect

script.json is what the gate, the voice and the animation read."""
import hashlib, json, sys
from pathlib import Path

video = Path(sys.argv[1])
RET = "2026-11-24"

def off(id, publisher, title, url, published, file):
    return {"id": id, "kind": "official", "publisher": publisher, "title": title, "url": url, "published": published,
            "retrieved": RET, "file": file, "sha256": hashlib.sha256((video / file).read_bytes()).hexdigest()}

def news(id, publisher, title, url, published, local):
    return {"id": id, "kind": "news", "publisher": publisher, "title": title, "url": url, "published": published,
            "retrieved": RET, "local": "source/news/" + local}

def srch(id, publisher, title, url, published):
    return {"id": id, "kind": "news", "publisher": publisher, "title": title, "url": url, "published": published,
            "retrieved": RET, "check": "search"}

A = "https://www.army.mil/article/"
sources = [
    off("army_announce", "U.S. Army", "Army announces controlled detonation of degraded explosive material at Iowa Army Ammunition Plant",
        A + "297069/army_announces_controlled_detonation_of_degraded_explosive_material_at_iowa_army_ammunition_plant", "2026-11-24", "source/army-announces-detonation.html"),
    off("army_advisory", "U.S. Army Sustainment Command", "Public Safety Advisory: Controlled, Mitigated Detonation of Unstable Lead Azide at Iowa Army Ammunition Plant",
        A + "297039/public_safety_advisory_controlled_mitigated_detonation_of_unstable_lead_azide_at_iowa_army_ammunition_plant", "2026-11-24", "source/army-public-safety-advisory.html"),
    off("army_nov15", "U.S. Army Sustainment Command", "IAAAP Public Advisory", A + "296772/iaaap_public_advisory", "2026-11-15", "source/army-iaaap-public-advisory.html"),
    off("army_openhouse", "U.S. Army Sustainment Command", "IAAAP hosts open house, shares Lead Azide detonation information", A + "296388", "2026-10-28", "source/army-open-house-oct.html"),
    off("epa_notice", "U.S. Environmental Protection Agency, Region 7", "Public Notice: Iowa Army Ammunition Plant, Middletown, Iowa",
        "https://www.epa.gov/ia/iowa-army-ammunition-plant-middletown-iowa-3", "2026-11-16", "source/epa-public-notice.html"),
    off("epa_profile", "U.S. Environmental Protection Agency, Region 7", "Site Profile: IAAAP Lead Azide",
        "https://response.epa.gov/site/site_profile.aspx?site_id=17211", "2026-11", "source/epa-osc-site-profile.html"),
    off("epa_letter", "U.S. Environmental Protection Agency, Region 7", "Letter from Regional Administrator Jim Macy to Governor Kim Reynolds",
        "https://response.epa.gov/sites/17211/files/R7%20Letter%20to%20Governor%20Reynolds.pdf", "2026-11-20", "source/epa-letter-to-governor-reynolds.pdf"),
    off("nws", "National Weather Service", "Gridpoint forecast for the Iowa Army Ammunition Plant (Quad Cities office, cell 45,33), issued 6:26 p.m. CST, Nov. 24, 2026",
        "https://api.weather.gov/gridpoints/DVN/45,33", "2026-11-24", "source/nws-gridpoint-dvn-45-33.json"),
    off("paper", "U.S. Army, Savanna Army Depot Activity (via DTIC)", "Complexities of Lead Azide (William Shaneyfelt), DDESB Explosives Safety Seminar, DTIC ADP004872",
        "https://archive.org/details/DTIC_ADP004872", "1984-08-29", "source/dtic-adp004872-excerpts.txt"),
    news("kcrg_how", "KCRG", "How did we get here? Army prepares controlled blast of lead azide stockpile in Iowa",
         "https://www.kcrg.com/2026/11/24/how-did-we-get-here-army-prepares-controlled-blast-lead-azide-stockpile-iowa/", "2026-11-24", "kcrg-how-did-we-get-here.html"),
    news("kcrg_docs", "KCRG", "Documents show lead azide concerns at Iowa Army Ammunition Plant date back decades",
         "https://www.kcrg.com/2026/11/24/documents-show-lead-azide-concerns-iowa-army-ammunition-plant-date-back-decades/", "2026-11-24", "kcrg-documents-date-back-decades.html"),
    news("kcrg_march", "KCRG", "Iowa Army Ammunition Plant still on pause for safety reasons",
         "https://www.kcrg.com/2026/03/19/iowa-army-ammunition-plant-still-pause-safety-reasons/", "2026-03-19", "kcrg-march-still-on-pause.html"),
    news("kwqc_timeline", "KWQC", "From stockpile to crisis: Critical timeline behind Iowa detonation plans",
         "https://www.kwqc.com/2026/11/24/stockpile-crisis-critical-timeline-behind-iowa-detonation-plans/", "2026-11-24", "kwqc-timeline.html"),
    news("kwqc_expert", "KWQC", "Expert warns lead from Army detonation in Middletown could pose health risks",
         "https://www.kwqc.com/2026/11/17/expert-warns-lead-army-detonation-middletown-could-pose-health-risks/", "2026-11-17", "kwqc-expert-warns.html"),
    news("abc_timeline", "ABC News", "Iowa detonation timeline: What led up to controlled explosion of degraded lead azide",
         "https://abcnews.com/US/iowa-detonation-timeline-led-controlled-explosion-degraded-lead/story?id=138419343", "2026-11-24", "abc-timeline.html"),
    news("abc_mitigation", "ABC News", "Iowa governor issues emergency proclamation for 3 counties hours before controlled Army munition explosion",
         "https://abcnews.com/US/us-army-details-mitigation-plans-controlled-iowa-munition/story?id=138410668", "2026-11-24", "abc-mitigation-plans.html"),
    news("ap_wednesday", "Associated Press (via PBS News)", "Army plans to detonate Iowa stockpile on Wednesday, tells public there's no reason to panic",
         "https://www.pbs.org/newshour/nation/getting-court-approval-u-s-army-to-detonate-degraded-bomb-making-material-in-iowa-on-wednesday", "2026-11-24", "pbs-detonate-wednesday.html"),
    news("ap_whattoknow", "PBS News", "Trump told the Army to pause the detonation of 9,500 pounds of lead azide in Iowa. Here's what to know",
         "https://www.pbs.org/newshour/nation/trump-told-the-army-to-pause-the-detonation-of-9500-pounds-of-lead-azide-in-iowa-heres-what-to-know", "2026-11-24", "pbs-trump-pause-what-to-know.html"),
    news("ap_brace", "Associated Press (via PBS News)", "Iowans brace for lead dust cloud as Army plans to detonate 5 tons of bomb-making chemicals",
         "https://www.pbs.org/newshour/nation/iowans-brace-for-lead-dust-cloud-as-army-plans-to-detonate-5-tons-of-bomb-making-chemicals", "2026-11-19", "pbs-iowans-brace.html"),
    news("ipr_maps", "Iowa Public Radio", "Iowa lead detonation safety tips, public health recommendations, plume maps for Wednesday's detonation",
         "https://www.iowapublicradio.org/environment/2026-11-19/army-lead-detonation-public-health-safety-risks", "2026-11-24", "ipr-safety-tips-plume-maps.html"),
    news("ipr_residents", "The Midwest Newsroom / Iowa Public Radio", "What Midwest residents need to know about the lead azide detonations planned for this week",
         "https://www.iowapublicradio.org/ipr-news/2026-11-23/what-midwest-residents-need-to-know-about-the-lead-azide-detonations-planned-for-this-week", "2026-11-23", "ipr-what-residents-need-to-know.html"),
    news("ipr_reynolds", "Iowa Public Radio", "Army plans to detonate lead azide Wednesday morning, with Reynolds' support",
         "https://www.iowapublicradio.org/ipr-news/2026-11-24/reynolds-iowa-lead-azide-detonation-army-ammunitions-plant-ernst-grassley-middletown", "2026-11-24", "ipr-reynolds-support.html"),
    news("ipr_contractor", "Iowa Public Radio", "Army chose to blast unstable lead azide days after contractor submitted a chemical treatment plan",
         "https://www.iowapublicradio.org/environment/2026-11-24/army-blast-unstable-lead-azide-contractor-chemical-treatment-plan", "2026-11-24", "ipr-contractor-treatment-plan.html"),
    news("cbs_maps", "CBS News Chicago", "Maps show Iowa lead dust plume drifting southwest into Missouri Wednesday after detonation, Army shares",
         "https://www.cbsnews.com/chicago/news/maps-show-how-far-lead-dust-from-about-5-tons-of-iowa-explosives-could-spread/", "2026-11-24", "cbs-plume-maps.html"),
    news("cbs_why", "CBS News", "Why the Army says it needs to detonate unstable, lead-filled explosives in Iowa and what's at risk",
         "https://www.cbsnews.com/news/lead-azide-detonation-iowa-army-explosives/", "2026-11-24", "cbs-why-army-needs-to-detonate.html"),
    news("snopes", "Snopes", "Is US Army planning to detonate massive amount of lead azide in Middletown, Iowa?",
         "https://www.snopes.com/fact-check/lead-azide-detonation-army-iowa/", "2026-11-23", "snopes-fact-check.html"),
    news("wiki_azide", "Wikipedia", "Lead(II) azide", "https://en.wikipedia.org/wiki/Lead(II)_azide", "n.d.", "wikipedia-lead-azide.html"),
    news("wiki_minden", "Wikipedia", "Camp Minden", "https://en.wikipedia.org/wiki/Camp_Minden", "n.d.", "wikipedia-camp-minden.html"),
    srch("cbs2_gov", "CBS 2 Iowa (KGAN)", "Governor Kim Reynolds' office, state lawmakers respond to detonation plans",
         "https://cbs2iowa.com/news/local/governor-kim-reynolds-office-state-lawmakers-respond-to-detonation-plans", "2026-11"),
    srch("beef", "Beef Magazine, quoting the Iowa Beef Center at Iowa State University", "Army's planned lead detonation in Iowa poses risks for cattle",
         "https://www.beefmagazine.com/livestock-management/army-s-planned-lead-detonation-in-iowa-poses-risks-for-cattle", "2026-11"),
]

beats = []
def b(id, section, narration, on=(), claims=(), gap=0.28, exempt=None, say=None):
    d = {"id": id, "section": section, "narration": narration, "gap_after": gap, "onscreen": list(on),
         "claims": [{"claim": c[2] if len(c) > 2 else "", "src": c[0], "page": c[3] if len(c) > 3 else 1, "quote": c[1]} for c in claims]}
    if exempt:
        d["exempt"] = exempt
    if say:
        d["say"] = say
    beats.append(d)

# quotes used more than once
Q68 = ("army_announce", "approximately 68 drums, totaling more than 9,700 pounds net explosive weight, of stored lead azide inside earth-covered magazines", "68 drums, more than 9,700 pounds, in earth-covered magazines.")
Q5T = ("abc_timeline", "Nearly five tons of lead azide are set to be detonated", "Nearly five tons.")
QDATE = ("paper", "29 August 1984", "The paper's date.")
QSURV = ("paper", "Periodic surveillance is then required both visually to assure adequate liquid level and testing to determine if ethanol evaporation has reduced antifreeze properties.", "The liquid level has to be checked; the alcohol evaporates.")
QWET = ("paper", "its extreme sensitivity when dry necessitates under water storage", "Dry lead azide is too sensitive; it is stored under water.")
QFREEZE = ("paper", "if the water freezes, spontaneous detonation occurs, presumably due to ice crystal formation breaking lead azide crystals", "Freezing can set it off.")
QHALT = ("paper", "The electrolysis project was halted after approximately half the stockpile was destroyed.", "The Army's disposal project stopped about halfway.")
QUNCHECKED = ("ipr_contractor", "The government’s brief in support of this week’s detonation says the water-ethanol mixture used to keep the explosive stable had gone unchecked and unreplenished since September 2025.", "A government court brief: the liquid went unchecked and unreplenished from September 2025.")
Q5DAY = ("epa_letter", "11/15/2026 -- Army issued its 5-day advance public notification", "The public notice came five days ahead.", 4)
QMOVE = ("army_announce", "It prevents those barrels from being able to be moved.", "The barrels cannot be moved.")
QALERT = ("ap_wednesday", "told those up to 20 miles (32 kilometers) away to remain indoors with windows closed", "The phone alert: up to 20 miles away, stay indoors.")
QWETCLEAN = ("army_advisory", "wet-clean surfaces that may be contacted by infants or children, including outdoor play equipment, toys, tables and chairs", "Wet-clean what children touch.")
QTWO = ("army_nov15", "two consecutive, rapid detonations", "Two rapid detonations.")
Q350 = ("ipr_maps", "there are approximately 350 farms that could be impacted", "USDA: about 350 farms.")

# ------------------------------------------------------------------ 1. cold open
S = "cold"
b("cold-1", S, "Under these mounds of dirt in southeast Iowa, there are sixty-eight barrels.", ["MIDDLETOWN, IOWA", "68 BARRELS"],
  [Q68, ("epa_letter", "The drums are stored in two earth covered magazine (ECM) storage bunkers", "Two earth-covered bunkers.", 3)])
b("cold-2", S, "Inside them is nearly five tons of an explosive so sensitive that, the Army says, slight friction or movement can set it off.",
  ["LEAD AZIDE", "MORE THAN 9,700 LB"],
  [Q5T, Q68, ("army_advisory", "making it vulnerable to accidental detonation from even slight friction or movement", "Slight friction or movement can set it off.")])
b("cold-3", S, "It is the country's entire stockpile. And the Army says it cannot be moved.", ["THE ENTIRE U.S. STOCKPILE", "CAN'T BE MOVED"],
  [("ap_wednesday", "plans to detonate the nation's entire stockpile of lead azide in Iowa on Wednesday morning", "The nation's entire stockpile."), QMOVE])
b("cold-4", S, "So the plan is to blow it up. Right where it sits. Wednesday morning, nine a.m.", ["WEDNESDAY, NOV. 25", "9:00 A.M."],
  [("army_announce", "controlled, in-place detonation of degraded, crystallized lead azide at the Iowa Army Ammunition Plant on Wednesday, November 25, 2026, at approximately 9:00 a.m. CST", "In-place detonation, Nov. 25, about 9 a.m.")], gap=0.45)
b("cold-5", S, "The dust from that blast will have lead in it.", ["\"a dust plume that will contain some lead\"", "U.S. ARMY PUBLIC ADVISORY"],
  [("army_nov15", "a dust plume that will contain some lead", "The Army's own words.")], gap=0.5)
b("cold-6", S, "The town next door has been urged to leave. People up to twenty miles away were told to stay inside and shut the windows.",
  ["URGED TO LEAVE", "20 MILES: STAY INDOORS"],
  [("army_advisory", "FEMA is supporting the recommended relocation for all residents of Middletown, Iowa", "Relocation recommended for all of Middletown."),
   ("army_advisory", "Local and federal officials strongly urge community members to vacate the evacuation area", "Officials strongly urge people to leave."), QALERT])
b("cold-7", S, "And parents were told that when it's over, they should wash down the play equipment.", ["WET-CLEAN OUTDOOR PLAY EQUIPMENT, TOYS"],
  [QWETCLEAN, ("epa_letter", "Areas of concern should be cleaned with a garden hose, wet rag, or baby wipe.", "EPA's cleaning advice.", 3)], gap=0.6)
b("cold-8", S, "How did we get here? This was not a surprise. In 1984, an Army safety officer wrote down exactly how this would go wrong.", ["1984", "HOW DID WE GET HERE?"],
  [QDATE, ("paper", "Safety Officer,", "The author's job."), QSURV])
b("cold-9", S, "And the stuff has been sitting in storage ever since.", [],
  [("paper", "leaving the stockpile of bulk lead azide in deteriorating 55-gallon drums", "In drums in 1984."),
   ("kcrg_how", "This March, inspectors looked at the 68 barrels.", "Still in barrels in 2026.")], gap=0.7)
b("cold-title", S, "Five tons of neglect.", ["FIVE TONS", "OF NEGLECT", "THE ARMY'S LEAD BOMB IN IOWA"], [Q5T], gap=1.0)

# ------------------------------------------------------------------ 2. what it is
S = "what"
b("what-1", S, "To set off the main explosive in a shell or a bomb, you need a small, violent trigger first. A detonator.", ["MAIN CHARGE", "DETONATOR"],
  [("wiki_azide", "It is used in detonators to initiate secondary explosives", "Used in detonators to start other explosives."),
   ("abc_timeline", "an explosive compound used as a detonating agent for other explosives", "A detonating agent for other explosives.")])
b("what-2", S, "For about a hundred years, lead azide has been the stuff inside that trigger.", ["LEAD AZIDE", "IN U.S. MUNITIONS FOR 100 YEARS"],
  [("kcrg_how", "The U.S. started using lead azide 100 years ago to make munitions.", "In use for 100 years.")])
b("what-3", S, "It goes off from heat, from a knock, from friction. That is the whole point of it.", ["HEAT", "SHOCK", "FRICTION"],
  [("army_announce", "It's very sensitive to heat, shock, and friction", "The ATF director's description.")])
b("what-4", S, "A weapon only needs a tiny amount. A little cup of it, sealed inside the fuze.", [],
  [("snopes", "miniature lead azide and lead styphnate cups inside their sealed fuzes", "Miniature cups inside sealed fuzes.")])
b("what-5", S, "Now picture that little cup. Then picture sixty-eight barrels.", ["68 BARRELS"], [Q68], gap=0.5)
b("what-6", S, "And here is the strange part. The military stopped using it about fifteen years ago.", ["THE MILITARY MOVED AWAY FROM IT ABOUT 15 YEARS AGO"],
  [("kcrg_how", "It moved away from the chemical about 15 years ago because of how hard it is to store and move.", "The U.S. moved away from it about 15 years ago.")])
b("what-7", S, "So what is nearly five tons of it still doing in a bunker in Iowa?", [], [Q5T], gap=0.8)

# ------------------------------------------------------------------ 3. why there is a stockpile
S = "surplus"
b("sur-1", S, "The answer starts in that 1984 paper, written by the safety officer at an Army depot in Illinois.",
  ["COMPLEXITIES OF LEAD AZIDE", "SAFETY OFFICER, SAVANNA ARMY DEPOT ACTIVITY", "DDESB EXPLOSIVES SAFETY SEMINAR · 29 AUGUST 1984"],
  [("paper", "COMPLEXITIES OF LEAD AZIDE", "Title."), ("paper", "Savanna Army Depot Activity", "The depot."), ("paper", "Savanna, Illinois", "In Illinois."),
   ("paper", "DDESB Explosives Safety Seminar", "Presented to the DoD Explosives Safety Board's seminar."), QDATE])
b("sur-2", S, "It says the war in Vietnam drove the development of weapons that used lead azide in, quote, relatively enormous quantities.",
  ["Vietnam-era jungle warfare fostered the development of munitions using relatively enormous quantities of lead azide."],
  [("paper", "Vietnam-era jungle warfare fostered the development of munitions using relatively enormous quantities of lead azide.", "")])
b("sur-3", S, "But they were so sensitive that many of the people meant to use them did not want to.",
  ["Their sensitivity to detonation caused a reluctance among many users to deploy them"],
  [("paper", "Their sensitivity to detonation caused a reluctance among many users to deploy them, resulting in a stockpile of both munitions and bulk lead azide.", "")])
b("sur-4", S, "So when the war wound down, the military was left with a vast supply, and almost no demand.",
  ["a vast supply and an extremely small demand"],
  [("paper", "The winding down of hostilities left a vast supply and an extremely small demand.", "")])
b("sur-5", S, "They tried to sell it. Nobody bought it.", ["Early attempts to sell the stockpiled lead azide were fruitless"],
  [("paper", "Early attempts to sell the stockpiled lead azide were fruitless", "")], gap=0.5)
b("sur-6", S, "So the Army started destroying it. And then it stopped. The paper says the project was halted with about half the stockpile gone.",
  ["halted after approximately half the stockpile was destroyed"], [QHALT])
b("sur-7", S, "The other half stayed in drums. Drums that were already leaking. They were repacked, and the paper says that bought another ten to fifteen years.",
  ["another 10 to 15 years"],
  [("paper", "The remaining drums in storage began leaking more frequently due to corrosion and were finally repacked, giving them another 10 to 15 years before they will need repacking again.", "")], gap=0.5)
b("sur-8", S, "That was 1984.", ["1984"], [QDATE], gap=0.9)

# ------------------------------------------------------------------ 4. storage
S = "storage"
b("sto-1", S, "Here is how you store this stuff. Dry, it is too sensitive to keep. So it is kept wet: in barrels, under liquid, inside concrete bunkers buried in earth.",
  ["EARTH-COVERED MAGAZINE", "REINFORCED CONCRETE", "WATER + ALCOHOL"],
  [QWET, ("army_advisory", "a reinforced structure made of concrete purpose-built to hold ammunition or explosives", "What an earth-covered magazine is."),
   ("cbs_maps", "in a bath of ethanol and water meant to keep it stable", "Kept in ethanol and water.")])
b("sto-2", S, "And the same paper lists what can go wrong.", [], [("paper", "Long-term storage of lead azide presents some problems.", "")])
b("sto-3", S, "First. It has to stay under water.", ["KEEP IT UNDER WATER"], [QWET])
b("sto-4", S, "Second. If that water freezes, the paper says, it can go off on its own. So alcohol gets added, to keep it from freezing.",
  ["IF THE WATER FREEZES: \"SPONTANEOUS DETONATION\"", "SO ALCOHOL IS ADDED"],
  [QFREEZE, ("paper", "Addition of ethanol to the water is therefore necessary to make a non-freezing mixture.", "")])
b("sto-5", S, "Third. Alcohol evaporates. So somebody has to keep checking the level, and keep topping it up.",
  ["ALCOHOL EVAPORATES", "SOMEONE HAS TO KEEP CHECKING THE LEVEL"], [QSURV])
b("sto-6", S, "And the containers do not last. In 1984 they were steel drums, and the paper says steel rusts through.",
  ["RUST-THROUGH", "1984: IT WAS ALL WRITTEN DOWN"],
  [("paper", "the steel 55-gallon packing and storage drum has a limited life due to rust-through, which eventually results in leakage of the ethanol-water mix", ""), QDATE], gap=0.5)
b("sto-7", S, "So this is a material that is only safe for as long as somebody keeps looking after it.", [], [], gap=0.9, exempt="opinion")

# ------------------------------------------------------------------ 5. who knew, and when
S = "timeline"
b("tl-1", S, "So let's count the chances there were to deal with it.", [], [], exempt="opinion")
b("tl-2", S, "1984. The risks are on paper, and half the stockpile is still in drums.", ["1984", "THE RISKS ARE ON PAPER"], [QDATE, QHALT])
b("tl-3", S, "In 2004, a Defense Department assessment raises concern about an old stockpile of lead azide that has been deteriorating for forty years.",
  ["2004", "A STOCKPILE \"DETERIORATING FOR 40 YEARS\""],
  [("kcrg_docs", "An environmental assessment from 2004 shows the Department of Defense was concerned about an old stockpile of lead azide that had been deteriorating for 40 years at the plant in Middletown.", "")])
b("tl-4", S, "2009. The Army gathers up what is left of the country's lead azide and moves it to one place: the Iowa Army Ammunition Plant, in Middletown. Some of it is already more than sixty years old. It goes into new plastic barrels.",
  ["2009", "THE WHOLE STOCKPILE MOVES TO IOWA", "SOME ALREADY 60+ YEARS OLD"],
  [("kwqc_timeline", "(about 10,000 pounds, some already 60+ years old) was consolidated from various bases during base realignment and moved to the Iowa Army Ammunition Plant (IAAP)", "Consolidated in Iowa."),
   ("kwqc_timeline", "transferred from metal barrels to plastic barrels", "Repacked into plastic."),
   ("kcrg_how", "The Army moved all of the country’s lead azide to Middletown in 2009.", "In 2009.")])
b("tl-5", S, "Around 2011, the military stops using lead azide altogether.", ["2011", "THE MILITARY STOPS USING IT"],
  [("kwqc_timeline", "2011 or earlier: U.S. military moved away from procuring/using lead azide because of sensitivity and storage/handling challenges.", "")])
b("tl-7", S, "The routine: an inspection every month, and a top-up of the liquid every September, before winter.", ["INSPECTED MONTHLY", "TOPPED UP EVERY SEPTEMBER"],
  [("kwqc_timeline", "Routine schedule: Drums were inspected monthly; annual inspections and water/ethanol refilling occurred in September prior to winter freezing temps.", "")])
b("tl-8", S, "September 2025. According to the government's own court filing, that is the last time the liquid was checked and refilled.",
  ["SEPTEMBER 2025", "\"unchecked and unreplenished since September 2025\"", "GOVERNMENT COURT BRIEF, AS REPORTED BY IOWA PUBLIC RADIO"], [QUNCHECKED])
b("tl-9", S, "That same month, the plant's contractor asks an outside firm for a price to get rid of the barrels.",
  ["SEPT. 24, 2025", "PLANT CONTRACTOR ASKS FOR A DISPOSAL QUOTE"],
  [("ipr_contractor", "American Ordnance, the plant contractor that operates the Iowa Army Ammunition Plant, asked MuniRem for a disposal quote on Sept. 24, 2025, according to documents and a timeline shared with IPR by the company.", "")])
b("tl-10", S, "March 11, 2026. An inspection finds the lead azide has crystallized. The next day the Army tells the EPA, and the plant shuts down for eighteen days.",
  ["MARCH 11, 2026", "CRYSTALS FOUND", "PLANT SHUT FOR 18 DAYS"],
  [("army_advisory", "A routine monitoring inspection on March 11, 2026, found that decades-old, stored lead azide had partially crystallized", ""),
   ("epa_letter", "3/12/2026 -- EPA Region 7 was notified of 68 drums of potentially unstable lead (Pb) azide", "EPA was told the next day.", 3),
   ("ipr_reynolds", "since the plant closed for an 18-day emergency safety review in March", "An 18-day shutdown.")])
b("tl-11", S, "And the plant's commander tells the public, quote: there is no immediate danger to the public.",
  ["\"There is no immediate danger to the public.\"", "PLANT COMMANDER, MARCH 2026"],
  [("kcrg_march", "There is no immediate danger to the public.", "Lt. Col. Daniel Nosse, March 2026."),
   ("snopes", "19 Mar. 2026", "The date of KCRG's report.")], gap=0.5)
b("tl-12", S, "Within two weeks, the Army hires a company to treat the barrels chemically. No blast, no dust cloud. By May, that is dropped, and the Secretary of the Army has chosen detonation.",
  ["MARCH: A CONTRACT TO TREAT IT CHEMICALLY", "MAY: DROPPED. DETONATION CHOSEN."],
  [("ipr_contractor", "Within two weeks of that March warning, the Army hired MuniRem Environmental after a panel recommended chemical neutralization. But by May 8, the secretary of the Army had chosen to blow up the drums where they stood", ""),
   ("ap_whattoknow", "Chemical neutralization would avoid the plume of dust", "Chemical treatment would avoid the dust."),
   ("ipr_contractor", "On May 14, the Army told MuniRem it would not exercise the treatment portion of its contract.", "")])
b("tl-14", S, "October 15. The Army holds an open house in Middletown. One of Iowa's own senators says those talks left out how far the lead dust could travel.",
  ["OCT. 15", "OPEN HOUSE: NEARLY 200 RESIDENTS", "LEFT OUT: HOW FAR THE DUST COULD TRAVEL", "SEN. JONI ERNST"],
  [("epa_letter", "10/15/2026 -- The Army held an Open House with nearly 200 residents and community leaders", "", 4),
   ("ipr_reynolds", "Ernst said the Army began discussing disposal with some communities months ago, but those discussions left out how far dust containing lead could travel.", "")])
b("tl-16", S, "November 13. The EPA grants the permit to blow it up.", ["NOV. 13", "EPA PERMIT TO DETONATE"],
  [("epa_notice", "EPA issued an emergency permit that became effective on November 13, 2026", "")])
b("tl-17", S, "November 15. The Army announces the date, five days out, and publishes the maps. The dust cloud on those maps reaches about 100 miles.",
  ["NOV. 15", "5 DAYS' NOTICE", "PLUME: ABOUT 100 MILES"],
  [Q5DAY, ("ap_whattoknow", "a plume of dust containing lead particles that could extend as far as 100 miles away", "As far as 100 miles.")])
b("tl-18", S, "The next day, the governor's office says, is when it learned of the plan. From that public advisory.",
  ["GOVERNOR'S OFFICE: LEARNED FROM THE PUBLIC ADVISORY"],
  [("cbs2_gov", "The Office of the Governor became aware of the Iowa Army Ammunition Plant's plan to detonate degraded lead azide on Monday after a public advisory was issued by the U.S. Army", "A spokesperson for Gov. Reynolds. The advisory was issued Sunday, Nov. 15.")], gap=0.5)
b("tl-19", S, "The blast is set for November 20. Then November 23. Then, after a lawsuit and a post from the President, November 25.",
  ["NOV. 20", "NOV. 23", "NOV. 25"],
  [("ipr_residents", "That was the second time it was publicly delayed, after being scheduled for Nov. 20 and Nov. 23.", ""),
   ("army_announce", "on Wednesday, November 25, 2026, at approximately 9:00 a.m. CST", "The final date."),
   ("abc_timeline", "Iowa environmental groups file a petition for review against the EPA, challenging the permit authorizing the detonation", "The lawsuit."),
   ("abc_timeline", "President Donald Trump says he has ordered the military to hold off on the planned detonation until the federal appeals court and Sand, the incoming Iowa governor, sign off on it.", "The President's post."),
   ("abc_timeline", "The appeals court denies the environmental group's emergency motion and lifts the administrative stay on the permit, clearing the way for the detonation.", "The court's decision.")], gap=0.6)
b("tl-21", S, "Look at that whole line. The warning was written in 1984. The public got the date, and the map, five days ahead.", [], [QDATE, Q5DAY])
b("tl-22", S, "One of Iowa's Republican senators said it plainly. These materials should never have been allowed to get to this point.",
  ["\"These materials should never have been allowed to get to this point.\"", "SEN. JONI ERNST (R-IOWA)"],
  [("ipr_reynolds", "These materials should never have been allowed to get to this point, and Iowans are right to be frustrated.", "")], gap=0.6)
b("tl-23", S, "For decades, the answer was later. Later showed up.", [], [], gap=1.0, exempt="opinion")

# ------------------------------------------------------------------ 6. how it went bad
S = "failure"
b("fail-1", S, "So what happened inside those barrels? The liquid went down.", ["THE LIQUID EVAPORATED"],
  [("kcrg_how", "The ethanol-water bath the lead azide sits in had evaporated, and the explosive had re-crystallized.", "")])
b("fail-2", S, "When lead azide dries out, it grows crystals. Long, needle-shaped ones.", ["NEEDLE-LIKE CRYSTALS"],
  [("paper", "Pure lead azide occurs as colorless needle-like crystals.", ""),
   ("army_announce", "inspectors identified severe material degradation and crystallization", "What the inspectors found.")])
b("fail-3", S, "And the 1984 paper says it in one line. Breaking these crystals is believed to initiate detonation.",
  ["Breaking these crystals is believed to initiate detonation."],
  [("paper", "Breaking these crystals is believed to initiate detonation.", ""), QDATE], gap=0.6)
b("fail-4", S, "By this fall, the Army says, crystals had built up on the outside of the barrels. On the lids. On the bolts.", ["ON THE LIDS", "ON THE BOLTS"],
  [("army_announce", "We've observed a significant accumulation of crystallized lead azide on the exterior of the barrels, including the barrel lids.", "Col. Aaron Teller."),
   ("kcrg_how", "because of the crystallization on each of the bolts on the view ports and on the lids", "The ATF director.")])
b("fail-5", S, "So nobody can open a lid to add liquid. The head of the ATF said just removing one lid could set off that barrel, and then every other barrel in the bunker.",
  ["CAN'T OPEN"],
  [("kcrg_how", "just removing the lid from one of those containers could cause a detonation of that barrel and the sympathetic detonation of each and every barrel inside either one of those magazines", "")])
b("fail-6", S, "They cannot be moved. They cannot be trucked somewhere safer.", ["CAN'T MOVE"],
  [QMOVE, ("epa_letter", "unacceptable safety risk and a high probability of an uncontrolled detonation", "Why transport was ruled out.", 2)])
b("fail-7", S, "And winter is coming. Less liquid means what is left freezes more easily. Freezing is the exact thing the 1984 paper warned about.", ["CAN'T WAIT"],
  [("ap_wednesday", "less liquid inside the barrels means the solution is more susceptible to freezing, which increases the risk of an explosive chain reaction", "Col. Teller, in a court filing."),
   QFREEZE, QDATE], gap=0.6)
b("fail-8", S, "An engineer who filed a statement for the groups suing over the permit said: stored properly, it should not deteriorate. It only happens when storage is not carefully monitored.",
  ["\"It's only when the conditions of storage are not carefully monitored that it starts to form crystals\"", "DR. RON SAHU, ENVIRONMENTAL ENGINEER"],
  [("kcrg_docs", "Ordinarily, if you store it properly, it should not deteriorate. It should stay for a long long time. It’s only when the conditions of storage are not carefully monitored that it starts to form crystals and things of that sort.", ""),
   ("kcrg_docs", "Dr. Ron Sahu, a combustion expert and environmental engineer, wrote to the court to supplement environmental groups’ lawsuit against the EPA.", "Who he is.")], gap=0.9)

# ------------------------------------------------------------------ 7. the decision
S = "decision"
b("dec-1", S, "So here is the plan. Two rapid detonations, inside the bunkers.", ["TWO RAPID DETONATIONS"],
  [QTWO, ("army_advisory", "The lead azide will be detonated in earth-covered magazines", "")])
b("dec-2", S, "Around them: walls of sand-filled barriers two stories high. Water tanks. Foam. Gel blocks. And misters soaking the ground and the air.",
  ["SAND-FILLED BARRIERS, TWO STORIES HIGH", "WATER TANKS", "FOAM", "GEL BLOCKS", "MISTERS"],
  [("army_announce", "sand-filled HESCO barriers standing about two stories high", ""),
   ("army_announce", "aqueous foam blocks, two walls of four 16,000-gallon water tanks, and gel blocks adjacent to the bunkers", ""),
   ("army_announce", "High-volume industrial misting units and water sprayers will thoroughly saturate the soil and airspace before and during detonation", "")])
b("dec-3", S, "The Army says its goal is to keep as much of the dust as it can on its own property.", ["GOAL: KEEP IT ON THE PLANT"],
  [("ap_wednesday", "Our goal is to keep as much of it as we can here on our Iowa Army Ammunition plant to prevent it from traveling.", "Acting Army Secretary Adam Telle.")])
b("dec-5", S, "And the Army's argument is simple. Leave it, and it goes off on its own. No warning. No barriers. Nobody evacuated.", [],
  [("army_announce", "is far preferable to an uncontrolled, spontaneous detonation of that substance", "Acting Army Secretary Adam Telle."),
   ("army_announce", "It's just a matter of time when we have an uncontrolled detonation.", "ATF Director Robert Cekada.")])
b("dec-6", S, "The general in charge said: inaction is no longer an option.",
  ["\"Inaction is no longer an option.\"", "MAJ. GEN. ERIC SHIRLEY, U.S. ARMY SUSTAINMENT COMMAND"],
  [("army_announce", "\"Inaction is no longer an option,\" said Maj. Gen. Eric Shirley, commanding general, U.S. Army Sustainment Command.", "")], gap=0.5)
b("dec-7", S, "A federal appeals court agreed. So did Iowa's governor. So did the mayor of Middletown.",
  ["8TH CIRCUIT COURT OF APPEALS", "GOV. KIM REYNOLDS", "MAYOR OF MIDDLETOWN"],
  [("abc_timeline", "the degraded explosives present a risk of an uncontrolled and unplanned explosion, which would occur without the benefit of the safety measures that the Permit puts in place", "From the court's opinion."),
   ("ipr_reynolds", "The 8th U.S. Circuit Court of Appeals temporarily put the Environmental Protection Agency’s permit on hold last week", "Which court."),
   ("ipr_reynolds", "Iowa Gov. Kim Reynolds said Tuesday she supports the U.S. Army’s plan to detonate nearly five tons of unstable lead azide", ""),
   ("ap_wednesday", "Middletown Mayor Rodney Johnson said the detonation must take place \"so we can move on with our lives.\"", "")])
b("dec-8", S, "And today? They are probably right.", [], [], gap=0.6, exempt="opinion")
b("dec-9", S, "But it is only true today. Because of everything that did not happen before today.", [], [], gap=0.6, exempt="opinion")
b("dec-10", S, "It could have been destroyed while it was stable. The Army was already doing that when the 1984 paper was written. It stopped halfway.",
  ["DESTROY IT WHILE IT IS STABLE"], [QHALT, QDATE])
b("dec-11", S, "The Army's own spokesperson calls Middletown an anomaly. Everywhere else, she says, stockpiles like this were eliminated over the last two decades.",
  ["\"AN ANOMALY\"", "ARMY SPOKESPERSON"],
  [("snopes", "According to Army spokesperson Justine Barati, the stockpile in Middletown is an anomaly.", ""),
   ("snopes", "over the past two decades, the Department of Defense has \"systematically conducted demilitarization campaigns to eliminate bulk legacy stores across the industrial base.\"", "")])
b("dec-12", S, "It could have been kept wet. That was the whole job.", ["KEEP IT WET"], [QUNCHECKED, QSURV])
b("dec-13", S, "And it could have been treated this spring. By the contractor's account, a review panel recommended exactly that, and the Army hired the contractor to do it.",
  ["TREAT IT THIS SPRING"],
  [("ipr_contractor", "According to a timeline provided by MuniRem, a panel that included Army specialists, Johns Hopkins Applied Physics Laboratory personnel and EPA representatives voted March 19 to recommend chemical neutralization as the safest treatment.", ""),
   ("ipr_contractor", "The Army awarded MuniRem a contract March 25", "")])
b("dec-14", S, "The Army says crystals around the lids made opening the barrels too dangerous. What changed between March and May has not been made public.", [],
  [("ipr_contractor", "the Army said crystals may have migrated into the drums’ lid assemblies, where friction from opening them could cause an explosion", "The Army's reason."),
   ("ipr_contractor", "They leave unanswered what changed between the March recommendation and the May decision", "What the records do not show.")], gap=0.6)
b("dec-17", S, "The window to do this safely was open for decades. It closed because nobody went through it.", [], [], gap=1.0, exempt="opinion")

# ------------------------------------------------------------------ 8. the zone
S = "zone"
b("zone-1", S, "So where does the dust go? Wherever the wind is going that morning.", [],
  [("ap_whattoknow", "said the direction the wind blows will determine where the plume reaches", "David Cwiertny, University of Iowa.")])
b("zone-2", S, "The first maps, for the first date, sent the cloud northeast. About 100 miles.", ["FIRST MAPS: NORTHEAST", "ABOUT 100 MILES"],
  [("snopes", "the blast zone appears to stretch approximately 100 miles northeast from the blast site", ""),
   ("snopes", "We compared this map to maps the Army released ahead of the planned detonations and found they aligned.", "Snopes checked it against the Army's maps.")])
b("zone-3", S, "Up the Mississippi, and over it, into Illinois. The Illinois environmental agency said nobody had notified it.", ["ILLINOIS EPA: NOT NOTIFIED"],
  [("ap_whattoknow", "The Army's maps modeling where the plume could reach include parts of Illinois", ""),
   ("ap_whattoknow", "officials from Illinois' EPA said they had not been notified about the detonation", "")])
b("zone-4", S, "In Mediapolis, less than twenty miles from the plant, city officials learned where they stood when the first map put them in the middle of it.", ["MEDIAPOLIS"],
  [("ap_brace", "In Mediapolis, less than 20 miles (32 kilometers) northeast, city officials were approached about allowing soil, water and air testing late last month. But they only learned of their potential exposure on Sunday, when the initial map put them in the center of the dust exposure area.", "")])
b("zone-5", S, "Then the date moved. And the wind turned around.", [],
  [("ipr_residents", "The wind was out of the southeast on Friday, which would have pushed the plume north if the detonations happened that day.", ""),
   ("ipr_residents", "The wind flipped and was expected to come out of the northwest on Monday.", "")], gap=0.5)
b("zone-6", S, "The newest maps send the cloud the other way. Southwest, across the corner of Iowa, and into northeast Missouri.",
  ["NEW MAPS: SOUTHWEST", "INTO NORTHEAST MISSOURI"],
  [("cbs_maps", "show a plume of toxic dust drifting southwest toward northeast Missouri", ""),
   ("cbs_maps", "By early afternoon, the shaded area stretches far into northeast Missouri, passing Knox City.", ""),
   ("cbs_maps", "it narrows to a band running from the Burlington and Keokuk area toward Macon, Missouri, with Quincy, Illinois, just southeast of it", "")])
b("zone-7", S, "A University of Iowa professor put it like this. People who were worried a few days ago are off the hook. People who thought they would be fine are now right in the path.",
  ["\"...those who thought they were going to be OK are now right in the plume path.\"", "PATRICK O'SHAUGHNESSY, UNIVERSITY OF IOWA"],
  [("ipr_residents", "So folks that were very concerned even several days ago now are in a sense off the hook, and those who thought they were going to be OK are now right in the plume path,", ""),
   ("ipr_residents", "Patrick O’Shaughnessy, professor of occupational and environmental health at the University of Iowa", "Who he is.")])
b("zone-8", S, "Same blast. Different people downwind. Decided by the weather on a Wednesday morning.", [], [], gap=0.7, exempt="opinion")
b("zone-9", S, "And remember what these maps are. They are forecasts. How they were built has not been made public. That same professor called them a guesstimate.",
  ["FORECASTS, NOT MEASUREMENTS", "\"It is a guesstimate at this point\""],
  [("cbs_maps", "The maps are forecasts and will change with the weather.", ""),
   ("ipr_residents", "the basis for the estimates is not public", ""),
   ("ipr_residents", "It is a guesstimate at this point", "")], gap=0.9)

# ------------------------------------------------------------------ our own map
# Nick, 2026-11-25: "We can make our own plume map. It doesn't have to be only what the army says."
# The arithmetic is in estimate.py; an "estimate" line may only say figures that file produces.
S = "ours"
b("our-1", S, "So we checked it ourselves.", exempt="note", gap=0.35)
b("our-2", S, "We took the National Weather Service forecast for Wednesday, hour by hour: the wind near the ground, and the faster wind above it that carries a cloud.",
  ["NATIONAL WEATHER SERVICE FORECAST", "ISSUED TUESDAY EVENING"],
  [("nws", '"updateTime": "2026-11-25T00:26:20+00:00"', "The forecast used was issued at 00:26 UTC on Nov. 25: 6:26 p.m. Central on Tuesday."),
   ("nws", '"windDirection"', "It gives the wind near the ground, hour by hour."),
   ("nws", '"transportWindDirection"', "It gives the transport wind: the average wind through the layer of air that mixes with the ground.")])
b("our-3", S, "At nine a.m. it blows from the northeast at about twelve miles an hour. It stays in the northeast all day.",
  ["WIND FROM THE NORTHEAST", "12 TO 14 MPH"], exempt="estimate")
b("our-4", S, "Ride that wind, and the front of the cloud is about forty miles out by noon. By five p.m., about a hundred.",
  ["NOON", "5 P.M.", "ABOUT 100 MILES"], exempt="estimate")
b("our-5", S, "Southwest, into northeast Missouri. Near the ground the wind is slower, so the tail lags behind. And the Army's newest map runs right between our two lines.",
  ["OUR ESTIMATE", "ARMY'S MAP, AS REPORTED"],
  [("cbs_maps", "Wind arrows on the maps point southwest.", "The Army's maps point southwest."),
   ("cbs_maps", "toward Macon, Missouri", "The Army's shaded area runs toward Macon, Missouri.")], exempt="estimate")
b("our-6", S, "So the direction checks out. What no map of ours can show is how much lead is in that cloud. That depends on how much the blast puts in the sky, and the basis for the Army's estimates is not public.",
  ["HOW MUCH LEAD?", "\"the basis for the estimates is not public\""],
  [("ipr_maps", "How much lead ends up in the soil will depend on how much lead ends up in the sky after the detonation.", "How much lead comes down depends on how much goes up."),
   ("ipr_residents", "the basis for the estimates is not public", "The basis for the Army's estimates is not public.")])
b("our-7", S, "And this is Tuesday night's forecast. If the wind shifts by morning, so does the map.", exempt="note", gap=0.9)

# ------------------------------------------------------------------ 9. who leaves, who stays
S = "evac"
b("evac-1", S, "Here is who is being helped to leave. Everyone in Middletown, and everyone inside a cone-shaped zone that runs five miles southwest of the plant, with one extra mile on each side.",
  ["RECOMMENDED RELOCATION", "5-MILE CONE", "+1 MILE"],
  [("army_advisory", "This defines the evacuation zone as a 5-mile cone extending southwest of IAAAP", ""),
   ("army_advisory", "the evacuation extends one mile beyond the dispersion path", ""),
   ("army_advisory", "FEMA is supporting the recommended relocation for all residents of Middletown, Iowa", "")])
b("evac-2", S, "It is a recommendation, not an order. FEMA is covering rides, hotel rooms and meals through Friday.",
  ["FEMA: TRANSPORT, HOTELS, MEALS", "THROUGH FRIDAY, NOV. 27"],
  [("army_announce", "if they choose to relocate, we will offer services", "FEMA's administrator."),
   ("army_advisory", "At this time, lodging will be provided through Friday, November 27", "")], gap=0.5)
b("evac-3", S, "Now here is everyone else.", [], [], exempt="note")
b("evac-4", S, "Out to twenty miles, the emergency alert on people's phones said: stay indoors, windows closed.", ["20 MILES", "STAY INDOORS, WINDOWS CLOSED"], [QALERT])
b("evac-6", S, "The dust maps run a lot farther than that. For people out there, the instructions are: close up the house, keep kids and pets inside, and afterwards, wet-wipe anything a child might touch.",
  ["CLOSE WINDOWS AND DOORS", "KEEP CHILDREN AND PETS INSIDE", "AFTERWARDS: WET-CLEAN WHAT CHILDREN TOUCH"],
  [("army_advisory", "closing all windows and doors, setting heating to recirculate (heat can stay on), turning off fans that pull in outside air (e.g., bathroom vents and kitchen exhausts), keeping small children and pets inside", ""), QWETCLEAN,
   ("cbs_maps", "By early afternoon, the shaded area stretches far into northeast Missouri, passing Knox City.", "How far the maps reach.")])
b("evac-7", S, "Three Iowa counties are under a disaster proclamation. The federal government counts about 350 farms in the path.",
  ["DES MOINES, LEE AND VAN BUREN COUNTIES", "ABOUT 350 FARMS"],
  [("abc_mitigation", "Des Moines, Lee and Van Buren counties are covered by the emergency proclamation", ""),
   ("abc_mitigation", "issued a disaster emergency proclamation for three counties", ""), Q350])
b("evac-8", S, "The Army says lead levels out there will be well below the point where the EPA requires anyone to act.", [],
  [("cbs_why", "the levels will be well below the level at which the EPA requires protective actions", "")])
b("evac-9", S, "Maybe so. But look at the gap between the people helped to leave, and the people told to stay inside and clean up after. That gap is the part to watch.", [], [], gap=0.9, exempt="opinion")

# ------------------------------------------------------------------ 10. why lead matters
S = "lead"
b("lead-1", S, "Here is why people are this angry about dust. Lead is a neurotoxin. It damages the brain and nervous system, the kidneys, and the heart and blood vessels.",
  ["BRAIN + NERVOUS SYSTEM", "KIDNEYS", "HEART + BLOOD VESSELS"],
  [("kwqc_expert", "Lead is a neurotoxin. Exposure can damage the brain and nervous system, kidneys and cardiovascular system.", "")])
b("lead-2", S, "The CDC says no amount of lead exposure is safe.", ["NO AMOUNT OF LEAD EXPOSURE IS SAFE", "CENTERS FOR DISEASE CONTROL AND PREVENTION"],
  [("ap_whattoknow", "No amount of lead exposure is safe, according to the Centers for Disease Control and Prevention", "")], gap=0.5)
b("lead-3", S, "And it hits the smallest people hardest. In small children it can cause permanent brain damage.", [],
  [("ipr_residents", "Lead is a neurotoxin that can cause permanent brain damage, especially in babies and small children.", "")])
b("lead-4", S, "A University of Iowa professor of environmental health said the most concerning thing is two-year-olds. They touch everything. And then everything goes into their mouth.",
  ["\"...2-year-olds that just have this habit of, right, of touching everything and then everything goes right into their mouth\"", "PATRICK O'SHAUGHNESSY, UNIVERSITY OF IOWA"],
  [("kwqc_expert", "Maybe the most concerning thing is, say, 2-year-olds that just have this habit of, right, of touching everything and then everything goes right into their mouth, right,", "")])
b("lead-5", S, "So think about the advice to rinse off the playground. Researchers at the same university pointed out the catch. The lead does not go away. It washes into the dirt underneath.",
  ["THE LEAD DOESN'T GO AWAY", "IT WASHES INTO THE DIRT"],
  [("ipr_maps", "The Army has said rinsing off playground equipment will get rid of lead. But the lead doesn’t go away. Instead, it washes into the dirt", ""),
   ("ipr_maps", "washed-off lead could still pose a risk to young kids who play in the dirt and put their hands in their mouths", "")])
b("lead-6", S, "Lead does not break down. Whatever lands stays there until somebody removes it.", [],
  [("ipr_maps", "It’s an element, so it doesn’t decompose or disappear.", ""),
   ("kwqc_expert", "Lead does not break down naturally, meaning contaminated soil and sediment can remain a problem long after the blast.", "")], gap=0.7)
b("lead-7", S, "Now, to be fair. The scientists following this do not expect a disaster far from the plant. One of them said that at the far end of the plume, this would be a very small addition to the lead already in the ground.",
  ["\"...a very small addition to the lead that's already naturally occurring.\"", "JEFFREY CATALANO, WASHINGTON UNIVERSITY IN ST. LOUIS"],
  [("ipr_residents", "the more distant part of the plume, from the numbers I’ve seen, if those are correct, the long-term risk is this will be a very small addition to the lead that’s already naturally occurring.", ""),
   ("ipr_residents", "Jeffrey Catalano, a professor of earth, environmental and planetary sciences at Washington University in St. Louis", "Who he is.")])
b("lead-8", S, "But close to the blast, he said, it could be high. And he said he knows of nothing like this ever being done.", [],
  [("ipr_residents", "although the lead concentration close to the blast zone could be high", ""),
   ("ipr_residents", "This is the first I’ve ever heard of lead azide exploding and being released into the air. I don’t know of any other example of this,", "")])
b("lead-9", S, "So the real answer is that nobody knows yet. That is what the sampling is for.", [],
  [("army_advisory", "U.S. Government personnel will return immediately to conduct post-detonation sampling with results published when available.", "")], gap=0.9)

# ------------------------------------------------------------------ 11. farms
S = "farms"
b("farm-1", S, "This is farm country. And animals cannot follow an evacuation notice.", [], [Q350])
b("farm-2", S, "The state told farmers: move feed, hay and water tanks indoors, or cover them with a tarp. Keep livestock inside, or somewhere else, until the all-clear.",
  ["MOVE FEED, HAY AND WATER TANKS INDOORS", "OR COVER THEM WITH A TARP", "KEEP LIVESTOCK INDOORS UNTIL THE ALL-CLEAR"],
  [("ipr_maps", "Move livestock feed, hay bales and portable water tanks indoors to prevent possible contamination. If these livestock supplies cannot be moved, cover them with a tarp.", "Iowa Department of Agriculture guidance."),
   ("ipr_maps", "Keep livestock at an alternate location or indoors until the U.S. Army gives the “all clear” and the air plume has passed by your area.", "")])
b("farm-3", S, "Iowa State's beef specialists told producers to pull cattle off pasture and away from ponds, and to watch for lead poisoning. Sudden death. Or slower signs: weight loss, trouble seeing, trouble breeding.",
  ["SUDDEN DEATH", "GRADUAL WEIGHT LOSS", "VISUAL IMPAIRMENT", "REPRODUCTIVE ISSUES", "IOWA BEEF CENTER, VIA BEEF MAGAZINE"],
  [("beef", "Signs of acute lead poisoning may include: sudden death, rapid neurological and digestive signs within a few hours to several days after exposure.", ""),
   ("beef", "Chronic signs include lack of appetite, gradual weight loss, poor performance, anemia, lethargy, visual impairment and reproductive issues.", ""),
   ("beef", "Remove cattle from grazing areas in the impact zone to limit their ingestion of lead.", ""),
   ("beef", "Cattle should be removed from pond water drinking areas", "")])
b("farm-4", S, "And both of them gave farmers the same homework. Take samples now. Write down every expense.",
  ["TAKE BASELINE SAMPLES", "\"Track and record all relevant expenses\""],
  [("ipr_maps", "Track and record all relevant expenses incurred in case you need to file a damage claim with the U.S. Army.", ""),
   ("beef", "Consider collecting soil, forage and/or blood samples prior to detonation to establish a baseline lead level and post-detonation.", "")], gap=0.5)
b("farm-5", S, "Read that again. Farmers are being told to build their own evidence file, in case they have to file a claim against the Army.", [], [], gap=0.6, exempt="opinion")
b("farm-6", S, "The Army says it will pay, and clean up any home that tests over its limit at government expense. Iowa's agriculture secretary says farmers must be fully compensated.",
  ["ARMY: CLEANUP \"at complete government expense\"", "STATE: \"Iowans are fully compensated\""],
  [("army_announce", "environmental remediation teams will remove affected soil, clean surfaces, and restore the property at complete government expense", ""),
   ("army_announce", "If any residential property tests above the RCRA-approved standard", "Above the Army's soil standard."),
   ("ipr_maps", "Iowans are fully compensated", "Iowa Secretary of Agriculture Mike Naig.")])
b("farm-7", S, "And to be fair again: that same scientist said he would not expect a measurable increase in lead in next year's corn.",
  ["\"I don't think you would find a measurable increase in lead in next year's corn crop\"", "JEFFREY CATALANO, WASHINGTON UNIVERSITY IN ST. LOUIS"],
  [("ipr_residents", "I don’t think you would find a measurable increase in lead in next year’s corn crop versus this year,", "")])
b("farm-8", S, "So maybe the farms come through fine. But the state's own agriculture secretary said there are a lot of questions to answer about how we got here, and about how late the state was told.",
  ["\"...a lot of questions that'll need to be answered, ultimately about how did we get here\"", "MIKE NAIG, IOWA SECRETARY OF AGRICULTURE"],
  [("ipr_maps", "It's unfortunate that we've come to this situation where the detonation is the only option, and I think there's a lot of questions that'll need to be answered, ultimately about how did we get here,", ""),
   ("ipr_maps", "And certainly, there's been some frustration about the lack of communication or how late that communication came to the state.", "")], gap=1.0)

# ------------------------------------------------------------------ 12. ending (written the night before the blast)
S = "ending"
b("end-1", S, "This video was finished the night before the blast.", [], [], exempt="note")
b("end-2", S, "By the time you are watching, it has probably happened.", [],
  [QTWO, ("ipr_reynolds", "The Army expects the blast to last seconds and the airborne dust to dissipate within about an hour", "")])
b("end-3", S, "What nobody knows yet is where the lead came down. The EPA says its first results will take days. The Army has promised a final map.",
  ["FIRST RESULTS: \"in the days following the detonation\"", "FINAL MAP: PROMISED"],
  [("epa_letter", "EPA anticipates receiving preliminary dust wipe sampling results from EPA-collected samples in the days following the detonation.", "", 3),
   ("epa_letter", "the Army will issue a final map showing where lead-containing dust has settled", "", 3)], gap=0.6)
b("end-4", S, "If the numbers come back low, we got lucky. And luck is not a safety plan.", [], [], gap=0.5, exempt="opinion")
b("end-5", S, "If they do not, then decades of later just landed on somebody's farm. Somebody's playground. Somebody's kid.", [], [], gap=0.8, exempt="opinion")
b("end-6", S, "Either way, the Army has now ordered a review of every weapons storage site it has. To make sure, in its words, that something like this never happens again.",
  ["\"...to ensure that something like this never happens again.\"", "ADAM TELLE, ACTING SECRETARY OF THE ARMY"],
  [("ipr_reynolds", "to begin a thorough examination of every such weapon storage facility within the Army's inventory to ensure that something like this never happens again.", "")])
b("end-7", S, "Good. But one of the scientists watching this asked the question that should bother everyone. Once we do this, it becomes an option. So how many more times?",
  ["\"...how many more times will we think of doing this and think it's okay now?\"", "PETER THORNE, UNIVERSITY OF IOWA COLLEGE OF PUBLIC HEALTH"],
  [("ipr_maps", "Once we do it, then it becomes considered a viable option for other situations in other places,", ""),
   ("ipr_maps", "So, we expose Iowans this time, but how many more times will we think of doing this and think it's okay now?", ""),
   ("ipr_maps", "Peter Thorne of the UI College of Public Health", "Who he is.")], gap=0.8)
b("end-8", S, "The Army wrote down how this would go wrong in 1984. Keep it wet. Keep checking. Do not trust the drums.", ["1984"], [QDATE, QWET, QSURV], gap=0.5)
b("end-9", S, "Then it kept nearly five tons of it anyway.", [], [Q5T], gap=0.8)
b("end-10", S, "This was not an accident. This is what happens when a problem belongs to nobody.", [], [], gap=0.9, exempt="opinion")
b("end-11", S, "We will update this when the results are in.", [], [], gap=0.0, exempt="note")

# Respellings for the voice only (captions and the gate use the narration as written). Each of
# these was checked against the voice's phonemes: it reads "lead" as the verb, "EPA" as a word,
# "FEMA" with a short e, and 1984 as "nineteen hundred eighty four".
import re
SAY = [(r"\bLead\b", "Led"), (r"\blead\b", "led"), (r"\bEPA\b", "E.P.A."), (r"\bFEMA\b", "Feema"), (r"\bATF\b", "A.T.F."),
       (r"\b1984\b", "nineteen eighty-four"), (r"\b2026\b", "twenty twenty-six"), (r"\b2025\b", "twenty twenty-five"),
       (r"March 11,", "March eleventh,"), (r"October 15\b", "October fifteenth"), (r"November 13\b", "November thirteenth"),
       (r"November 15\b", "November fifteenth"), (r"November 20\b", "November twentieth"), (r"November 23\b", "November twenty-third"),
       (r"November 25\b", "November twenty-fifth"), (r"\bMediapolis\b", "Meedy-apolis")]
for beat in beats:
    say = beat["narration"]
    for pat, sub in SAY:
        say = re.sub(pat, sub, say)
    if say != beat["narration"]:
        beat["say"] = say

SHORT = {"army": "U.S. ARMY", "epa": "U.S. EPA", "paper": "1984 ARMY PAPER (DTIC)", "kcrg": "KCRG", "kwqc": "KWQC", "abc": "ABC NEWS",
         "ap_wednesday": "ASSOCIATED PRESS", "ap_brace": "ASSOCIATED PRESS", "ap_whattoknow": "PBS NEWS", "ipr": "IOWA PUBLIC RADIO",
         "cbs_maps": "CBS NEWS CHICAGO", "nws": "NATIONAL WEATHER SERVICE", "cbs_why": "CBS NEWS", "snopes": "SNOPES", "wiki": "WIKIPEDIA", "cbs2_gov": "CBS 2 IOWA", "beef": "BEEF MAGAZINE"}
# Only documents that a claim actually quotes are listed as sources.
cited = {c["src"] for x in beats for c in x["claims"]}
sources = [src for src in sources if src["id"] in cited]
for src in sources:
    src["short"] = SHORT.get(src["id"]) or SHORT[src["id"].split("_")[0]]

script = {
    "id": "five-tons-of-neglect",
    "title": "Five Tons of Neglect: The Army's Lead Bomb in Iowa",
    "lane": "special",
    "format": "longform",
    "edition": "pre-blast (written 2026-11-24, the night before the detonation)",
    "width": 1920, "height": 1080,
    "max_runtime_s": 900,
    "crf": 23,
    "composition": "Lead",
    "studio": "lead",
    "sections": ["cold", "what", "surplus", "storage", "timeline", "failure", "decision", "zone", "ours", "evac", "lead", "farms", "ending"],
    "section_titles": {"cold": "", "what": "WHAT IT IS", "surplus": "WHY THERE IS A STOCKPILE", "storage": "HOW IT IS STORED", "timeline": "WHO KNEW, AND WHEN",
                       "failure": "HOW IT WENT BAD", "decision": "THE DECISION", "zone": "WHERE THE DUST GOES", "ours": "OUR OWN MAP", "evac": "WHO LEAVES, WHO STAYS",
                       "lead": "WHY LEAD MATTERS", "farms": "THE FARMS", "ending": ""},
    "labels": {"reconstruction": "ANIMATED EXPLAINER · NOT FOOTAGE", "source": "SOURCE", "commentary": "COMMENTARY", "schematic": "SCHEMATIC · NOT TO SCALE",
               "edition": "FINISHED NOV. 24, 2026, THE NIGHT BEFORE THE DETONATION",
               "schematic_map": "SCHEMATIC OF THE ARMY'S MAPS AS REPORTED · NOT A FORECAST",
               "sources_title": "SOURCES", "sources_note": "EVERY CLAIM IN THIS VIDEO IS TIED TO A QUOTE FROM ONE OF THESE. FULL LIST AND LINKS IN THE DESCRIPTION.",
               "iowa": "IOWA", "illinois": "ILLINOIS", "missouri": "MISSOURI", "mississippi": "MISSISSIPPI RIVER", "plant": "IOWA ARMY AMMUNITION PLANT",
               "middletown": "MIDDLETOWN", "burlington": "BURLINGTON", "mediapolis": "MEDIAPOLIS", "keokuk": "KEOKUK", "quincy": "QUINCY",
               "knoxCity": "KNOX CITY", "macon": "MACON", "wind": "WIND",
               "estimate": "OUR ESTIMATE · NATIONAL WEATHER SERVICE FORECAST",
               "ours_note": "OUR ESTIMATE OF WHERE THE WIND CARRIES IT · NOT AN OFFICIAL MAP · NOT LEAD LEVELS",
               "ours_aloft": "FASTER WIND ABOVE", "ours_ground": "WIND NEAR THE GROUND"},
    "sources": sources,
    "voice": {"engine": "kokoro-onnx", "voice": "am_michael", "speed": 1.08, "lang": "en-us"},
    "beats": beats,
}
# Each line now keeps its natural tail (see voice.py trim), so the written pauses are shorter.
for beat in beats:
    beat["gap_after"] = round(max(0.06, beat["gap_after"] - 0.2), 2)
(video / "script.json").write_text(json.dumps(script, indent=2, ensure_ascii=False) + "\n")
words = sum(len(x["narration"].split()) for x in beats)
print(len(beats), "beats,", words, "words,", sum(len(x["claims"]) for x in beats), "claims,", sum(1 for x in beats if x.get("exempt")), "commentary beats")
for sec in script["sections"]:
    print(f"  {sec:9s} {sum(len(x['narration'].split()) for x in beats if x['section'] == sec):4d} words, {sum(1 for x in beats if x['section'] == sec):3d} beats")
