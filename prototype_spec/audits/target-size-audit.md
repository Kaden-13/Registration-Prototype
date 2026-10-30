# Target size audit (Fitts' Law)

Measured automatically in Chromium with Playwright on every screen of the flow, at 1280 x 900 (desktop) and 390 x 844 (phone).
The measured box is the element that actually receives the click or tap. For checkboxes and radios that is the whole label row or card, because the label is clickable.
Size shows the smallest instance found across all screens. Gap is the smallest edge to edge distance to the nearest other target.

Requirement used: at least 44 x 44 px for every target (48 px is the default height in this design), and at least 8 px between neighboring targets.

| Target | Desktop size (px) | Desktop gap (px) | Phone size (px) | Phone gap (px) | Result |
|---|---|---|---|---|---|
| Add section button (each result card) | 200 x 48 | 76 | 324 x 48 | 0 | Pass |
| Button: Back to search | 167 x 48 | 22 | 358 x 48 | 12 | Pass |
| Button: Continue to class search | 247 x 48 | 36 | 358 x 48 | 36 | Pass |
| Button: More filters | 152 x 48 | 8 | 152 x 48 | 8 | Pass |
| Button: Prototype controls | 197 x 48 | 75 | 197 x 48 | 14.5 | Pass |
| Button: Register for 3 sections | 232 x 48 | 22 | 358 x 48 | 12 | Pass |
| Button: Reset prototype (prototype controls) | 480 x 48 | 46.5 | not shown |  | Pass |
| Button: Review schedule | 298 x 48 | 24 | not shown |  | Pass |
| Button: Search classes | 169 x 48 | 16 | 324 x 48 | 8 | Pass |
| Button: Search for more classes | 242 x 48 | 155.5 | 358 x 48 | 12 | Pass |
| Button: Start over | 127 x 48 | 123 | 358 x 48 | 12 | Pass |
| Checkbox row: Seat race (prototype controls) | 500 x 48 | 12 | not shown |  | Pass |
| Checkbox row: Search fails (prototype controls) | 500 x 48 | 20 | not shown |  | Pass |
| Checkbox row: Hybrid | 730 x 50 | 8 | 344 x 50 | 8 | Pass |
| Checkbox row: I understand the charges | 780 x 62 | 22 | 358 x 113 | 22 | Pass |
| Checkbox row: In person | 730 x 50 | 8 | 344 x 50 | 8 | Pass |
| Checkbox row: Online | 730 x 50 | 8 | 344 x 50 | 8 | Pass |
| Checkbox row: Only show sections with open seats | 730 x 50 | 8 | 344 x 50 | 8 | Pass |
| Link: Component state gallery (inline text link) | 161 x 18 | 123 | 161 x 18 | 14.5 | Exempt (inline link in a sentence, WCAG 2.5.8) |
| My schedule sheet toggle (phone) | not shown |  | 390 x 64 | 0 | Pass |
| Register for alternative section | 210 x 44 | 258 | 210 x 44 | 339.5 | Pass |
| Remove section button (card and schedule list) | 84 x 44 | 24 | 324 x 48 | 261.8 | Pass |
| Remove section button (review list) | 92 x 44 | 74 | 324 x 44 | 134 | Pass |
| Select: Subject | 288 x 48 | 16 | 324 x 48 | 47.5 | Pass |
| Select: Simulated network (prototype controls) | 480 x 48 | 12 | not shown |  | Pass |
| Term option card | 640 x 97 | 12 | 358 x 123 | 12 | Pass |
| Text input: Course number | 222 x 48 | 16 | 324 x 48 | 44.5 | Pass |

## Notes

- **Smallest targets:** the small Remove buttons and the Register for alternative section button are 44 px tall, the minimum. They sit in lists with at least 24 px of space around them. Every other control is 48 px or taller.
- **Gap of 0 on phone:** reported only where page content scrolls underneath the fixed My schedule bar. The two never share a tap area because the bar sits on top and the page reserves 80 px of bottom padding so the last card can scroll clear of it.
- **Checkbox rows** are stacked 8 px apart and each is 50 px tall, so the full row is the target instead of the 22 px box.
- **Spacing rule in CSS:** `--target: 48px`, `--target-min: 44px`, `--gap-target: 8px` in `assets/css/styles.css`.
- **Why it matters here:** in the Phase 1 audit of the real Register for Classes page, Tab skipped the Add buttons entirely, so they were only reachable by mouse. Each Add button is now a real button that is 200 x 48 px on desktop and full width on phones, with at least 76 px of space on desktop.
