/**
 * input.js — Teclado + touch (virtual pad)
 * justPressed se limpia cada frame con endFrame().
 */
window.TRANSAS_Input = (() => {
  const down = Object.create(null);
  const pressed = Object.create(null);

  const isTouch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  function codeOf(e) {
    return e.code === 'Space' ? ' ' : e.key.toLowerCase();
  }

  function setKey(k, isDown) {
    if (isDown) {
      if (!down[k]) pressed[k] = true;
      down[k] = true;
    } else {
      down[k] = false;
    }
  }

  function onKeyDown(e) {
    const k = codeOf(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd'].includes(k)) {
      e.preventDefault();
    }
    setKey(k, true);
  }

  function onKeyUp(e) {
    setKey(codeOf(e), false);
  }

  function isDown(k) {
    return !!down[k];
  }

  function just(k) {
    return !!pressed[k];
  }

  function endFrame() {
    for (const k in pressed) delete pressed[k];
  }

  /**
   * Bind teclado + botones virtuales (data-key).
   * @param {ParentNode} [root=document]
   */
  function bind(root) {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const scope = root || document;
    const buttons = scope.querySelectorAll('[data-key]');

    buttons.forEach((btn) => {
      const key = btn.getAttribute('data-key');
      if (!key) return;

      const press = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setKey(key, true);
        btn.classList.add('active');
      };
      const release = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        setKey(key, false);
        btn.classList.remove('active');
      };

      // Pointer Events cubren mouse + touch + pen
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', release);
      btn.addEventListener('pointercancel', release);
      // Evita menú contextual / selección en mobile
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });

    // Evitar scroll/zoom con gestos en el juego
    document.addEventListener(
      'touchmove',
      (e) => {
        if (e.target.closest('#frame, #touchPad')) e.preventDefault();
      },
      { passive: false }
    );
  }

  return { bind, isDown, just, endFrame, down, setKey, isTouch };
})();
