/*
 * 05 LATENCY FEEDBACK AND DOUBLE-SUBMISSION GUARD (annotated)
 * Source: assets/js/app.js
 */

const FEEDBACK_THRESHOLD_MS = 100;  // skeletons only if the wait passes this
const STILL_WORKING_MS = 3000;      // second message on long waits

/* ---- Search: skeletons after 100 ms --------------------------------------- */
async function runSearch(query) {
  state.searching = true;
  setBusy(btn, true, "Searching…");          // [A] button changes in the SAME frame
  results.setAttribute("aria-busy", "true"); // [B] readers wait for the final list
  status.textContent = "Searching for sections…";

  // [C] A fast response never flashes skeletons; a slow one shows them at 100 ms.
  const skeletonTimer = setTimeout(() => {
    results.innerHTML = skeletonMarkup(4);   // aria-hidden placeholders
  }, FEEDBACK_THRESHOLD_MS);

  await fetchSections(query);
  clearTimeout(skeletonTimer);
  state.searching = false;
  setBusy(btn, false);
  results.setAttribute("aria-busy", "false");
}

/* ---- Button loading state ------------------------------------------------- */
function setBusy(btn, busy, busyText) {
  const lbl = btn.querySelector(".btn__label");
  if (busy) {
    btn.dataset.idleText = lbl.textContent;
    lbl.textContent = busyText;              // "Registering…" replaces "Register for 3 sections"
    btn.classList.add("is-loading");         // spinner (static under reduced motion)
    btn.setAttribute("aria-disabled", "true"); // stays focusable: focus is not lost
  } else {
    lbl.textContent = btn.dataset.idleText;
    btn.classList.remove("is-loading");
    btn.removeAttribute("aria-disabled");
  }
}

/* ---- Register: three layers against repeat submission --------------------- */
$("#register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  // [D] Layer 1: a state flag. Double clicks and repeated Enter presses land
  //     here and do nothing except a polite reminder.
  if (state.submitting) {
    announce("Still registering. Please wait.");
    return;
  }
  /* …validation… */

  state.submitting = true;

  // [E] Layer 2: one idempotency key per attempt. A real server would store it
  //     and return the first result for any retry with the same key, so even
  //     a network-level retry can't register a student twice.
  const idempotencyKey = `${state.termId}-${Date.now().toString(36)}`;

  // [F] Layer 3: the UI. Button, Back, Remove, and the checkbox all lock so
  //     the request can't change while it's in flight.
  setBusy(btn, true, "Registering…");
  form.setAttribute("aria-busy", "true");
  backBtn.setAttribute("aria-disabled", "true");
  agree.disabled = true;

  statusText.textContent = `Registering ${count} sections. This usually takes a few seconds.`;
  announce(statusText.textContent);

  // [G] At 3 s the message changes color and copy, and says a second click is safe.
  const slowTimer = setTimeout(() => {
    statusBox.classList.add("is-slow");
    statusText.textContent = "Still working. Keep this page open. Selecting Register again won't send a second request.";
    announce(statusText.textContent);
  }, STILL_WORKING_MS);

  const results = await registerSections(state.cart.slice(), idempotencyKey);
  clearTimeout(slowTimer);
  state.submitting = false;
  /* …unlock, render results, move focus to the Results <h1>, announce summary… */
});

/* ---- Partial failure recovery -------------------------------------------- */
// [H] If a seat disappears mid-request, only that section fails. The results
//     row offers other sections of the same course that still have seats AND
//     don't overlap anything that did register, each with its own loading state.
function alternativesFor(s) {
  const registered = state.results.filter((r) => r.status === "registered").map((r) => byId(r.id));
  return state.sections.filter((x) =>
    x.subject === s.subject && x.number === s.number && x.id !== s.id &&
    seatsOpen(x) > 0 && !registered.some((r) => overlaps(r, x)));
}

/* Verified in Chromium: two rapid clicks on Register produced exactly one
 * request (the prototype counts requests in Prototype controls). */
