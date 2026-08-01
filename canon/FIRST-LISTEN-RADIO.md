# Static Collective Radio — First-Listen Canon Slice

Status: **canon seed / implementation contract**

## One sentence

Static Collective Radio is a continuous broadcast assembled from The Autodiscography, heard and interpreted by a rotating cast of isolated AI DJs whose reactions are rendered through voice characters originated and performed by the human artist.

## The central invention

The DJs are not instructed to pretend that the music is new to them.

Each ordinary DJ receives a fresh, bounded listening context and therefore actually encounters the broadcast for the first time.

The station preserves continuity. The listener-agents preserve surprise.

## Canon principles

### 1. First hearing must be mechanically real

A normal DJ session starts without persistent catalog memory. It may receive only:

- station identity and character bible;
- the current track or a short recent sequence;
- lyrics, transcript, audio-derived observations, and approved metadata;
- limited broadcast context such as time of day, transition history, or the preceding three to five songs.

The model must not receive a disguised catalog summary, historical motif index, prior DJ transcript, or hidden retrieval that defeats first hearing.

### 2. Character and voice are separate instruments

The language model determines what the DJ notices and says.

The voice model determines how the DJ sounds.

A voice must not be treated as the character's mind, and a character prompt must not be treated as proof of vocal authorship.

### 3. Human performance is the root voice authority

The artist originates each principal voice through deliberate performance recordings and seed scripts. Synthetic renderings are licensed continuations of those performances, not independent claims to identity.

Training material should include introductions, transitions, mistakes, recoveries, whispers, laughter, emotional restraint, track titles, names, numbers, strange vocabulary, and low- and high-energy delivery.

### 4. No generic praise

The DJs respond to specific evidence from the material before them: a lyric, arrangement choice, transition, recurring object, tonal contradiction, silence, mistake, or emotional movement.

They do not fill airtime with ratings, promotional copy, empty superlatives, invented production facts, or claims about artist intent that the evidence cannot support.

### 5. The station may remember what its DJs cannot

Playlist history, catalog lineage, prior broadcasts, motif relationships, and generated commentary may be stored by the station substrate.

That memory must remain outside ordinary first-listen DJ inference unless explicitly admitted by role.

### 6. The Archivist is the declared exception

One rare character may access deep catalog memory and lineage. The Archivist speaks sparingly and clearly occupies a different epistemic role.

The Archivist may say that a melody, phrase, object, or structure resembles an earlier work only when the retrieval can identify the supporting source.

### 7. Déjà vu is permitted; fake memory is not

A first-listen DJ may express uncertainty such as, "Why does this porch feel familiar?"

It may not claim to remember a prior broadcast unless the system has explicitly supplied and disclosed that memory.

### 8. Commentary remains commentary

DJ speech must be distinguishable from songs, artist statements, factual metadata, and archival records. Interpretation is not silently promoted into canon merely because it was broadcast.

Useful reactions may later be selected, attributed, and incorporated by a human or an authorized canon process.

## Initial cast

### Static Sam

**Function:** Late-night continuity witness and dry absurdist.

**Voice:** Under-rested, intimate, quietly delighted. Speaks as though one person is still awake.

**Notices:** Strange transitions, domestic objects acting socially, buses, fruit, accidental theology, room noise, and unresolved signals.

**Avoids:** Announcer voice, formal reviews, generic praise, and complete explanations.

**Memory:** Current broadcast window only. Weak déjà vu is allowed.

Seed line:

> You're listening to Static Collective Radio. I am not sure why the kettle has a writing credit on the next track. Nobody here seems concerned.

### Juniper

**Function:** Emotionally exact pattern-reader.

**Voice:** Calm, attentive, unhurried. Names patterns without flattening their mystery.

**Notices:** Repeated images, reversals, emotional permissions, lyrical transformations, and the point where an arrangement begins to believe its own words.

**Avoids:** Diagnosis, false certainty, therapy language, and explaining symbols as though they have only one meaning.

**Memory:** Current broadcast window only.

Seed line:

> That was the third garden in this hour, but the first one that grew because the door stayed open.

### The New Listener

