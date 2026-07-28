/**
 * ui.js — DOM: HUD, dialog, shop, overlays
 */
window.TRANSAS_UI = (() => {
  const $ = (id) => document.getElementById(id);
  const C = () => window.TRANSAS_CONFIG;
  const Sys = () => window.TRANSAS_Systems;

  const isTouch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  function els() {
    return {
      loadUI: $('loadUI'),
      loadTxt: $('loadTxt'),
      sceneLoad: $('sceneLoad'),
      sceneLoadMsg: $('sceneLoadMsg'),
      sceneLoadSub: $('sceneLoadSub'),
      titleUI: $('titleUI'),
      endUI: $('endUI'),
      shopUI: $('shopUI'),
      shopList: $('shopList'),
      shopBal: $('shopBal'),
      hud: $('hud'),
      moneyTxt: $('moneyTxt'),
      locBadge: $('locBadge'),
      invHint: $('invHint'),
      invBar: $('invBar'),
      soundBtn: $('soundBtn'),
      timerPanel: $('timerPanel'),
      timerClock: $('timerClock'),
      timerFill: $('timerFill'),
      dialog: $('dialog'),
      dialogWho: $('dialogWho'),
      dialogTxt: $('dialogTxt'),
      dialogSkip: $('dialogSkip'),
      prompt: $('prompt'),
      btnStart: $('btnStart'),
      btnRestart: $('btnRestart'),
      btnCloseShop: $('btnCloseShop'),
      touchPad: $('touchPad'),
    };
  }

  function setTouchMode(on) {
    document.body.classList.toggle('is-touch', !!on);
  }

  function showTouchPad(on) {
    const pad = els().touchPad;
    if (!pad) return;
    show(pad, !!on && isTouch);
    pad.setAttribute('aria-hidden', on && isTouch ? 'false' : 'true');
  }

  function show(el, on) {
    el.classList.toggle('visible', !!on);
  }

  function setLoadProgress(n, total) {
    const e = els();
    e.loadTxt.textContent = `Cargando ${n}/${total}…`;
  }

  function showTitle() {
    const e = els();
    show(e.loadUI, false);
    show(e.titleUI, true);
    show(e.endUI, false);
    show(e.hud, false);
    show(e.invBar, false);
    show(e.soundBtn, false);
    show(e.timerPanel, false);
    showTouchPad(false);
  }

  function showPlayHud(state, sceneName) {
    const e = els();
    show(e.titleUI, false);
    show(e.endUI, false);
    show(e.loadUI, false);
    show(e.sceneLoad, false);
    show(e.hud, true);
    show(e.invBar, true);
    show(e.soundBtn, true);
    showTouchPad(true);
    updateHud(state, sceneName);
  }

  function showEnd() {
    const e = els();
    show(e.endUI, true);
    show(e.hud, false);
    show(e.invBar, false);
    show(e.timerPanel, false);
    show(e.prompt, false);
    showTouchPad(false);
    closeDialog();
    closeShop();
  }

  function showSceneLoad(msg, sub) {
    const e = els();
    e.sceneLoadMsg.textContent = msg || 'Cargando…';
    e.sceneLoadSub.textContent = sub || '';
    show(e.sceneLoad, true);
    show(e.prompt, false);
    showTouchPad(false);
  }

  function hideSceneLoad() {
    show(els().sceneLoad, false);
    showTouchPad(true);
  }

  function updateHud(state, sceneName) {
    const e = els();
    e.moneyTxt.textContent = `$${state.money}`;
    e.locBadge.textContent = sceneName;
    if (isTouch) {
      e.invHint.textContent = state.inv.phone
        ? state.flags.messaged
          ? '📱 mensaje ok'
          : '📱 usá 📞'
        : 'Sin celu';
    } else {
      e.invHint.textContent = state.inv.phone
        ? state.flags.messaged
          ? '📱 CELU · mensaje ok'
          : '📱 CELU · [C] mensaje'
        : 'Sin celu';
    }
    renderInv(state);
    updateTimer(state);
  }

  function renderInv(state) {
    const e = els();
    const slots = C().SHOP;
    e.invBar.innerHTML = '';
    for (const s of slots) {
      const qty = state.inv[s.id] || 0;
      const div = document.createElement('div');
      div.className = 'inv-slot' + (qty > 0 ? ' has' : '');
      div.innerHTML = `
        <span class="key">${s.key}</span>
        <img src="assets/${s.icon}.png" alt="" draggable="false" />
        <span class="qty">${qty > 0 ? '×' + qty : ''}</span>`;
      if (qty > 0) {
        div.dataset.item = s.id;
      }
      e.invBar.appendChild(div);
    }
  }

  function updateTimer(state) {
    const e = els();
    if (!state.flags.messaged || state.friendArrived) {
      show(e.timerPanel, false);
      return;
    }
    show(e.timerPanel, true);
    const left = Sys().remainingMs(state);
    e.timerClock.textContent = Sys().fmtMs(left);
    e.timerFill.style.width = ((1 - left / C().WAIT_MS) * 100).toFixed(2) + '%';
  }

  function openDialog(who, text) {
    const e = els();
    e.dialogWho.textContent = who;
    e.dialogTxt.textContent = text;
    if (e.dialogSkip) {
      e.dialogSkip.textContent = isTouch ? 'TOCÁ PARA SEGUIR' : 'ENTER / CLICK';
    }
    show(e.dialog, true);
  }

  function closeDialog() {
    show(els().dialog, false);
  }

  function openShop(state, onBuy) {
    const e = els();
    e.shopBal.textContent = `$${state.money}`;
    e.shopList.innerHTML = '';
    for (const item of C().SHOP) {
      const row = document.createElement('div');
      row.className = 'shop-row';
      const can = state.money >= item.price;
      row.innerHTML = `
        <img src="assets/${item.icon}.png" alt="" />
        <div class="info">
          <div class="name">${item.name}${item.pack > 1 ? ' ×' + item.pack : ''}</div>
          <div class="price">$${item.price}</div>
        </div>
        <button ${can ? '' : 'disabled'} data-id="${item.id}">COMPRAR</button>`;
      row.querySelector('button').addEventListener('click', () => onBuy(item.id));
      e.shopList.appendChild(row);
    }
    show(e.shopUI, true);
  }

  function closeShop() {
    show(els().shopUI, false);
  }

  function setSoundIcon(on) {
    const btn = els().soundBtn;
    btn.textContent = on ? '🔊' : '🔇';
    btn.classList.toggle('off', !on);
  }

  function fitCanvas(canvas) {
    const cfg = C();
    // En mobile usamos casi toda la pantalla; en desktop cap 1.5×
    const pad = isTouch ? 4 : 20;
    const maxScale = isTouch ? 3 : 1.5;
    const s = Math.min(
      (window.innerWidth - pad) / cfg.VIEW_W,
      (window.innerHeight - pad) / cfg.VIEW_H,
      maxScale
    );
    canvas.style.width = Math.floor(cfg.VIEW_W * s) + 'px';
    canvas.style.height = Math.floor(cfg.VIEW_H * s) + 'px';
  }

  function formatPrompt(text) {
    if (!text || !isTouch) return text;
    // Traducir hints de teclado a botones táctiles
    return text
      .replace(/^\[E\]/, '[E] Tocá')
      .replace(/^\[C\]/, '[📞] Tocá');
  }

  function setPrompt(text) {
    const e = els();
    if (text) {
      e.prompt.textContent = formatPrompt(text);
      show(e.prompt, true);
    } else {
      show(e.prompt, false);
    }
  }

  return {
    els,
    isTouch,
    setTouchMode,
    showTouchPad,
    setLoadProgress,
    showTitle,
    showPlayHud,
    showEnd,
    showSceneLoad,
    hideSceneLoad,
    updateHud,
    updateTimer,
    openDialog,
    closeDialog,
    setPrompt,
    openShop,
    closeShop,
    setSoundIcon,
    fitCanvas,
  };
})();
