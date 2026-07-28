/**
 * audio.js — Beeps procedurales + toggle
 */
window.TRANSAS_Audio = (() => {
  let enabled = true;
  let ctx = null;

  function ensure() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
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

  return {
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; },
    toggle() {
      enabled = !enabled;
      if (enabled) ensure();
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
  };
})();
