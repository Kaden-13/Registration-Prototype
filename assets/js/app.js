/*
 * Register for Classes concept prototype
 * Vanilla JS, no build step. All "server" calls are simulated with timers so
 * reviewers can see loading, error, and recovery states.
 */
(function () {
  "use strict";

  const DATA = window.REG_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ------------------------------------------------------------------ *
   * Constants
   * ------------------------------------------------------------------ */
  const FEEDBACK_THRESHOLD_MS = 100;   // show skeletons only if a wait passes this
  const STILL_WORKING_MS = 3000;       // extra reassurance on long submits
  const DELAYS = {
    normal: { search: 900, register: 2400, single: 1200 },
    slow:   { search: 3200, register: 8000, single: 3500 }
  };
  const DAY_NAMES = { M: "Mon", T: "Tue", W: "Wed", R: "Thu", F: "Fri" };
  const DAY_ORDER = ["M", "T", "W", "R", "F"];

  /* ------------------------------------------------------------------ *
   * State
   * ------------------------------------------------------------------ */
  const initialSections = () => DATA.sections.map((s) => ({ ...s }));

  const state = {
    step: "term",
    termId: null,
    sections: initialSections(),
    cart: [],                 // section ids
    lastQuery: null,
    searching: false,
    submitting: false,
    requestsSent: 0,
    results: [],              // [{id, status: "registered"|"failed", reason}]
    settings: { speed: "normal", race: true, searchFail: false }
  };

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  const byId = (id) => state.sections.find((s) => s.id === id);
  const seatsOpen = (s) => Math.max(0, s.capacity - s.taken);
  const label = (s) => `${s.subject} ${s.number} section ${s.section}`;
  const shortLabel = (s) => `${s.subject} ${s.number} ${s.section}`;
  const delay = (kind) => DELAYS[state.settings.speed][kind];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function fmtTime(min) {
    const h = Math.floor(min / 60), m = min % 60;
    const ap = h >= 12 ? "PM" : "AM";
    const h12 = ((h + 11) % 12) + 1;
    return { text: `${h12}:${String(m).padStart(2, "0")}`, ap };
  }
  function fmtRange(s) {
    if (s.start == null) return "No set meeting time";
    const a = fmtTime(s.start), b = fmtTime(s.end);
    return a.ap === b.ap
      ? `${a.text} to ${b.text} ${b.ap}`
      : `${a.text} ${a.ap} to ${b.text} ${b.ap}`;
  }
  function fmtDays(s) {
    return s.days.length ? s.days.map((d) => DAY_NAMES[d]).join(" ") : "Online";
  }
  function fmtWhen(s) {
    return s.start == null ? "Online, no set meeting time" : `${fmtDays(s)}, ${fmtRange(s)}`;
  }
  function overlaps(a, b) {
    if (a.start == null || b.start == null) return false;
    if (!a.days.some((d) => b.days.includes(d))) return false;
    return a.start < b.end && b.start < a.end;
  }
  function conflictFor(s) {
    return state.cart.map(byId).find((c) => c.id !== s.id && overlaps(c, s)) || null;
  }
  function sameCourseInCart(s) {
    return state.cart.map(byId).find((c) => c.id !== s.id &&
      c.subject === s.subject && c.number === s.number) || null;
  }
  function cartCredits() {
    return state.cart.reduce((sum, id) => sum + byId(id).credits, 0);
  }
  function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }
  function esc(str) {
    return String(str).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* Live region announcer. Clearing first makes repeat messages re-announce. */
  const srPolite = $("#sr-polite");
  const srAssertive = $("#sr-assertive");
  function announce(msg, mode = "polite") {
    const el = mode === "assertive" ? srAssertive : srPolite;
    el.textContent = "";
    window.setTimeout(() => { el.textContent = msg; }, 60);
  }

  /* Button loading state: immediate visual change, still focusable */
  function setBusy(btn, busy, busyText) {
    const lbl = $(".btn__label", btn);
    if (busy) {
      btn.dataset.idleText = lbl.textContent;
      lbl.textContent = busyText;
      btn.classList.add("is-loading");
      btn.setAttribute("aria-disabled", "true");
    } else {
      if (btn.dataset.idleText) lbl.textContent = btn.dataset.idleText;
      btn.classList.remove("is-loading");
      btn.removeAttribute("aria-disabled");
    }
  }

  /* Field-level error helpers */
  function showError(field, errorEl, msg) {
    errorEl.innerHTML = `<span class="field-error__icon" aria-hidden="true">!</span>${esc(msg)}`;
    errorEl.hidden = false;
    if (field) field.setAttribute("aria-invalid", "true");
  }
  function clearError(field, errorEl) {
    errorEl.textContent = "";
    errorEl.hidden = true;
    if (field) field.removeAttribute("aria-invalid");
  }

  /* ------------------------------------------------------------------ *
   * Step navigation
   * ------------------------------------------------------------------ */
  const STEP_TITLES = {
    term: "Choose a term",
    search: "Find classes",
    review: "Review and register",
    done: "Registration results"
  };
  const STEP_ORDER = ["term", "search", "review", "done"];

  function goTo(step, { focus = true } = {}) {
    state.step = step;
    STEP_ORDER.forEach((s) => { $(`#step-${s}`).hidden = s !== step; });

    const idx = STEP_ORDER.indexOf(step);
    $$(".progress__step").forEach((li, i) => {
      li.classList.toggle("is-complete", i < idx);
      if (i === idx) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });

    document.title = `${STEP_TITLES[step]} | Register for Classes prototype`;
    window.scrollTo(0, 0);
    if (focus) {
      const h = $(`#step-${step} h1`);
      h && h.focus();
    }
    if (step === "review") renderReview();
  }

  /* ------------------------------------------------------------------ *
   * STEP 1: term
   * ------------------------------------------------------------------ */
  function renderTerms() {
    const list = $("#term-list");
    list.innerHTML = DATA.terms.map((t) => {
      const closed = t.status !== "open";
      return `
        <div class="term-card${closed ? " is-disabled" : ""}">
          <input type="radio" name="term" id="term-${t.id}" value="${t.id}"
                 ${closed ? "disabled" : ""} aria-describedby="term-${t.id}-note">
          <label for="term-${t.id}">
            <span class="term-card__name">${esc(t.name)}</span>
            <span class="term-card__status ${closed ? "is-closed" : "is-open"}">${closed ? "Not open" : "Open"}</span>
            <span class="term-card__note" id="term-${t.id}-note">${esc(t.note)}</span>
          </label>
        </div>`;
    }).join("");

    $$('input[name="term"]', list).forEach((r) =>
      r.addEventListener("change", () => clearError(null, $("#term-error"))));
  }

  $("#term-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const chosen = $('input[name="term"]:checked');
    const err = $("#term-error");
    if (!chosen) {
      showError(null, err, "Choose a term to continue. Spring 2027 is the only term open right now.");
      announce("Choose a term to continue. Spring 2027 is the only term open right now.", "assertive");
      $('input[name="term"]:not(:disabled)').focus();
      return;
    }
    state.termId = chosen.value;
    const term = DATA.terms.find((t) => t.id === chosen.value);
    $$("[data-term-name]").forEach((el) => { el.textContent = term.name; });
    goTo("search");
  });

  /* ------------------------------------------------------------------ *
   * STEP 2: search
   * ------------------------------------------------------------------ */
  const subjectSel = $("#subject");
  DATA.subjects.forEach((s) => {
    const o = document.createElement("option");
    o.value = s.code; o.textContent = `${s.name} (${s.code})`;
    subjectSel.appendChild(o);
  });

  /* Disclosure widget (shared by filters and prototype controls) */
  function wireDisclosure(toggle, panel, onChange) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
      onChange && onChange(!open);
    });
  }
  wireDisclosure($("#filters-toggle"), $("#filters-panel"));
  wireDisclosure($("#lab-toggle"), $("#lab-panel"));

  function activeFilterCount() {
    let n = 0;
    if ($("#open-only").checked) n++;
    if ($$('input[name="delivery"]:checked').length < 3) n++;
    return n;
  }
  function updateFilterCount() {
    const n = activeFilterCount();
    $("#filters-count").textContent = n ? `(${n} on)` : "";
  }
  $$("#filters-panel input").forEach((i) => i.addEventListener("change", () => {
    updateFilterCount();
    clearError($("#delivery-group"), $("#delivery-error"));
  }));

  subjectSel.addEventListener("change", () => clearError(subjectSel, $("#subject-error")));
  $("#course-number").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
    clearError(e.target, $("#course-number-error"));
  });

  function validateSearch() {
    const errors = [];
    const subject = subjectSel.value;
    const num = $("#course-number").value.trim();
    const deliveries = $$('input[name="delivery"]:checked').map((i) => i.value);

    if (num && !/^\d{4}$/.test(num)) {
      errors.push({ field: $("#course-number"), el: $("#course-number-error"),
        msg: "Enter a 4-digit course number, like 4110, or leave it blank to see every course." });
    }
    if (!subject && !num) {
      errors.push({ field: subjectSel, el: $("#subject-error"),
        msg: "Choose a subject, or pick All subjects to see everything." });
    }
    if (!deliveries.length) {
      errors.push({ field: $("#delivery-group"), el: $("#delivery-error"),
        msg: "Pick at least one delivery type." });
      // make sure the user can see the error inside the collapsed panel
      const t = $("#filters-toggle");
      if (t.getAttribute("aria-expanded") === "false") t.click();
    }
    return { errors, query: { subject: subject || "ALL", num, deliveries, openOnly: $("#open-only").checked } };
  }

  $("#search-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (state.searching) return;                          // ignore repeat clicks

    [["#subject", "#subject-error"], ["#course-number", "#course-number-error"],
     ["#delivery-group", "#delivery-error"]].forEach(([f, el]) => clearError($(f), $(el)));

    const { errors, query } = validateSearch();
    if (errors.length) {
      errors.forEach((er) => showError(er.field, er.el, er.msg));
      const first = errors[0].field;
      (first.matches("fieldset") ? $("input", first) : first).focus();
      announce(`${plural(errors.length, "error", "errors")}. ${errors.map((x) => x.msg).join(" ")}`, "assertive");
      return;
    }
    runSearch(query);
  });

  async function runSearch(query) {
    state.lastQuery = query;
    state.searching = true;
    const btn = $("#search-btn");
    const results = $("#results");
    const status = $("#results-status");

    setBusy(btn, true, "Searching…");
    results.setAttribute("aria-busy", "true");
    status.textContent = "Searching for sections…";

    // Skeletons appear only if the wait is longer than the feedback threshold
    const skeletonTimer = setTimeout(() => {
      results.innerHTML = skeletonMarkup(4);
    }, FEEDBACK_THRESHOLD_MS);

    await wait(delay("search"));
    clearTimeout(skeletonTimer);
    state.searching = false;
    setBusy(btn, false);
    results.setAttribute("aria-busy", "false");

    if (state.settings.searchFail) {
      status.textContent = "Sections didn't load.";
      results.innerHTML = `
        <div class="alert alert--error" role="alert">
          <p class="alert__title">Sections didn't load</p>
          <p>The class search service didn't respond. Your schedule is safe. Check your connection, then try again.</p>
          <button type="button" class="btn btn--secondary" id="retry-search">Try again</button>
        </div>`;
      $("#retry-search").addEventListener("click", () => runSearch(state.lastQuery));
      return;
    }
    renderResults();
  }

  function skeletonMarkup(n) {
    return `<ul class="result-list" aria-hidden="true">${
      Array.from({ length: n }, () => `
        <li class="section-card section-card--skeleton">
          <span class="sk sk--title"></span><span class="sk sk--line"></span>
          <span class="sk sk--line sk--short"></span><span class="sk sk--btn"></span>
        </li>`).join("")}</ul>`;
  }

  function matchingSections() {
    const q = state.lastQuery;
    return state.sections.filter((s) =>
      (q.subject === "ALL" || s.subject === q.subject) &&
      (!q.num || s.number === q.num) &&
      q.deliveries.includes(s.delivery) &&
      (!q.openOnly || seatsOpen(s) > 0));
  }

  function renderResults({ keepFocusOn } = {}) {
    if (!state.lastQuery) return;
    const list = matchingSections();
    const status = $("#results-status");
    const results = $("#results");
    const q = state.lastQuery;
    const subjName = q.subject === "ALL" ? "all subjects"
      : DATA.subjects.find((s) => s.code === q.subject).name;
    const what = q.num ? `${q.subject === "ALL" ? "" : q.subject + " "}${q.num}` : subjName;

    if (!list.length) {
      status.textContent = `No sections match ${what}.`;
      results.innerHTML = `
        <div class="empty">
          <p class="empty__title">No sections match ${esc(what)}</p>
          <p>Try turning off filters or searching all subjects.</p>
          <button type="button" class="btn btn--secondary" id="clear-filters">Clear filters</button>
        </div>`;
      $("#clear-filters").addEventListener("click", () => {
        $("#open-only").checked = false;
        $$('input[name="delivery"]').forEach((i) => { i.checked = true; });
        updateFilterCount();
        $("#search-form").requestSubmit();
      });
      return;
    }

    const full = list.filter((s) => seatsOpen(s) === 0).length;
    status.textContent = `${plural(list.length, "section", "sections")} found for ${what}.` +
      (full ? ` ${full} ${full === 1 ? "is" : "are"} full.` : "");

    results.innerHTML = `<ul class="result-list">${list.map(cardMarkup).join("")}</ul>`;
    $$(".js-section-action", results).forEach((b) => b.addEventListener("click", onSectionAction));

    if (keepFocusOn) {
      const again = $(`[data-id="${keepFocusOn}"].js-section-action`, results);
      again && again.focus();
    }
  }

  function seatStrip(s) {
    const open = seatsOpen(s);
    const cells = Array.from({ length: s.capacity }, (_, i) =>
      `<span class="seat${i < s.taken ? " seat--taken" : " seat--open"}"></span>`).join("");
    return `<span class="seat-strip" aria-hidden="true">${cells}</span>`;
  }

  function cardMarkup(s) {
    const open = seatsOpen(s);
    const inCart = state.cart.includes(s.id);
    const conflict = !inCart && conflictFor(s);
    const dup = !inCart && sameCourseInCart(s);
    const base = s.id;
    let seatText, seatClass;
    if (open === 0) { seatText = `Full. All ${s.capacity} seats taken`; seatClass = "is-full"; }
    else if (open <= 3) { seatText = `${plural(open, "seat", "seats")} left of ${s.capacity}`; seatClass = "is-low"; }
    else { seatText = `${open} of ${s.capacity} seats open`; seatClass = "is-open"; }

    let action;
    if (inCart) {
      action = `<button type="button" class="btn btn--remove js-section-action" data-id="${s.id}" data-action="remove">
          Remove<span class="visually-hidden"> ${esc(label(s))} from my schedule</span></button>`;
    } else if (open === 0) {
      action = `<button type="button" class="btn btn--add js-section-action" data-id="${s.id}" data-action="full"
          aria-disabled="true" aria-describedby="${base}-note">
          Add<span class="visually-hidden"> ${esc(label(s))}</span></button>
        <p class="action-note" id="${base}-note">Full. Seats open up when students drop.</p>`;
    } else {
      const warn = conflict
        ? `<p class="action-note action-note--warn" id="${base}-note">Overlaps ${esc(shortLabel(conflict))} in your schedule.</p>`
        : dup ? `<p class="action-note action-note--warn" id="${base}-note">Adding this replaces ${esc(shortLabel(dup))}.</p>` : "";
      action = `<button type="button" class="btn btn--add js-section-action" data-id="${s.id}" data-action="add"
          ${warn ? `aria-describedby="${base}-note"` : ""}>
          Add<span class="visually-hidden"> ${esc(label(s))} to my schedule</span></button>${warn}`;
    }

    return `
      <li class="section-card${inCart ? " is-added" : ""}${open === 0 ? " is-full" : ""}" id="card-${base}">
        <article aria-labelledby="${base}-title">
          <div class="section-card__head">
            <h3 id="${base}-title" class="section-card__title">
              <span class="section-card__code">${s.subject} ${s.number}</span>
              <span class="section-card__sec">Section ${s.section}</span>
            </h3>
            ${inCart ? `<span class="badge badge--added">In my schedule</span>` : ""}
          </div>
          <p class="section-card__name">${esc(s.title)}</p>
          <dl class="section-card__meta">
            <div><dt>When</dt><dd>${esc(fmtWhen(s))}</dd></div>
            <div><dt>Where</dt><dd>${esc(s.room)}${s.delivery === "Hybrid" ? " and online" : ""}</dd></div>
            <div><dt>Instructor</dt><dd>${esc(s.instructor)}</dd></div>
            <div><dt>Credits</dt><dd>${s.credits}</dd></div>
          </dl>
          <div class="section-card__seats ${seatClass}">
            ${seatStrip(s)}
            <p class="seat-text" id="${base}-seats">${seatText}</p>
          </div>
          <div class="section-card__action">
            ${action}
          </div>
          <div class="inline-alert-slot" id="${base}-alert"></div>
        </article>
      </li>`;
  }

  function onSectionAction(e) {
    const btn = e.currentTarget;
    const s = byId(btn.dataset.id);
    const slot = $(`#${s.id}-alert`);
    slot.innerHTML = "";

    if (btn.dataset.action === "full") {
      const msg = `${label(s)} is full, so it can't be added. Seats open up when students drop. Try another section of ${s.subject} ${s.number}.`;
      slot.innerHTML = `<p class="inline-alert inline-alert--error">${esc(msg)}</p>`;
      announce(msg, "assertive");
      return;
    }

    if (btn.dataset.action === "remove") {
      removeFromCart(s.id, { focusResult: true });
      return;
    }

    const conflict = conflictFor(s);
    if (conflict) {
      const msg = `${label(s)} overlaps ${label(conflict)} (${fmtWhen(conflict)}). Remove ${shortLabel(conflict)} first, or choose a section at another time.`;
      slot.innerHTML = `
        <div class="inline-alert inline-alert--error">
          <p>${esc(msg)}</p>
          <button type="button" class="btn btn--secondary btn--small js-swap" data-remove="${conflict.id}" data-add="${s.id}">
            Swap ${esc(shortLabel(conflict))} for ${esc(shortLabel(s))}</button>
        </div>`;
      $(".js-swap", slot).addEventListener("click", (ev) => {
        state.cart = state.cart.filter((id) => id !== ev.currentTarget.dataset.remove);
        addToCart(ev.currentTarget.dataset.add);
      });
      announce(msg, "assertive");
      return;
    }

    const dup = sameCourseInCart(s);
    if (dup) {
      state.cart = state.cart.filter((id) => id !== dup.id);
      addToCart(s.id, `Replaced ${shortLabel(dup)} with ${shortLabel(s)}.`);
      return;
    }
    addToCart(s.id);
  }

  function addToCart(id, prefix) {
    if (!state.cart.includes(id)) state.cart.push(id);
    const s = byId(id);
    renderCart();
    renderResults({ keepFocusOn: id });
    announce(`${prefix ? prefix + " " : ""}${label(s)} added. ${cartSummaryText()}.`);
  }

  function removeFromCart(id, { focusResult = false } = {}) {
    const s = byId(id);
    state.cart = state.cart.filter((x) => x !== id);
    renderCart();
    renderResults({ keepFocusOn: focusResult ? id : null });
    announce(`${label(s)} removed. ${cartSummaryText()}.`);
  }

  /* ------------------------------------------------------------------ *
   * Cart ("My schedule")
   * ------------------------------------------------------------------ */
  function cartSummaryText() {
    return `${plural(state.cart.length, "section", "sections")}, ${plural(cartCredits(), "credit", "credits")}`;
  }

  function renderCart() {
    const list = $("#cart-list");
    $$("[data-cart-summary]").forEach((el) => { el.textContent = cartSummaryText(); });
    $("#cart-empty").hidden = state.cart.length > 0;

    list.innerHTML = state.cart.map(byId).map((s) => `
      <li class="cart-item">
        <div class="cart-item__text">
          <p class="cart-item__code">${s.subject} ${s.number} <span>${s.section}</span></p>
          <p class="cart-item__when">${esc(fmtWhen(s))}</p>
        </div>
        <button type="button" class="btn btn--icon js-cart-remove" data-id="${s.id}"
                aria-label="Remove ${esc(label(s))} from my schedule">Remove</button>
      </li>`).join("");

    $$(".js-cart-remove", list).forEach((b) => b.addEventListener("click", () => {
      const idx = state.cart.indexOf(b.dataset.id);
      removeFromCart(b.dataset.id);
      // keep focus in the cart: next item's remove button, or the heading area
      const btns = $$(".js-cart-remove", list);
      (btns[idx] || btns[idx - 1] || $("#review-btn")).focus();
    }));

    const review = $("#review-btn");
    const note = $("#review-note");
    if (state.cart.length) {
      review.removeAttribute("aria-disabled");
      review.removeAttribute("aria-describedby");
      note.hidden = true;
    } else {
      review.setAttribute("aria-disabled", "true");
      review.setAttribute("aria-describedby", "review-note");
      note.hidden = false;
    }
  }

  $("#review-btn").addEventListener("click", (e) => {
    if (e.currentTarget.getAttribute("aria-disabled") === "true") {
      const note = $("#review-note");
      note.classList.add("is-flagged");
      announce("Add at least one section to review your schedule.", "assertive");
      return;
    }
    collapseCartOnMobile();
    goTo("review");
  });

  /* Mobile: the cart is a bottom sheet with an aria-expanded toggle */
  const mq = window.matchMedia("(max-width: 899px)");
  const cartToggle = $("#cart-toggle");
  const cartBody = $("#cart-body");
  function syncCartMode() {
    if (mq.matches) {
      const open = cartToggle.getAttribute("aria-expanded") === "true";
      cartBody.hidden = !open;
      $("#cart").classList.toggle("is-open", open);
    } else {
      cartBody.hidden = false;
      $("#cart").classList.remove("is-open");
    }
  }
  function collapseCartOnMobile() {
    if (!mq.matches) return;
    cartToggle.setAttribute("aria-expanded", "false");
    syncCartMode();
  }
  cartToggle.addEventListener("click", () => {
    const open = cartToggle.getAttribute("aria-expanded") === "true";
    cartToggle.setAttribute("aria-expanded", String(!open));
    syncCartMode();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (mq.matches && cartToggle.getAttribute("aria-expanded") === "true") {
      cartToggle.setAttribute("aria-expanded", "false");
      syncCartMode();
      cartToggle.focus();
    }
  });
  mq.addEventListener("change", syncCartMode);

  /* ------------------------------------------------------------------ *
   * STEP 3: review and register
   * ------------------------------------------------------------------ */
  function renderReview() {
    const items = state.cart.map(byId).sort((a, b) =>
      (a.start ?? 9999) - (b.start ?? 9999));
    $("#review-items").innerHTML = items.map((s) => `
      <li class="review-item">
        <div>
          <p class="review-item__code">${s.subject} ${s.number} <span>Section ${s.section}</span></p>
          <p class="review-item__name">${esc(s.title)}</p>
          <p class="review-item__when">${esc(fmtWhen(s))}. ${esc(s.room)}. ${plural(s.credits, "credit", "credits")}.</p>
        </div>
        <button type="button" class="btn btn--secondary btn--small js-review-remove" data-id="${s.id}">
          Remove<span class="visually-hidden"> ${esc(label(s))}</span></button>
      </li>`).join("");
    $("#review-credits").textContent = cartCredits();
    $(".btn__label", $("#register-btn")).textContent =
      `Register for ${plural(state.cart.length, "section", "sections")}`;

    $$(".js-review-remove").forEach((b) => b.addEventListener("click", () => {
      if (state.submitting) return;
      removeFromCart(b.dataset.id);
      if (!state.cart.length) { goTo("search"); return; }
      renderReview();
      $("#h-review-list").setAttribute("tabindex", "-1");
      $("#h-review-list").focus();
    }));

    renderWeek(items);
  }

  function renderWeek(items) {
    const START = 7 * 60, END = 21 * 60, SPAN = END - START;
    const grid = $("#week-grid");
    const meets = items.filter((s) => s.start != null);
    const hours = [];
    for (let h = 8; h <= 20; h += 2) hours.push(h);

    grid.innerHTML = `
      <div class="week__hours">${hours.map((h) =>
        `<span style="top:${((h * 60 - START) / SPAN) * 100}%">${((h + 11) % 12) + 1} ${h >= 12 ? "PM" : "AM"}</span>`).join("")}</div>
      ${DAY_ORDER.map((d) => `
        <div class="week__day">
          <span class="week__dayname">${DAY_NAMES[d]}</span>
          <div class="week__col">
            ${meets.filter((s) => s.days.includes(d)).map((s) => `
              <span class="week__block" style="top:${((s.start - START) / SPAN) * 100}%;height:${((s.end - s.start) / SPAN) * 100}%">
                ${s.subject} ${s.number}</span>`).join("")}
          </div>
        </div>`).join("")}`;

    const online = items.filter((s) => s.start == null);
    $("#week-online").textContent = online.length
      ? `Online with no set time: ${online.map(shortLabel).join(", ")}.` : "";
  }

  $("#agree").addEventListener("change", () => clearError($("#agree"), $("#agree-error")));
  $("#back-to-search").addEventListener("click", () => {
    if (state.submitting) return;
    goTo("search");
  });

  /*
   * Submit with double-submission protection:
   *  1. state.submitting guard drops repeat clicks / Enter presses
   *  2. button switches to aria-disabled + "Registering…" in the same frame
   *  3. one idempotency key per attempt, so a retried request can't double-register
   */
  $("#register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (state.submitting) {
      announce("Still registering. Please wait.", "polite");
      return;
    }
    const agree = $("#agree");
    if (!agree.checked) {
      showError(agree, $("#agree-error"),
        "Check the box to confirm you understand the charges, then select Register again.");
      agree.focus();
      announce("Error. Check the box to confirm you understand the charges, then select Register again.", "assertive");
      return;
    }

    state.submitting = true;
    const idempotencyKey = `${state.termId}-${Date.now().toString(36)}`;
    const form = $("#register-form");
    const btn = $("#register-btn");
    const statusBox = $("#submit-status");
    const statusText = $("#submit-status-text");
    const count = state.cart.length;

    setBusy(btn, true, "Registering…");
    form.setAttribute("aria-busy", "true");
    $("#back-to-search").setAttribute("aria-disabled", "true");
    $$(".js-review-remove").forEach((b) => b.setAttribute("aria-disabled", "true"));
    agree.disabled = true;
    statusBox.hidden = false;
    statusBox.classList.remove("is-slow");
    statusText.textContent = `Registering ${plural(count, "section", "sections")}. This usually takes a few seconds.`;
    announce(statusText.textContent);

    const slowTimer = setTimeout(() => {
      statusBox.classList.add("is-slow");
      statusText.textContent = "Still working. Keep this page open. Selecting Register again won't send a second request.";
      announce(statusText.textContent);
    }, STILL_WORKING_MS);

    state.requestsSent++;
    $("#lab-requests").textContent = state.requestsSent;
    const results = await fakeRegister(state.cart.slice(), idempotencyKey);

    clearTimeout(slowTimer);
    state.submitting = false;
    setBusy(btn, false);
    form.setAttribute("aria-busy", "false");
    $("#back-to-search").removeAttribute("aria-disabled");
    agree.disabled = false;
    statusBox.hidden = true;

    state.results = results;
    state.cart = results.filter((r) => r.status === "failed").map((r) => r.id);
    renderCart();
    renderDone();
    goTo("done");
    announceDone();
  });

  /* Simulated server. The last open seat can be taken by someone else mid-request. */
  async function fakeRegister(ids, key) {
    await wait(delay("register"));
    return ids.map((id) => {
      const s = byId(id);
      if (seatsOpen(s) === 0 || (state.settings.race && seatsOpen(s) === 1)) {
        s.taken = s.capacity;
        return { id, status: "failed", key,
          reason: "The last seat was taken by another student while your request was processing." };
      }
      s.taken++;
      return { id, status: "registered", key };
    });
  }

  /* ------------------------------------------------------------------ *
   * STEP 4: results and recovery
   * ------------------------------------------------------------------ */
  function alternativesFor(s) {
    const registered = state.results.filter((r) => r.status === "registered").map((r) => byId(r.id));
    return state.sections.filter((x) =>
      x.subject === s.subject && x.number === s.number && x.id !== s.id &&
      seatsOpen(x) > 0 && !registered.some((r) => overlaps(r, x)));
  }

  function renderDone() {
    const list = $("#done-list");
    const ok = state.results.filter((r) => r.status === "registered").length;
    const bad = state.results.length - ok;
    $("#done-summary").textContent = bad
      ? `${ok} of ${state.results.length} sections registered. ${plural(bad, "section needs", "sections need")} your attention.`
      : `All ${plural(ok, "section", "sections")} registered. You're set for ${DATA.terms.find((t) => t.id === state.termId).name}.`;

    list.innerHTML = state.results.map((r) => {
      const s = byId(r.id);
      if (r.status === "registered") {
        return `
          <li class="done-item done-item--ok" id="done-${s.id}">
            <span class="done-item__icon" aria-hidden="true">✓</span>
            <div>
              <p class="done-item__code">${s.subject} ${s.number} <span>Section ${s.section}</span></p>
              <p class="done-item__status">Registered. ${esc(fmtWhen(s))}.</p>
            </div>
          </li>`;
      }
      const alts = alternativesFor(s);
      return `
        <li class="done-item done-item--fail" id="done-${s.id}">
          <span class="done-item__icon" aria-hidden="true">!</span>
          <div>
            <p class="done-item__code">${s.subject} ${s.number} <span>Section ${s.section}</span></p>
            <p class="done-item__status"><strong>Not registered.</strong> ${esc(r.reason)}</p>
            ${alts.length ? `
              <p class="done-item__next">These sections still have seats and fit your schedule:</p>
              <ul class="alt-list">${alts.map((a) => `
                <li><button type="button" class="btn btn--primary btn--small js-alt" data-fail="${s.id}" data-id="${a.id}">
                  <span class="btn__spinner" aria-hidden="true"></span>
                  <span class="btn__label">Register for section ${a.section}</span></button>
                  <span class="alt-list__meta">${esc(fmtWhen(a))}. ${plural(seatsOpen(a), "seat", "seats")} open.</span></li>`).join("")}
              </ul>`
            : `<p class="done-item__next">No other section fits right now. Search again or check back after the drop deadline.</p>`}
          </div>
        </li>`;
    }).join("");

    $$(".js-alt", list).forEach((b) => b.addEventListener("click", onAlternative));
  }

  function announceDone() {
    announce($("#done-summary").textContent, "polite");
  }

  async function onAlternative(e) {
    const btn = e.currentTarget;
    if (btn.classList.contains("is-loading")) return;      // double-click guard
    const failId = btn.dataset.fail;
    const alt = byId(btn.dataset.id);
    $$(`.js-alt[data-fail="${failId}"]`).forEach((b) => b.setAttribute("aria-disabled", "true"));
    setBusy(btn, true, `Registering section ${alt.section}…`);
    announce(`Registering ${label(alt)}.`);
    state.requestsSent++;
    $("#lab-requests").textContent = state.requestsSent;

    await wait(delay("single"));
    alt.taken++;
    const r = state.results.find((x) => x.id === failId);
    r.id = alt.id; r.status = "registered"; delete r.reason;
    state.cart = state.cart.filter((id) => id !== failId);
    renderCart();
    renderDone();
    const row = $(`#done-${alt.id}`);
    row.setAttribute("tabindex", "-1");
    row.focus();
    announce(`${label(alt)} registered. ${$("#done-summary").textContent}`);
  }

  $("#search-more").addEventListener("click", () => {
    goTo("search");
    if (state.lastQuery) renderResults();
  });
  $("#start-over").addEventListener("click", resetAll);

  /* ------------------------------------------------------------------ *
   * Prototype controls
   * ------------------------------------------------------------------ */
  $("#lab-speed").addEventListener("change", (e) => { state.settings.speed = e.target.value; });
  $("#lab-race").addEventListener("change", (e) => { state.settings.race = e.target.checked; });
  $("#lab-searchfail").addEventListener("change", (e) => { state.settings.searchFail = e.target.checked; });
  $("#lab-reset").addEventListener("click", () => { resetAll(); announce("Prototype reset."); });

  function resetAll() {
    state.sections = initialSections();
    state.cart = [];
    state.results = [];
    state.lastQuery = null;
    $("#search-form").reset();
    $("#agree").checked = false;
    updateFilterCount();
    $("#results").innerHTML = "";
    $("#results-status").textContent = "Choose a subject and search to see sections.";
    $$('input[name="term"]').forEach((r) => { r.checked = false; });
    renderCart();
    goTo("term");
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  renderTerms();
  renderCart();
  syncCartMode();
  updateFilterCount();

  // Deep links used for screenshots and grading: index.html#search, #review
  const hash = location.hash.replace("#", "");
  if (hash === "search" || hash === "review") {
    $("#term-2027SP").checked = true;
    state.termId = "2027SP";
    goTo("search", { focus: false });
  }
})();
