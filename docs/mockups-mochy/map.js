// Bản đồ campus isometric cho mock. Dữ liệu block lấy gần đúng từ docs/campus/eiu-osm-seed.json
// (x đông, z bắc, mét). Dùng: <svg class="iso" data-map='{"c":[58,148],"s":1.6, ...}'></svg>
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var FH = 3.6, VS = 1.45;
  var BLOCKS = [
    { code: "8", c: [40, 207], s: [105, 60], f: 4 },
    { code: "11", c: [58, 148], s: [115, 45], f: 4 },
    { code: "9", c: [-85.5, 155], s: [60, 40], f: 4 },
    { code: "10", c: [-97.5, 92], s: [60, 40], f: 4 },
    { code: "4", c: [133, 105], s: [70, 28], f: 3 },
    { code: "5", c: [183, 100], s: [36, 46], f: 3 },
    { code: "3", c: [122, -40], s: [37, 32], f: 3 },
    { code: "6", c: [198, -54], s: [35, 17], f: 2 },
    { code: "Căn tin", c: [130, 260], s: [70, 48], f: 1 }
  ];
  var BOUNDARY = [[224.9, 315.1], [-153.7, 231.3], [-246.3, 2], [-306, -150.5], [-300.2, -163.3], [302.3, -319.2], [316.7, -310.7], [248.4, 303.5]];
  var uid = 0;

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function draw(svg) {
    var cfg = JSON.parse(svg.getAttribute("data-map"));
    var s = cfg.s || 1, at = cfg.at || [180, 330];
    function P(x, z, h) {
      var c = cfg.c;
      return [at[0] + ((x - c[0]) - (z - c[1])) * 0.866 * s, at[1] - ((x - c[0]) + (z - c[1])) * 0.5 * s - (h || 0) * VS * s];
    }
    function poly(pts, attrs, parent) {
      attrs.points = pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
      return el("polygon", attrs, parent);
    }
    svg.setAttribute("viewBox", "0 0 360 784");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    var g = el("g", {}, svg);

    // nền campus
    poly(BOUNDARY.map(function (p) { return P(p[0], p[1], 0); }), { fill: "#070707", stroke: "rgba(255,255,255,.07)", "stroke-width": 1 }, g);
    // lưới mờ 20 m
    for (var gx = -300; gx <= 320; gx += 20) {
      var a = P(gx, -320, 0), b = P(gx, 360, 0);
      el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: "rgba(255,255,255,.025)" }, g);
    }
    for (var gz = -320; gz <= 360; gz += 20) {
      var a2 = P(-300, gz, 0), b2 = P(320, gz, 0);
      el("line", { x1: a2[0], y1: a2[1], x2: b2[0], y2: b2[1], stroke: "rgba(255,255,255,.025)" }, g);
    }

    // đường đi (vẽ trước block để bị che bởi tòa nhà phía trước)
    (cfg.lines || []).forEach(function (ln) {
      var pts = ln.pts.map(function (p) { return P(p[0], p[1], 0); });
      el("polyline", {
        points: pts.map(function (p) { return p.join(","); }).join(" "), fill: "none",
        stroke: ln.color || "#fff", "stroke-width": ln.w || 3, "stroke-linecap": "round", "stroke-linejoin": "round",
        "stroke-dasharray": ln.dash ? "1 7" : "none", opacity: ln.op || 1
      }, g);
    });

    var counts = cfg.counts || null, maxN = 1;
    if (counts) for (var k in counts) maxN = Math.max(maxN, counts[k] || 0);

    BLOCKS.slice().sort(function (p, q) { return (q.c[0] + q.c[1]) - (p.c[0] + p.c[1]); }).forEach(function (bk) {
      var x0 = bk.c[0] - bk.s[0] / 2, x1 = bk.c[0] + bk.s[0] / 2, z0 = bk.c[1] - bk.s[1] / 2, z1 = bk.c[1] + bk.s[1] / 2;
      var H = bk.f * FH;
      var hl = cfg.hl && cfg.hl.code === bk.code ? cfg.hl : null;
      var dim = cfg.hl && !hl ? 1 : 0;
      var top = dim ? "#1b1b1b" : "#262626", south = dim ? "#121212" : "#1a1a1a", west = dim ? "#0d0d0d" : "#131313";
      if (counts) {
        var n = counts[bk.code] || 0, t = n / maxN;
        var v = Math.round(30 + t * 200);
        top = "rgb(" + v + "," + v + "," + v + ")";
        south = "rgb(" + Math.round(v * .62) + "," + Math.round(v * .62) + "," + Math.round(v * .62) + ")";
        west = "rgb(" + Math.round(v * .46) + "," + Math.round(v * .46) + "," + Math.round(v * .46) + ")";
      }
      if (hl && !hl.floor) { top = "#f2f2f2"; south = "#bdbdbd"; west = "#8f8f8f"; }
      var bg = el("g", {}, g);
      poly([P(x0, z0, 0), P(x1, z0, 0), P(x1, z0, H), P(x0, z0, H)], { fill: south }, bg);
      poly([P(x0, z0, 0), P(x0, z1, 0), P(x0, z1, H), P(x0, z0, H)], { fill: west }, bg);
      if (hl && hl.floor) {
        var h0 = (hl.floor - 1) * FH, h1 = hl.floor * FH;
        poly([P(x0, z0, h0), P(x1, z0, h0), P(x1, z0, h1), P(x0, z0, h1)], { fill: "#e9e9e9" }, bg);
        poly([P(x0, z0, h0), P(x0, z1, h0), P(x0, z1, h1), P(x0, z0, h1)], { fill: "#a9a9a9" }, bg);
      }
      for (var f = 1; f < bk.f; f++) {
        var hh = f * FH, a = P(x0, z1, hh), m = P(x0, z0, hh), e = P(x1, z0, hh);
        el("polyline", { points: [a, m, e].map(function (p) { return p.join(","); }).join(" "), fill: "none", stroke: "rgba(0,0,0,.35)", "stroke-width": 1 }, bg);
      }
      poly([P(x0, z0, H), P(x1, z0, H), P(x1, z1, H), P(x0, z1, H)], { fill: top, stroke: "rgba(255,255,255,.06)", "stroke-width": 1 }, bg);
      if (cfg.labels !== false) {
        var lp = P(bk.c[0], bk.c[1], H);
        var dark = (hl && !hl.floor) || (counts && (counts[bk.code] || 0) / maxN > .55);
        var tx = el("text", { x: lp[0], y: lp[1] + 4, "text-anchor": "middle", "font-size": bk.code.length > 2 ? 10 : 12, "font-weight": 700, fill: dark ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.34)", "letter-spacing": "-.02em" }, bg);
        tx.textContent = bk.code.length > 2 ? bk.code : "B" + bk.code;
      }
      if (counts && counts[bk.code] != null) {
        var cp = P(bk.c[0], bk.c[1], H);
        var lab = counts[bk.code] < 3 ? "< 3" : String(counts[bk.code]);
        pill(g, cp[0], cp[1] - 26, lab, { solid: counts[bk.code] >= 3, big: true });
      }
    });

    (cfg.pins || []).forEach(function (pn) {
      var h = pn.floor ? (pn.floor - 1) * FH + 1.2 : 0;
      var ground = P(pn.x, pn.z, 0), p = P(pn.x, pn.z, h);
      if (pn.acc) el("ellipse", { cx: ground[0], cy: ground[1], rx: pn.acc * 1.2247 * s, ry: pn.acc * 0.707 * s, fill: "rgba(255,255,255,.08)", stroke: "rgba(255,255,255,.22)", "stroke-width": 1 }, g);
      var lift = pn.lift == null ? 26 : pn.lift;
      var cy = p[1] - lift;
      el("line", { x1: p[0], y1: p[1], x2: p[0], y2: cy, stroke: "rgba(255,255,255,.7)", "stroke-width": 1.5 }, g);
      el("circle", { cx: p[0], cy: p[1], r: 2.5, fill: "#fff" }, g);
      var id = "pc" + (++uid), r = pn.r || 17;
      var cp = el("clipPath", { id: id }, g);
      el("circle", { cx: p[0], cy: cy, r: r }, cp);
      el("circle", { cx: p[0], cy: cy, r: r + 2.5, fill: "#fff" }, g);
      el("image", { href: pn.img, x: p[0] - r, y: cy - r, width: r * 2, height: r * 2, "clip-path": "url(#" + id + ")", preserveAspectRatio: "xMidYMid slice" }, g);
      if (pn.label) pill(g, p[0], cy + r + 16, pn.label, { dashed: pn.dashed, solid: pn.solid });
    });
  }
  function pill(g, x, y, text, o) {
    var t = el("text", { x: x, y: y + 4.2, "text-anchor": "middle", "font-size": o.big ? 13 : 11.5, "font-weight": 700, fill: o.solid ? "#000" : "#fff", "letter-spacing": "-.02em" });
    t.textContent = text;
    g.appendChild(t);
    var w = t.getComputedTextLength() + (o.big ? 20 : 16), hgt = o.big ? 24 : 21;
    var r = el("rect", {
      x: x - w / 2, y: y - hgt / 2, width: w, height: hgt, rx: hgt / 2,
      fill: o.solid ? "#fff" : "rgba(19,19,19,.86)",
      stroke: o.solid ? "none" : "rgba(255,255,255," + (o.dashed ? ".55" : ".14") + ")",
      "stroke-width": o.dashed ? 1.2 : 1, "stroke-dasharray": o.dashed ? "3 3" : "none"
    });
    g.insertBefore(r, t);
  }
  function init() {
    document.querySelectorAll("svg.iso[data-map]").forEach(draw);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else window.addEventListener("load", init);
})();
