# Keyboard order and automated accessibility checks

## Tab order on the Find classes step

Recorded by pressing Tab repeatedly in Chromium (desktop, 1280 px wide) after searching Computer Science, opening More filters, and adding three sections. Focus started at `<main>` (where the skip link lands).

- Tab stops recorded: **24**
- Elements with a positive `tabindex`: **0** (order comes from the DOM, never from tabindex numbers)
- Every stop showed a visible focus indicator.

| # | Element | Accessible name | State attributes |
|---|---|---|---|
| 1 | `select#subject` | Subject |  |
| 2 | `input#course-number` | Course number (optional) |  |
| 3 | `button#search-btn` | Search classes |  |
| 4 | `button#filters-toggle` | More filters | `aria-expanded="true"` |
| 5 | `input#open-only` | Only show sections with open seats |  |
| 6 | `input#del-inperson` | In person |  |
| 7 | `input#del-online` | Online |  |
| 8 | `input#del-hybrid` | Hybrid |  |
| 9 | `button` | Remove CS 4110 section 001 from my schedule |  |
| 10 | `button` | Add CS 4110 section 002 to my schedule |  |
| 11 | `button` | Add CS 4110 section 003 (full) | `aria-disabled="true"` |
| 12 | `button` | Add CS 3100 section 001 to my schedule |  |
| 13 | `button` | Remove CS 3100 section 002 from my schedule |  |
| 14 | `button` | Remove CS 2810 section 001 from my schedule |  |
| 15 | `button` | Add CS 2810 section 002 to my schedule |  |
| 16 | `button` | Add CS 2420 section 001 (full) | `aria-disabled="true"` |
| 17 | `button` | Add CS 2420 section 002 to my schedule |  |
| 18 | `button` | Add CS 3750 section 001 to my schedule |  |
| 19 | `button` | Remove CS 4110 section 001 from my schedule |  |
| 20 | `button` | Remove CS 2810 section 001 from my schedule |  |
| 21 | `button` | Remove CS 3100 section 002 from my schedule |  |
| 22 | `button#review-btn` | Review schedule |  |
| 23 | `a` | Component state gallery |  |
| 24 | `button#lab-toggle` | Prototype controls | `aria-expanded="false"` |

**What this shows:** the order follows reading order (search form, filters, results top to bottom, then My schedule, then the footer). Every Add and Remove button is reachable, which fixes the Phase 1 finding that Tab skipped the Add buttons on the real page. Full sections keep a focusable Add button with `aria-disabled="true"` so a screen reader user still hears why it can't be added.

## Other keyboard behavior

| Key | Where | Result |
|---|---|---|
| Tab / Shift+Tab | Everywhere | Moves through controls in DOM order |
| Enter | Skip link | Jumps to `<main id="main">` |
| Arrow keys | Term options | Moves between open terms (native radio group); closed terms are skipped |
| Space | Checkboxes, buttons | Toggles or activates |
| Enter | Course number field | Submits the search form |
| Escape | My schedule sheet (phone) | Closes the sheet and returns focus to its toggle |
| Enter twice on Register | Review step | Second press is ignored and a polite "Still registering" message is announced |

## Focus management between steps

When the step changes, the new step's `<h1>` (which has `tabindex="-1"`) receives focus, `aria-current="step"` moves in the progress list, and `document.title` updates, so screen reader users hear the new step name right away. After adding or removing a section, focus stays on the same card's button (now labeled Remove or Add). After removing from the schedule list, focus moves to the next Remove button.

## axe-core results

axe-core 4 with WCAG 2.0 A/AA, 2.1 A/AA, 2.2 AA, and best practice rules.

| Screen | Viewport | Rules passed | Violations |
|---|---|---|---|
| Choose term | desktop | 40 | 0 |
| Find classes (results, filters open, 3 added) | desktop | 48 | 0 |
| Review and register | desktop | 40 | 0 |
| Results with a failed section | desktop | 37 | 0 |
| Choose term | mobile | 40 | 0 |
| Find classes (results, filters open, 3 added) | mobile | 47 | 0 |
| Review and register | mobile | 40 | 0 |
| Results with a failed section | mobile | 37 | 0 |
| Component state gallery | desktop | 24 | 0 |

Automated tools only catch part of real accessibility problems, so these results were paired with the manual keyboard pass above and the screen reader announcement script in the main specification.
