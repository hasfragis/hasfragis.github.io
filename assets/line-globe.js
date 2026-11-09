/*!
 * line-globe.js: a slowly turning globe of flowing lines, drawn on a <canvas>.
 * By Krupakar S B (from the Hasfragis sign-in screen). No libraries, no network, about 4 KB.
 *
 * Use:
 *   <canvas data-line-globe></canvas>
 *   <script src="line-globe.js" defer></script>
 *
 * Size the canvas with CSS (it fills its box, keeps the globe round). Options, all optional, as data- attributes:
 *   data-color-a="#34d1bf"   first colour of the gradient (top left)
 *   data-color-b="#4f8dff"   second colour (bottom right)
 *   data-lines="40"          how many flowing lines (20-80 looks good)
 *   data-speed="1"           turning speed (0.5 slower, 2 faster)
 *   data-ripple="1"          how wavy the lines are (0.5 calmer, 1.5 wilder)
 *   data-back="0.07"         how visible the far side is (0 hides it)
 *   data-seed="7"            change for a different pattern
 * Colours can also come from CSS custom properties --globe-a and --globe-b on the canvas or any parent,
 * so a light/dark theme can recolour it. data- attributes win over CSS.
 *
 * Behaviour: pauses when the tab is hidden, draws one still frame for people who prefer reduced motion,
 * redraws sharply on resize and on high-DPI screens. Works with a strict CSP (script-src 'self'): no inline code.
 * Call window.LineGlobe.init(canvas) for canvases added later.
 */
(function () {
  "use strict";

  function make(canvas) {
    if (!canvas || !canvas.getContext || canvas.__lineGlobe) return;
    canvas.__lineGlobe = true;
    const ctx = canvas.getContext("2d");
    const d = canvas.dataset;
    const num = (v, def) => (v !== undefined && v !== "" && !isNaN(+v) ? +v : def);
    const LINES = Math.max(4, Math.min(160, num(d.lines, 40)));
    const SPEED = num(d.speed, 1), RIPPLE = num(d.ripple, 1), BACK = num(d.back, 0.07);
    const STEPS = 160;
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // each line is a wavy ring around the globe, tilted and rippled a little differently
    let seed = Math.max(1, Math.floor(num(d.seed, 7)));
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const curves = [];
    for (let i = 0; i < LINES; i++) {
      curves.push({
        lat: -1.35 + (2.7 * (i + 0.5)) / LINES,
        amp: (0.06 + rnd() * 0.2) * RIPPLE,
        k: 2 + Math.floor(rnd() * 2),
        ph: rnd() * Math.PI * 2,
        tilt: (rnd() - 0.5) * 0.5,
        spin: (rnd() - 0.5) * 0.25,
        w: 0.6 + rnd() * 0.9,
      });
    }

    let W = 1, H = 1, R = 1, colA = "#34d1bf", colB = "#4f8dff";
    function colours() {
      const cs = getComputedStyle(canvas);
      colA = d.colorA || cs.getPropertyValue("--globe-a").trim() || colA;
      colB = d.colorB || cs.getPropertyValue("--globe-b").trim() || colB;
    }
    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(W, H) * 0.44;
      colours();
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const ry = t * 0.00011 * SPEED, rx = 0.38 + Math.sin(t * 0.00007 * SPEED) * 0.08;
      const cyr = Math.cos(ry), syr = Math.sin(ry), cxr = Math.cos(rx), sxr = Math.sin(rx);
      const grad = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      grad.addColorStop(0, colA); grad.addColorStop(1, colB);
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = grad;
      for (const c of curves) {
        const ph = c.ph + t * 0.00018 * SPEED * (1 + c.spin);
        const ct = Math.cos(c.tilt), st = Math.sin(c.tilt);
        for (const front of [false, true]) {
          if (!front && BACK <= 0) continue;
          ctx.beginPath();
          let pen = false;
          for (let s = 0; s <= STEPS; s++) {
            const th = (s / STEPS) * Math.PI * 2;
            const lat = c.lat + c.amp * Math.sin(c.k * th + ph) * Math.cos(c.lat);
            const x = Math.cos(lat) * Math.cos(th), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(th);
            const y1 = y * ct - x * st, x1 = y * st + x * ct;              // tilt the ring
            const x2 = x1 * cyr + z * syr, z2 = -x1 * syr + z * cyr;        // turn around the vertical axis
            const y3 = y1 * cxr - z2 * sxr, z3 = y1 * sxr + z2 * cxr;       // lean toward the viewer
            if ((z3 > 0) !== front) { pen = false; continue; }
            const p = 1 + z3 * 0.12;                                        // a touch of perspective
            const px = cx + x2 * R * p, py = cy - y3 * R * p;
            if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
          }
          ctx.globalAlpha = front ? 0.9 : BACK;
          ctx.lineWidth = front ? c.w * 0.85 : c.w * 0.6;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    let raf = 0;
    const t0 = performance.now();
    const frame = (now) => { draw(now - t0 + 40000); raf = requestAnimationFrame(frame); };
    function run() {
      cancelAnimationFrame(raf);
      if (still || document.hidden) draw(40000); else raf = requestAnimationFrame(frame);
    }
    resize(); run();
    if (window.ResizeObserver) new ResizeObserver(() => { resize(); if (still || document.hidden) draw(40000); }).observe(canvas);
    else window.addEventListener("resize", () => { resize(); if (still) draw(40000); });
    document.addEventListener("visibilitychange", run);
    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onScheme = () => { colours(); if (still || document.hidden) draw(40000); };
      mq.addEventListener ? mq.addEventListener("change", onScheme) : mq.addListener(onScheme);
    }
  }

  function initAll() { document.querySelectorAll("canvas[data-line-globe]").forEach(make); }
  window.LineGlobe = { init: make };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll); else initAll();
})();
