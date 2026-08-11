/*!
 * chakra-music.js — Music of the Stars.  v0.1.0
 *
 * Turns the REAL ephemeris into sound. Every pitch here is derived from a
 * longitude the core computed; nothing is invented and nothing is sampled.
 *
 *   raw        continuous frequency — the sky as it is, microtonal, gliding
 *   modulated  the same motion quantised to a scale (config, not hardcoded)
 *
 * Play any single graha, the Σ (sigma) composite of a selection, or any
 * combination of the two.
 *
 * HONESTY (contract C37): the mapping from sky to sound is a CHOSEN CONVENTION,
 * declared in CONVENTION below. It is not a discovered harmony and it predicts
 * nothing. Different conventions give different music from the same sky; ours is
 * stated so anyone can disagree with it precisely.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. All rights reserved. Sole author.
 * Affiliation: AyeAI.  SPDX-License-Identifier: GPL-3.0-or-later
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    var tried = ["./chakra-core.js", "../src/chakra-core.js", "../js/chakra-core.js",
                 "../test/chakra-core.js", "../chakra-core.js"], core = null, i;
    for (i = 0; i < tried.length; i++) { try { core = require(tried[i]); break; } catch (e) {} }
    if (!core) throw new Error("chakra-music: chakra-core.js not found. Tried: " + tried.join(", "));
    module.exports = factory(core);
  } else root.ChakraMusic = factory(root.Chakra);
})(typeof self !== "undefined" ? self : this, function (C) {
  "use strict";

  var VERSION = "0.1.0";

  var CONVENTION = {
    pitch: "Sidereal longitude maps one full zodiac cycle (360°) to one octave. " +
           "A graha's base octave comes from its orbital period: slower body, lower register.",
    rhythm: "One note per sample step. Step size is the user's; the melody's pace is the sky's.",
    dynamics: "Loudness follows |apparent speed|. A retrograde graha is voiced quieter and " +
              "its motion descends, because that is what it is doing.",
    sigma: "Σ is additive: the selected bodies' waveforms are summed and normalised. It is a " +
           "composite of what is there, not an average that hides it.",
    caveat: "A chosen convention, not a discovered harmony. It predicts nothing."
  };

  /* Base octave per body — slower orbit, lower voice. Declared, not fitted. */
  var VOICE = {
    Moon:    { oct: 5, wave: "sine",     period: 0.0748 },
    Mercury: { oct: 5, wave: "triangle", period: 0.2408 },
    Venus:   { oct: 4, wave: "sine",     period: 0.6152 },
    Sun:     { oct: 4, wave: "sawtooth", period: 1.0 },
    Mars:    { oct: 3, wave: "square",   period: 1.8808 },
    Jupiter: { oct: 3, wave: "triangle", period: 11.862 },
    Saturn:  { oct: 2, wave: "sine",     period: 29.457 },
    Rahu:    { oct: 2, wave: "sawtooth", period: 18.6 },
    Ketu:    { oct: 2, wave: "sawtooth", period: 18.6 }
  };
  var BODIES = Object.keys(VOICE);

  /* Scales are DATA. Add any set of semitone offsets; nothing here is fixed. */
  var SCALES = {
    chromatic:   [0,1,2,3,4,5,6,7,8,9,10,11],
    major:       [0,2,4,5,7,9,11],
    minor:       [0,2,3,5,7,8,10],
    bhairav:     [0,1,4,5,7,8,11],
    yaman:       [0,2,4,6,7,9,11],
    bhupali:     [0,2,4,7,9],
    malkauns:    [0,3,5,8,10],
    todi:        [0,1,3,6,7,8,11],
    pentatonic:  [0,2,4,7,9]
  };

  var A4 = 440;
  function midiToFreq(m) { return A4 * Math.pow(2, (m - 69) / 12); }

  function yearOf(d) { var g = C.jdn2greg(Math.floor(C.jdOf(d) + 0.5)); return g.Y + (g.M - 0.5) / 12; }
  function sid(lon, d) { return C.rev(lon - C.ayan(yearOf(d))); }

  /* ---------------------------------------------------------------- sampling
   * Sample the real sky. Returns, per body, the sidereal longitude and the
   * apparent speed (deg/day) at each step — the raw material for everything. */
  function sample(opts) {
    opts = opts || {};
    var from = opts.fromDayNo, steps = Math.max(2, opts.steps || 64),
        span = opts.spanDays == null ? 30 : opts.spanDays,
        sel = opts.bodies && opts.bodies.length ? opts.bodies : ["Sun", "Moon"];
    if (from == null) throw new Error("chakra-music.sample: fromDayNo is required");
    var dt = span / (steps - 1), out = { steps: steps, spanDays: span, dt: dt, bodies: {} };
    sel.forEach(function (b) {
      if (!VOICE[b]) throw new Error("chakra-music: unknown body " + b + ". Known: " + BODIES.join(","));
      out.bodies[b] = { name: b, lon: [], speed: [], retro: [] };
    });
    for (var i = 0; i < steps; i++) {
      var d = from + i * dt, g = C.grahas(d), gp = C.grahas(d + 0.25), gm = C.grahas(d - 0.25);
      sel.forEach(function (b) {
        var L = sid(g[b], d);
        var dv = C.rev(gp[b] - gm[b]); if (dv > 180) dv -= 360;
        var sp = dv / 0.5;                                  /* deg per day */
        var rec = out.bodies[b];
        rec.lon.push(L); rec.speed.push(sp); rec.retro.push(sp < 0);
      });
    }
    return out;
  }

  /* ------------------------------------------------------------------ melody
   * mode "raw"       : continuous frequency, microtonal, exactly the longitude
   * mode "modulated" : the same motion snapped to the configured scale
   * Returns note events; the player is a separate, thin layer. */
  function melody(opts) {
    opts = opts || {};
    var s = opts.sampled || sample(opts);
    var mode = opts.mode === "modulated" ? "modulated" : "raw";
    var scaleName = opts.scale || "chromatic";
    var scale = SCALES[scaleName];
    if (!scale) throw new Error("chakra-music: unknown scale " + scaleName + ". Known: " + Object.keys(SCALES).join(","));
    var rootMidi = opts.rootMidi == null ? 60 : opts.rootMidi;   /* C4 */
    var noteSec = opts.noteSeconds == null ? 0.22 : opts.noteSeconds;
    var tracks = {}, names = Object.keys(s.bodies);

    names.forEach(function (b) {
      var rec = s.bodies[b], v = VOICE[b], notes = [];
      var maxSp = 0;
      rec.speed.forEach(function (x) { maxSp = Math.max(maxSp, Math.abs(x)); });
      if (maxSp === 0) maxSp = 1;
      for (var i = 0; i < rec.lon.length; i++) {
        var frac = rec.lon[i] / 360;                       /* 0..1 of the cycle */
        var semis = frac * 12;                             /* one octave per cycle */
        var midi;
        if (mode === "modulated") {
          /* snap to the nearest degree of the scale, then place in the voice's octave */
          var best = scale[0], bd = 99;
          for (var k = 0; k < scale.length; k++) {
            var dd = Math.abs(scale[k] - semis);
            dd = Math.min(dd, 12 - dd);
            if (dd < bd) { bd = dd; best = scale[k]; }
          }
          midi = rootMidi + best + 12 * (v.oct - 4);
        } else {
          midi = rootMidi + semis + 12 * (v.oct - 4);      /* fractional -> microtonal */
        }
        var amp = 0.18 + 0.62 * (Math.abs(rec.speed[i]) / maxSp);
        if (rec.retro[i]) amp *= 0.55;                     /* retrograde voiced quieter */
        notes.push({
          t: +(i * noteSec).toFixed(4),
          dur: noteSec,
          midi: +midi.toFixed(4),
          freq: +midiToFreq(midi).toFixed(4),
          amp: +amp.toFixed(4),
          retro: rec.retro[i],
          lon: +rec.lon[i].toFixed(3),
          body: b, wave: v.wave
        });
      }
      tracks[b] = notes;
    });

    var out = {
      version: VERSION, mode: mode, scale: mode === "modulated" ? scaleName : "(continuous)",
      bodies: names, noteSeconds: noteSec, durationSeconds: +(s.steps * noteSec).toFixed(3),
      tracks: tracks, convention: CONVENTION
    };
    if (opts.sigma) out.sigma = sigma(out, opts);
    return out;
  }

  /* -------------------------------------------------------------------- Σ
   * Additive composite of the selected tracks: at each step, sum the voices.
   * Reported as its own track so it can be played alone or against the parts. */
  function sigma(mel, opts) {
    opts = opts || {};
    var use = (opts.sigmaBodies && opts.sigmaBodies.length) ? opts.sigmaBodies : mel.bodies;
    use = use.filter(function (b) { return mel.tracks[b]; });
    if (!use.length) return { notes: [], bodies: [], note: "no bodies selected for Σ" };
    var n = mel.tracks[use[0]].length, notes = [];
    for (var i = 0; i < n; i++) {
      var fs = 0, as = 0, anyRetro = false, t = mel.tracks[use[0]][i].t;
      for (var k = 0; k < use.length; k++) {
        var nt = mel.tracks[use[k]][i]; if (!nt) continue;
        fs += nt.freq * nt.amp; as += nt.amp; if (nt.retro) anyRetro = true;
      }
      var f = as > 0 ? fs / as : 0;                        /* amplitude-weighted centroid */
      notes.push({
        t: t, dur: mel.noteSeconds, freq: +f.toFixed(4),
        amp: +Math.min(1, as / use.length).toFixed(4),
        partials: use.length, retro: anyRetro, body: "\u03a3", wave: "sine"
      });
    }
    return {
      notes: notes, bodies: use.slice(),
      note: "\u03a3 is the amplitude-weighted composite of " + use.join(" + ") +
            " — a sum of what is there, not an average that hides it."
    };
  }

  /* ------------------------------------------------------------------ export
   * A melody is data. It can be played, or written out and taken elsewhere. */
  function toCSV(mel) {
    var rows = ["body,t,dur,freq,midi,amp,retro,lon"];
    Object.keys(mel.tracks).forEach(function (b) {
      mel.tracks[b].forEach(function (n) {
        rows.push([b, n.t, n.dur, n.freq, n.midi, n.amp, n.retro ? 1 : 0, n.lon].join(","));
      });
    });
    if (mel.sigma) mel.sigma.notes.forEach(function (n) {
      rows.push(["sigma", n.t, n.dur, n.freq, "", n.amp, n.retro ? 1 : 0, ""].join(","));
    });
    return rows.join("\n");
  }

  /* ------------------------------------------------------------------ player
   * Thin Web Audio layer. Absent in node — and SAID to be absent, never faked. */
  function play(mel, opts) {
    opts = opts || {};
    var AC = (typeof window !== "undefined") && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return { ok: false, reason: "Web Audio is not available in this environment" };
    var ctx = opts.context || new AC();
    var master = ctx.createGain();
    master.gain.value = opts.volume == null ? 0.22 : opts.volume;
    master.connect(ctx.destination);
    var t0 = ctx.currentTime + 0.06, voices = 0;
    var lists = [];
    if (opts.only === "sigma") { if (mel.sigma) lists.push(mel.sigma.notes); }
    else {
      var want = opts.bodies && opts.bodies.length ? opts.bodies : mel.bodies;
      want.forEach(function (b) { if (mel.tracks[b]) lists.push(mel.tracks[b]); });
      if (opts.withSigma && mel.sigma) lists.push(mel.sigma.notes);
    }
    lists.forEach(function (notes) {
      notes.forEach(function (n) {
        if (!(n.freq > 0)) return;
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = n.wave || "sine";
        if (opts.glide && n.freq > 0) {
          o.frequency.setValueAtTime(n.freq, t0 + n.t);
        } else o.frequency.value = n.freq;
        g.gain.setValueAtTime(0, t0 + n.t);
        g.gain.linearRampToValueAtTime(n.amp, t0 + n.t + 0.02);
        g.gain.linearRampToValueAtTime(0.0001, t0 + n.t + n.dur);
        o.connect(g); g.connect(master);
        o.start(t0 + n.t); o.stop(t0 + n.t + n.dur + 0.02);
        voices++;
      });
    });
    return { ok: true, context: ctx, voices: voices, seconds: mel.durationSeconds };
  }

  return {
    version: VERSION, CONVENTION: CONVENTION, SCALES: SCALES, VOICE: VOICE, BODIES: BODIES,
    sample: sample, melody: melody, sigma: sigma, toCSV: toCSV, play: play,
    midiToFreq: midiToFreq
  };
});
