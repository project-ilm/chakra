/*!
 * chakra-card.js — the thing people actually share.  v0.1.0
 *
 * Renders a moment to an image. Not a screenshot: a drawn card, with the real
 * sky on it — grahas at their true longitudes around the zodiac ring, the Moon
 * at its true phase — plus the reading in a dozen calendars.
 *
 *   square  1080x1080  feeds
 *   story   1080x1920  vertical
 *   wide    1200x630   link previews
 *
 * On a phone it hands the PNG to the native share sheet, so the image itself
 * travels. Where that is unavailable it downloads, and says so rather than
 * silently doing nothing.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. All rights reserved. Sole author.
 * Affiliation: AyeAI.  SPDX-License-Identifier: GPL-3.0-or-later
 */
(function (root) {
  "use strict";

  var VERSION = "0.1.0";
  var SIZES = {
    square: { w: 1080, h: 1080 },
    story:  { w: 1080, h: 1920 },
    wide:   { w: 1200, h: 630 }
  };
  var INK = "#e7ebf7", GOLD = "#d4a843", GOLD2 = "#e6bd5c",
      SOFT = "#aeb8d8", FAINT = "#7b86ab", BG = "#0a0e27", BG2 = "#141a3a";
  var GLYPH = { Sun: "\u2609", Moon: "\u263D", Mercury: "\u263F", Venus: "\u2640",
                Mars: "\u2642", Jupiter: "\u2643", Saturn: "\u2644" };

  function ctxFont(ctx, size, weight, family) {
    ctx.font = (weight ? weight + " " : "") + size + "px " + (family || "Georgia, 'Times New Roman', serif");
  }

  /* wrap text to a width, returning the y after the last line */
  function wrap(ctx, text, x, y, maxW, lh, align) {
    var words = String(text).split(/\s+/), line = "", lines = [];
    words.forEach(function (w) {
      var t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    });
    if (line) lines.push(line);
    ctx.textAlign = align || "left";
    lines.forEach(function (l, i) { ctx.fillText(l, x, y + i * lh); });
    return y + lines.length * lh;
  }

  /* the zodiac ring with the grahas where they really were */
  function drawWheel(ctx, cx, cy, r, id) {
    var i, a;
    ctx.save();
    ctx.strokeStyle = "rgba(174,184,216,.30)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2); ctx.stroke();
    /* twelve houses */
    ctx.strokeStyle = "rgba(174,184,216,.18)"; ctx.lineWidth = 1;
    for (i = 0; i < 12; i++) {
      a = (i * 30 - 90) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
    }
    /* sign initials on the ring */
    ctxFont(ctx, Math.round(r * 0.075), "", "Georgia, serif");
    ctx.fillStyle = FAINT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (i = 0; i < 12; i++) {
      a = ((i * 30 + 15) - 90) * Math.PI / 180;
      ctx.fillText(String(i + 1), cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86);
    }
    /* the grahas */
    var G = id.sky.grahas, keys = Object.keys(G);
    ctxFont(ctx, Math.round(r * 0.13), "", "Georgia, serif");
    keys.forEach(function (b, k) {
      var lon = G[b].lon, ang = (lon - 90) * Math.PI / 180;
      var rr = r * (0.60 - (k % 3) * 0.075);
      var x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr;
      ctx.fillStyle = (b === "Sun") ? GOLD2 : (b === "Moon" ? "#cdd7f0" : SOFT);
      ctx.fillText(GLYPH[b] || b[0], x, y);
    });
    ctx.restore();
  }

  /* the Moon at its actual illumination.
     k = 1 - 2f runs +1 (new) -> 0 (half) -> -1 (full). The terminator is a
     half-ellipse of x-radius |k|r; its sweep flips at half phase. Drawing a
     full disc for anything over half — which an earlier version did — is simply
     wrong, and visible. */
  function drawMoon(ctx, cx, cy, r, illumPct, waxing) {
    var f = Math.max(0, Math.min(100, illumPct)) / 100, k = 1 - 2 * f;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#141a3a"; ctx.fill();
    ctx.strokeStyle = "rgba(205,215,240,.5)"; ctx.lineWidth = Math.max(1, r * 0.05); ctx.stroke();
    if (f > 0.005) {
      ctx.save();
      ctx.translate(cx, cy);
      if (!waxing) ctx.scale(-1, 1);            /* lit on the left when waning */
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);   /* lit limb */
      if (typeof ctx.ellipse === "function") {
        ctx.ellipse(0, 0, r * Math.abs(k), r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
      } else {                                   /* engines without ellipse() */
        ctx.save(); ctx.scale(Math.max(Math.abs(k), 0.001), 1);
        ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2, k > 0);
        ctx.restore();
      }
      ctx.closePath();
      ctx.fillStyle = "#dbe3f8"; ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function render(id, opts) {
    opts = opts || {};
    var size = SIZES[opts.size] || SIZES.square;
    var cv = opts.canvas || (root.document && root.document.createElement("canvas"));
    if (!cv) return null;
    cv.width = size.w; cv.height = size.h;
    var ctx = cv.getContext("2d");
    if (!ctx) return null;
    var W = size.w, H = size.h, wide = opts.size === "wide";

    /* ground */
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, BG); g.addColorStop(1, "#0d1330");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* a scatter of stars, deterministic so the same moment gives the same card */
    var seed = Math.abs(Math.floor(id.sky.jdn)) % 100000, rnd = function () {
      seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648;
    };
    for (var i = 0; i < Math.round(W * H / 9000); i++) {
      var sx = rnd() * W, sy = rnd() * H, sr = rnd() * 1.6 + 0.3;
      ctx.globalAlpha = 0.15 + rnd() * 0.5;
      ctx.fillStyle = "#dfe6fb";
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    var pad = Math.round(W * 0.075);
    ctx.textBaseline = "top";

    /* heading */
    ctxFont(ctx, Math.round(W * (wide ? 0.030 : 0.032)), "", "ui-monospace, monospace");
    ctx.fillStyle = GOLD; ctx.textAlign = "left";
    ctx.fillText("THE SKY ON", pad, pad);
    ctxFont(ctx, Math.round(W * (wide ? 0.070 : 0.078)), "bold");
    ctx.fillStyle = "#f4f6fc";
    ctx.fillText(id.date, pad, pad + Math.round(W * 0.045));

    /* wheel + moon.
       On square and story the wheel sits BESIDE the title, not under it: put it
       underneath and the calendar list — the reason this card travels — has no
       room left. That was a real defect, seen by rendering. */
    var titleBottom = pad + Math.round(W * 0.045) + Math.round(W * (wide ? 0.070 : 0.078)) * 1.15;
    var wheelR, wheelCx, wheelCy;
    if (wide)                     { wheelR = H * 0.30;  wheelCx = W * 0.78; wheelCy = H * 0.55; }
    else if (opts.size === "story"){ wheelR = W * 0.26;  wheelCx = W * 0.5;  wheelCy = titleBottom + wheelR + W * 0.03; }
    else                          { wheelR = W * 0.155; wheelCx = W - pad - wheelR; wheelCy = pad + wheelR * 1.05; }
    drawWheel(ctx, wheelCx, wheelCy, wheelR, id);
    var moonR = wheelR * 0.26;
    drawMoon(ctx, wheelCx, wheelCy, moonR, id.sky.moonPhase.illum, id.sky.moonPhase.waxing);

    /* headline */
    var y = wide ? pad + H * 0.20
                 : Math.max(titleBottom, wheelCy + wheelR) + Math.round(W * 0.045);
    ctxFont(ctx, Math.round(W * (wide ? 0.030 : 0.036)), "", "Georgia, serif");
    ctx.fillStyle = INK;
    var textW = wide ? W * 0.58 : W - 2 * pad;
    y = wrap(ctx, id.headline, pad, y, textW, Math.round(W * (wide ? 0.040 : 0.048)), "left");

    /* the calendars — the part that travels anywhere.
       Rows are budgeted against the space actually left above the footer, so
       the list can never run off the card. */
    y += Math.round(W * 0.02);
    ctxFont(ctx, Math.round(W * 0.024), "", "ui-monospace, monospace");
    ctx.fillStyle = GOLD;
    ctx.fillText("THE SAME DAY, ELSEWHERE", pad, y);
    y += Math.round(W * 0.038);
    /* Order for reach: the first rows a stranger sees should span continents,
       not cluster in one tradition. Anything not named here still follows. */
    var PRIORITY = ["Pa\u00f1c\u0101\u1e45ga", "Hijr\u012b", "Hebrew", "Chinese sexagenary",
                    "Maya Long Count", "Solar Hijr\u012b", "\u015aaka", "Tibetan",
                    "Vikrama Sa\u1e43vat", "N\u0101naksh\u0101h\u012b",
                    "Tropical sun sign", "Sidereal sun sign"];
    var picks = (id.calendars || []).filter(function (c) {
      return ["Gregorian", "Julian Day", "Precessional age"].indexOf(c.system) < 0;
    }).sort(function (a, b) {
      var ia = PRIORITY.indexOf(a.system), ib = PRIORITY.indexOf(b.system);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    var rowH = Math.round(W * 0.036);
    var footTop = H - pad * 1.5;
    var rareH = wide ? 0 : Math.round(W * 0.055);
    var fits = Math.max(0, Math.floor((footTop - rareH - y) / rowH));
    var maxRows = Math.min(fits, wide ? 6 : (opts.size === "story" ? 14 : 9));
    ctxFont(ctx, Math.round(W * 0.026), "", "Georgia, serif");
    picks.slice(0, maxRows).forEach(function (c) {
      ctx.fillStyle = FAINT; ctx.textAlign = "left";
      ctx.fillText(c.system, pad, y);
      ctx.fillStyle = INK; ctx.textAlign = "right";
      var r = c.reading.length > 34 ? c.reading.slice(0, 33) + "\u2026" : c.reading;
      ctx.fillText(r, wide ? W * 0.58 : W - pad, y);
      y += Math.round(W * 0.036);
    });

    if (picks.length > maxRows) {
      ctxFont(ctx, Math.round(W * 0.022), "italic", "Georgia, serif");
      ctx.fillStyle = FAINT; ctx.textAlign = "left";
      ctx.fillText("+ " + (picks.length - maxRows) + " more", pad, y - rowH * 0.15);
    }

    /* one honest rarity line */
    var rare = (id.rarity && id.rarity.items || []).filter(function (r) { return !r.approximate; }).pop();
    if (rare && !wide) {
      y += Math.round(W * 0.015);
      ctxFont(ctx, Math.round(W * 0.027), "italic");
      ctx.fillStyle = GOLD2; ctx.textAlign = "left";
      wrap(ctx, rare.what + " \u2014 " + rare.chance, pad, y, W - 2 * pad, Math.round(W * 0.036), "left");
    }

    /* footer */
    ctxFont(ctx, Math.round(W * 0.022), "", "ui-monospace, monospace");
    ctx.fillStyle = FAINT; ctx.textAlign = "left";
    ctx.fillText(opts.site || "project-ilm.github.io/chakra", pad, H - pad * 0.85);
    ctx.textAlign = "right";
    ctx.fillText("computed, never looked up", W - pad, H - pad * 0.85);

    return cv;
  }

  function toBlob(cv) {
    return new Promise(function (res, rej) {
      if (!cv) return rej(new Error("no canvas"));
      if (cv.toBlob) cv.toBlob(function (b) { b ? res(b) : rej(new Error("could not encode")); }, "image/png");
      else rej(new Error("toBlob unavailable"));
    });
  }

  /* Hand the IMAGE to the phone's share sheet — the whole point. */
  function share(id, opts) {
    opts = opts || {};
    var cv = render(id, opts);
    if (!cv) return Promise.resolve({ ok: false, reason: "no canvas in this environment" });
    var name = "sky-" + id.date + ".png";
    var text = id.headline + " \u2014 the sky on " + id.date + ".";
    var url = opts.url || (root.location && root.location.href) || "";
    return toBlob(cv).then(function (blob) {
      var file = (typeof root.File === "function") ? new root.File([blob], name, { type: "image/png" }) : null;
      var nav = root.navigator;
      if (file && nav && nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        return nav.share({ files: [file], text: text, title: "The sky on " + id.date })
          .then(function () { return { ok: true, how: "native-share-with-image" }; })
          .catch(function (e) {
            if (e && e.name === "AbortError") return { ok: false, how: "cancelled" };
            return download(blob, name).then(function (r) { r.note = "share sheet refused; downloaded instead"; return r; });
          });
      }
      return download(blob, name).then(function (r) {
        r.note = nav && nav.share ? "this browser cannot share files; downloaded instead"
                                  : "no share sheet here; downloaded instead";
        return r;
      });
    });
  }

  function download(blob, name) {
    return new Promise(function (res) {
      try {
        var u = root.URL.createObjectURL(blob);
        var a = root.document.createElement("a");
        a.href = u; a.download = name;
        root.document.body.appendChild(a); a.click(); a.remove();
        root.setTimeout(function () { root.URL.revokeObjectURL(u); }, 4000);
        res({ ok: true, how: "download" });
      } catch (e) { res({ ok: false, reason: String(e.message || e) }); }
    });
  }

  root.ChakraCard = {
    version: VERSION, SIZES: SIZES,
    render: render, toBlob: toBlob, share: share, download: download
  };
})(typeof self !== "undefined" ? self : this);
