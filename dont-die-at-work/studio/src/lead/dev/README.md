One file per scene, for look development. Each registers a single composition, `LeadDev`, that
plays one section on the film's real timeline with the real captions and source line:

    DDAWT_ENTRY=src/lead/dev/cold.tsx node tools/stills.mjs LeadDev /tmp/stills 0.5 3s 12.5s

A scene that is half-written cannot break the stills for another one, because each entry only
imports its own scene.
