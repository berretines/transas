/**
 * audio.js — Beeps + FX (chorro de pis) + toggle
 */
window.TRANSAS_Audio = (() => {
  let enabled = true;
  let ctx = null;
  let peeNodes = null;

  function ensure() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function beep(freq, dur, type, vol) {
    if (!enabled) return;
    try {
      ensure();
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol ?? 0.04, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur);
    } catch (_) { /* ignore */ }
  }

  function makeNoiseBuffer(seconds) {
    const ac = ensure();
    const len = Math.floor(ac.sampleRate * seconds);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  /** Ruido de chorro de pis (bandpass + fade). */
  function pee(durationSec) {
    if (!enabled) return;
    try {
      stopPee();
      const ac = ensure();
      const dur = Math.max(0.5, durationSec || 3);
      const t0 = ac.currentTime;

      const src = ac.createBufferSource();
      src.buffer = makeNoiseBuffer(dur + 0.3);

      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(900, t0);
      bp.frequency.linearRampToValueAtTime(1400, t0 + 0.15);
      bp.frequency.linearRampToValueAtTime(700, t0 + dur * 0.85);
      bp.Q.value = 0.7;

      const hp = ac.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 280;

      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.045, t0 + 0.12);
      g.gain.setValueAtTime(0.04, t0 + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      const splash = ac.createBufferSource();
      splash.buffer = makeNoiseBuffer(0.35);
      const spFilter = ac.createBiquadFilter();
      spFilter.type = 'highpass';
      spFilter.frequency.value = 1200;
      const spG = ac.createGain();
      spG.gain.setValueAtTime(0.0001, t0);
      spG.gain.setValueAtTime(0.0001, t0 + dur * 0.75);
      spG.gain.exponentialRampToValueAtTime(0.03, t0 + dur * 0.82);
      spG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.15);

      src.connect(hp);
      hp.connect(bp);
      bp.connect(g);
      g.connect(ac.destination);

      splash.connect(spFilter);
      spFilter.connect(spG);
      spG.connect(ac.destination);

      src.start(t0);
      src.stop(t0 + dur + 0.05);
      splash.start(t0 + dur * 0.75);
      splash.stop(t0 + dur + 0.2);

      peeNodes = {
        stop() {
          try {
            const now = ac.currentTime;
            g.gain.cancelScheduledValues(now);
            g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
            spG.gain.cancelScheduledValues(now);
            spG.gain.setValueAtTime(Math.max(spG.gain.value, 0.0001), now);
            spG.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
            src.stop(now + 0.1);
            splash.stop(now + 0.1);
          } catch (_) { /* already stopped */ }
          peeNodes = null;
        },
      };
    } catch (_) { /* ignore */ }
  }

  function stopPee() {
    if (peeNodes) {
      peeNodes.stop();
      peeNodes = null;
    }
  }

  return {
    get enabled() { return enabled; },
    set enabled(v) {
      enabled = !!v;
      if (!enabled) stopPee();
    },
    toggle() {
      enabled = !enabled;
      if (!enabled) stopPee();
      else ensure();
      return enabled;
    },
    jump() { beep(280, 0.08); beep(380, 0.06, 'square', 0.02); },
    interact() { beep(520, 0.07, 'triangle', 0.04); },
    buy() { beep(440, 0.06); beep(660, 0.1); },
    use() { beep(300, 0.05, 'sawtooth', 0.025); beep(200, 0.12, 'triangle', 0.03); },
    money() { beep(700, 0.05); beep(900, 0.08); },
    deny() { beep(120, 0.15, 'sawtooth', 0.03); },
    scene() { beep(200, 0.1, 'sine', 0.03); },
    strobe() { beep(90, 0.04, 'square', 0.02); beep(1400, 0.03, 'square', 0.015); },
    pee,
    stopPee,
  };
})();
