# Second-pass ruling — where the remaining words come from, and what you are authorised to delete

Your fragment is over its ceiling. Every fragment is. The aggregate after the first pass is **18,962 words against a 14,000-word target**, so roughly another 5,000 words have to come out of the document as a whole.

**This is not a choice between length and substance, and you should not treat it as one.** The measurement that matters is this: **the document states many of the same facts in three or four different chapters.** A fact stated once, in the chapter that owns it, and referred to elsewhere in a clause, is not lost — it is de-duplicated. That is where the remaining words are, and you are **explicitly authorised** to delete restatement of anything whose home is another chapter.

## 1. Single-home allocation — the authority for this pass

| Fact or rule | Its home | Everywhere else |
|---|---|---|
| Estate counts, device families, per-family interfaces, addresses, VLAN and zone plans, ports | **Section 5, Target architecture** | at most a clause, or a cross-reference |
| The hard build order — network and services first, the AI layer second; no server written before its device is reachable, authenticated and producing the telemetry its tools read | **Sections 1 and 2** | a clause, never a re-statement |
| The Packet Tracer unreachability rule, and the rule that an interface exists only if a command run from the management host returned data from that specific device with the transcript filed | **Section 4.5**, with the `NR-01` row in **Section 5.4** | at most one clause naming the rule and pointing at section 4.5 |
| The completion conditions and the two stated reductions | **Section 3.3** | a clause; sections 5.6 and 7 may refer to the reduction without re-explaining it |
| The evidence standard — a command transcript **and** a captioned capture, the caption and filename templates, an uncaptioned capture treated as absent, a reachability claim with no transcript listed as unverified | **Section 8** | a clause naming the standard |
| The permission model — read-only default, the six-field change proposal, the single-use host-scoped token, the audit log, the blast radius | **Section 7.4** | a clause; section 1 may summarise it once |
| The standards position — the standard contains no AI content, screen captures are the brief's requirement and not the standard's, RESTCONF must not be cited as a requirement | **Section 9** | a clause; section 1 may state it once |
| Deliverables, the two tiers, and what is submitted now | **Section 12** | a clause |
| The business trigger and the host organisation | **Section 2** | a clause |

**If a passage in your fragment says again what its home chapter says, delete the passage.** One short cross-reference is enough. Do not delete the fact from its home chapter.

## 2. What to cut inside what remains

- **A sentence that explains why a decision matters, when the decision's own row already states the recommendation and the status.** The register is the argument.
- **A preamble that announces what the next paragraph will say.** Delete the announcement, keep the paragraph.
- **Adjectival padding** — "robust", "comprehensive", "seamless", "state-of-the-art", "critical", "key", "significant" — unless the word carries a distinction the project relies on.
- **A hedge with no information in it** — "it should be noted that", "it is worth stating that", "as has been said".
- **A second example, analogy or justification where one already made the point.**
- **A list of items that the same fragment lists again in another form.**

## 3. What must not change

Every identifier, every figure, every `[TO CONFIRM]`, every caveat and every stated reduction survive. No sentence may be added that the source does not support. Numbers are never re-derived, rounded differently or tidied. Nothing may claim that a Packet Tracer device is reachable, manageable, pollable or automatable, and nothing may describe the AI layer as autonomous.

**Two corrections to my own earlier instruction, since two of you caught them and were right:**

1. **A "bold span ending in a full stop" is not a defect in this document.** I withdrew that rule after measuring: the pattern appears 53 times in the original and the coverage gate passes it. Keep the source's own emphasis.
2. **Do not add a `[TO CONFIRM]` marker the source text does not carry.** If the source states a deferral in prose, leave it in prose. Markers are only preserved where they already exist.

## 4. Reporting

Report the same items as before, plus: the final word count; the specific deletions you made under §1 (naming the fact de-duplicated and the home chapter you deferred to); and, if you miss your ceiling, the exact items you believe block it. **An honest near-miss with a named reason is worth more than a padded number, and a padded number will be caught at assembly.**