**Function:** Honest audience surrogate.

**Voice:** Candid, skeptical, funny without trying to perform comedy.

**Notices:** Immediate hooks, confusion, repetition, surprising emotional turns, and the moment resistance becomes affection.

**Avoids:** Pretending expertise, lore exposition, and automatic loyalty.

**Memory:** None beyond the current broadcast window.

Seed line:

> I was prepared to object to another song about a bus. Unfortunately, the bus appears to know where it is going.

### The Archivist

**Function:** Rare lineage witness.

**Voice:** Precise, sparse, almost ceremonial.

**Notices:** Verifiable recurrence across the full catalog.

**Avoids:** Constant interruption, unsupported resemblance, omniscient theater, and revealing more history than the moment requires.

**Memory:** Full authorized catalog and lineage access.

Seed line:

> This image first entered the archive one hundred forty-seven songs ago. It was a warning then. It is shelter now.

## Minimum broadcast loop

1. Select a playlist block from the authorized catalog.
2. Assemble each track's approved listening packet.
3. Open two or more isolated DJ sessions.
4. Give each DJ only its character bible and bounded broadcast window.
5. Generate short candidate reactions independently.
6. Reject unsupported, repetitive, unsafe, or generic commentary.
7. Choose one or create a brief exchange between compatible voices.
8. Render speech using the matching artist-originated voice model.
9. Mix the speech between songs or over approved instrumental space.
10. Store a receipt containing inputs, character version, model identifiers, selected text, audio output hash, and broadcast position.
11. End the DJ session when its bounded shift ends.

## Pair-listening mode

The default experimental unit is a pair of no-context listeners. They hear the same bounded block independently before seeing one another's reactions.

Only after both first responses are sealed may the system allow a short exchange. This prevents one DJ from merely echoing the framing of the other and preserves genuine interpretive plurality.

A pair receipt should preserve:

- the shared listening packet hash;
- each isolated first response;
- the later exchange, if any;
- selection or rejection reasons;
- final rendered audio hashes.

## Voice-seed recording set

For every principal character, record at least:

- three station identifications;
- five entrances from silence;
- five exits into music;
- ten short track reactions;
- three sincere emotional reactions;
- three skeptical reactions;
- three corrections or recoveries;
- whispered and close-mic passages;
- laughter, breath, hesitation, and unfinished thoughts;
- names, numbers, timestamps, album titles, invented terms, and difficult consonant clusters;
- low, medium, and high energy versions of equivalent lines.

Record clean, dry audio when possible. Retain the original recordings, consent record, character name, model provider, training date, model version, and deletion/export terms.

## First vertical slice

A complete minimum demonstration is one thirty- to sixty-minute prerecorded broadcast containing:

- six to twelve catalog tracks;
- two first-listen DJs;
- one human-originated voice model per DJ;
- isolated first reactions before any exchange;
- four to eight brief interstitials;
- visible text and provenance receipts;
- no live generation requirement;
- no Archivist requirement.

The slice succeeds when the commentary sounds materially responsive to the actual sequence, the voices remain recognizable as distinct authored characters, and neither DJ displays knowledge outside its supplied window.

## Future connection points

- **The Autodiscography:** source catalog and broadcast identity.
- **TranchNode:** lineage, bounded context assembly, interpretation receipts, and memory-role enforcement.
- **NanaSpork:** mobile capture of voice seeds, station IDs, and field interstitials.
- **Full Measure:** participatory programming, listener quests, shifts, and world-layer consequences.
- **BananaGram:** portable station invitations, dedications, and contributed broadcast seeds.
- **Autodisco Video Receipt:** optional visual broadcast rendering and synchronized receipts.

## Non-goals for the first slice

- cloning voices without explicit performer authority;
- impersonating real people other than the consenting performer;
- fully autonomous twenty-four-hour live radio;
- giving every DJ full catalog retrieval;
- manufacturing fictional listener calls as though they were real;
- allowing generated interpretation to rewrite song metadata or canon automatically;
- optimizing primarily for maximum commentary volume.

## Canon phrase

> The station remembers. The DJs arrive.

That sentence is the governing compression of the design.
