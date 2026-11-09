// Screenshot tabs for the dashboard tour: click or use the arrow keys to switch screens.
(function () {
  const SHOTS = {
    control: ["The Control room: open cases, tamper flags, decisions waiting and the team",
              "The Control room: everything waiting for a decision, every case and the team, at a glance."],
    overview: ["A verified case: every file's path rises green to the sealed root",
               "A verified case: each file's hash rises and merges into the sealed root, and four independent checks pass."],
    tampered: ["A tampered case: one changed file turns its path red",
               "A tampered case: one badge record was edited after sealing. Its path to the root turns red and the file is named."],
    custody: ["The custody ledger: signed, hash-chained entries",
              "The custody ledger: every upload, seal, hand-over and acceptance, signed and chained to the entry before."],
    trace: ["Trace: the incident as a UTC timeline",
            "Trace: the incident in UTC order, each event naming the sealed file and line it came from."],
    cases: ["All cases with status, verdict, lead and batches",
            "Cases: status, verdict, lead and sealed batches for every case the team works on."],
    complainant: ["The complainant portal with tracking IDs and progress",
                  "The complainant portal: each complaint has a tracking ID and a progress bar, from submitted to closed."],
    signin: ["The sign-in screen with the turning line globe",
             "Sign-in: approved accounts only, with a second step from an authenticator app."],
  };
  const tabs = Array.from(document.querySelectorAll(".tabs [data-shot]"));
  const img = document.getElementById("shot-img"), cap = document.getElementById("shot-cap");
  if (!tabs.length || !img) return;
  // warm the cache so switching is instant
  Object.keys(SHOTS).forEach((k) => { const i = new Image(); i.src = "assets/img/" + k + ".webp"; });
  function show(btn) {
    const k = btn.dataset.shot;
    tabs.forEach((t) => t.setAttribute("aria-selected", t === btn ? "true" : "false"));
    tabs.forEach((t) => t.tabIndex = t === btn ? 0 : -1);
    img.src = "assets/img/" + k + ".webp";
    img.alt = SHOTS[k][0];
    cap.textContent = SHOTS[k][1];
  }
  tabs.forEach((t, i) => {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener("click", () => show(t));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      n.focus(); show(n);
    });
  });
})();
