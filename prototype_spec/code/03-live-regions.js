/*
 * 03 LIVE REGIONS AND ANNOUNCEMENTS (annotated)
 * Source: assets/js/app.js
 *
 * Two global regions exist in the HTML from page load:
 *   <div id="sr-polite"    aria-live="polite"    aria-atomic="true"></div>
 *   <div id="sr-assertive" aria-live="assertive" aria-atomic="true"></div>
 * plus one region-specific status line:
 *   <p id="results-status" aria-live="polite">…</p>
 *
 * Rule used across the prototype:
 *   polite    = progress and confirmations (searching, added, registering, results)
 *   assertive = something blocked the user's action (validation, full section, conflict)
 */

const srPolite = document.querySelector("#sr-polite");
const srAssertive = document.querySelector("#sr-assertive");

function announce(msg, mode = "polite") {
  const el = mode === "assertive" ? srAssertive : srPolite;
  el.textContent = "";                         // [A] clear first so a repeated message
  window.setTimeout(() => {                    //     ("Still registering") is read again
    el.textContent = msg;
  }, 60);
}

/* ---- Where each announcement fires -------------------------------------- */

// [B] Search started. The status line itself is polite, so changing its text is enough.
status.textContent = "Searching for sections…";

// [C] Search finished: count plus how many are full, so a screen reader user
//     knows what to expect before moving into the list.
status.textContent = "10 sections found for Computer Science. 2 are full.";

// [D] Validation blocked the search. Assertive, with the fix in the message.
announce("1 error. Choose a subject, or pick All subjects to see everything.", "assertive");

// [E] Section added. Polite, includes the new total so users don't have to go look.
announce("CS 4110 section 002 added. 2 sections, 8 credits.");

// [F] Pressing a full section's Add button (aria-disabled) reads the reason.
announce("CS 4110 section 003 is full, so it can't be added. Seats open up when students drop. Try another section of CS 4110.", "assertive");

// [G] Time conflict. Names both sections and the way out.
announce("CS 3100 section 001 overlaps CS 4110 section 001 (Mon Wed, 9:00 to 10:50 AM). Remove CS 4110 001 first, or choose a section at another time.", "assertive");

// [H] Register pressed. Polite, sets an expectation for how long it takes.
announce("Registering 3 sections. This usually takes a few seconds.");

// [I] Still waiting after 3 s. Reassures and explains that a second click is safe.
announce("Still working. Keep this page open. Selecting Register again won't send a second request.");

// [J] Results. Leads with the outcome count, then the detail lives on the page.
announce("2 of 3 sections registered. 1 section needs your attention.");

/* [K] Why a separate region for messages instead of role="alert" on each card:
 *     cards are re-rendered after every add/remove. A region that is created and
 *     filled in the same tick is often not announced. The global regions never
 *     leave the DOM, so every message is read reliably.
 */
