/*
 * 04 INLINE VALIDATION AND ACCESSIBLE DISABLED STATES (annotated)
 * Source: assets/js/app.js
 */

/* ---- Field-level errors -------------------------------------------------- */
function showError(field, errorEl, msg) {
  // [A] Icon is decorative; the words carry the meaning.
  errorEl.innerHTML = `<span class="field-error__icon" aria-hidden="true">!</span>${esc(msg)}`;
  errorEl.hidden = false;
  // [B] aria-invalid flips the field's red style AND tells screen readers.
  //     The error <p> is already referenced by the field's aria-describedby,
  //     so the message is read when focus lands on the field.
  if (field) field.setAttribute("aria-invalid", "true");
}
function clearError(field, errorEl) {
  errorEl.textContent = "";   // [C] empty text so a stale description isn't read
  errorEl.hidden = true;
  if (field) field.removeAttribute("aria-invalid");
}

// [D] Errors clear as soon as the user starts fixing them, not on next submit.
subjectSel.addEventListener("change", () => clearError(subjectSel, $("#subject-error")));
$("#course-number").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, ""); // digits only, prevents the error
  clearError(e.target, $("#course-number-error"));
});

// [E] On submit: show every error, focus the first one, announce the list.
if (errors.length) {
  errors.forEach((er) => showError(er.field, er.el, er.msg));
  const first = errors[0].field;
  (first.matches("fieldset") ? first.querySelector("input") : first).focus();
  announce(`${errors.length} error(s). ${errors.map((x) => x.msg).join(" ")}`, "assertive");
  return;
}

/* Error copy rules used everywhere:
 *   say what is wrong + how to fix it + an example when format matters
 *   "Enter a 4-digit course number, like 4110, or leave it blank to see every course."
 *   never "Invalid input" and never an apology
 */

/* ---- Disabled with an explanation ---------------------------------------- */
/*
 * Native `disabled` removes a button from the Tab order, so a keyboard or
 * screen reader user never learns WHY it can't be used. For buttons whose
 * reason matters (full section, empty schedule), the prototype uses
 * aria-disabled instead:
 *
 * <button class="btn btn--add" aria-disabled="true" aria-describedby="CS4110-003-note">
 *   Add<span class="visually-hidden"> CS 4110 section 003</span>
 * </button>
 * <p class="action-note" id="CS4110-003-note">Full. Seats open up when students drop.</p>
 *
 * Focus lands on it, the reason is read as its description, and the click
 * handler explains instead of acting:
 */
if (btn.dataset.action === "full") {
  slot.innerHTML = `<p class="inline-alert inline-alert--error">${esc(msg)}</p>`;
  announce(msg, "assertive");
  return;
}

/*
 * Native `disabled` IS used where the reason is obvious from context and no
 * one needs to reach the control: terms that aren't open (the reason sits
 * in the same card and is linked by aria-describedby) and the confirmation
 * checkbox while a registration request is in flight.
 */
