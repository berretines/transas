/**
 * systems.js — Shop, inventario, timer, transiciones, amigo, strobe
 * Orquesta la lógica de alto nivel; no dibuja ni lee teclas directo.
 */
window.TRANSAS_Systems = (() => {
  const C = () => window.TRANSAS_CONFIG;
  const Audio = () => window.TRANSAS_Audio;

  function fmtMs(ms) {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  function remainingMs(state) {
    if (!state.flags.messaged) return C().WAIT_MS;
    return Math.max(0, state.messageAt + C().WAIT_MS - Date.now());
  }

  function createFriend() {
    const cfg = C();
    return {
      x: 2000,
      y: cfg.FLOOR_Y - cfg.PLAYER_H,
      w: cfg.PLAYER_W,
      h: cfg.PLAYER_H,
      visible: false,
      walking: false,
      facing: -1, // llega desde la derecha mirando a la izquierda
      // animación de caminata
      frame: 0,
      frameT: 0,
      bob: 0,
      speed: 95, // px/s un poco más vivo
    };
  }

  // ── Dialog ────────────────────────────────────────────────────
  function say(state, who, text) {
    state.dialog = { who, text };
    Audio().interact();
  }

  function closeDialog(state) {
    state.dialog = null;
  }

  // ── Money / pickups ───────────────────────────────────────────
  function addMoney(state, n) {
    state.money += n;
  }

  function onCash(state, obj) {
    if (state.picked[obj.id]) return;
    state.picked[obj.id] = true;
    addMoney(state, obj.amount);
    Audio().money();
    say(state, 'VOS', `Encontré un billete de $${obj.amount}. Bien ahí.`);
  }

  // ── Inventory use ─────────────────────────────────────────────
  function useItem(state, player, PlayerAPI, id) {
    if (state.mode !== 'play' || state.shopOpen || state.dialog) return false;
    if (!state.inv[id] || state.inv[id] <= 0) {
      Audio().deny();
      return false;
    }
    state.inv[id] -= 1;
    Audio().use();

    const map = {
      redpoint: { type: 'smoke', dur: 2.8, msg: 'Fumo un Red Point. El humo me llena la resaca.' },
      chicles:  { type: 'chew',  dur: 2.2, msg: 'Masto un chicle. Menta barata, pero algo es algo.' },
      birra:    { type: 'beer',  dur: 2.6, msg: 'Me bajo la birra. Amarga y perfecta.' },
      pepsi:    { type: 'pepsi', dur: 2.4, msg: "La pepsi pa' la boca, para el napo falopa... digo, la coca." },
    };
    const a = map[id];
    if (!a) return false;
    PlayerAPI.startAction(player, a.type, a.dur);
    say(state, 'VOS', a.msg);
    return true;
  }

  function startPeeing(state, player, PlayerAPI, toilet) {
    if (toilet) {
      player.x = toilet.x + 20;
      player.y = C().FLOOR_Y - player.h;
      player.facing = 1;
    }
    PlayerAPI.startAction(player, 'pee', 2.8);
    state.flags.peed = true;
    say(state, 'VOS', 'Ahhhh… qué lindo mear.');
    Audio().use();
  }

  // ── Shop ──────────────────────────────────────────────────────
  function buyItem(state, id) {
    const item = C().SHOP.find((x) => x.id === id);
    if (!item) return false;
    if (state.money < item.price) {
      Audio().deny();
      return false;
    }
    state.money -= item.price;
    // pack: atado de 20 cigarrillos, paquete de 5 chicles, etc.
    const qty = item.pack || 1;
    state.inv[id] = (state.inv[id] || 0) + qty;
    Audio().buy();
    return true;
  }

  // Texto canónico del gag de la Z (nunca explicar el chiste en el juego)
  const Z_HINT = 'Apretå Z para esperar råpido';

  // ── Message / Z ───────────────────────────────────────────────
  function tryMessage(state) {
    if (state.mode !== 'play' || state.transitioning || state.shopOpen) return;
    if (!state.flags.phone) {
      say(state, 'VOS', 'No tengo el fono. Debe estar en algún lado...');
      return;
    }
    if (state.flags.messaged) {
      const left = remainingMs(state);
      say(
        state,
        'VOS',
        left > 0
          ? `Ya le mandé mensaje. Faltan ${fmtMs(left)}.\n${Z_HINT}`
          : 'Ya le mandé. Debería estar por llegar.'
      );
      return;
    }
    state.flags.messaged = true;
    state.messageAt = Date.now();
    say(
      state,
      'VOS',
      `¿Tenés para acercarme unito? ¿En 3 minutos? Joyaaa, te espero en la esquina.\n\n${Z_HINT}`
    );
  }

  /**
   * Z: un flash corto cada vez que se aprieta.
   * Solo tiene sentido después de mandar mensaje (y antes de que llegue).
   * El timer real no se toca. El jugador no lo sabe.
   */
  function pressZ(state) {
    if (state.mode !== 'play' || state.shopOpen) return;
    if (!state.flags.messaged || state.friendArrived) return;
    // un solo flash breve por toque (no strobe largo)
    state.strobe = 0.12;
    Audio().strobe();
  }

  // ── Scene transition ──────────────────────────────────────────
  function beginSceneChange(state, targetId, msg, sub, onMid, onDone) {
    if (state.transitioning || state.mode !== 'play' || state.shopOpen) return;
    if (targetId === state.sceneId) return;

    state.transitioning = true;
    state.mode = 'sceneLoad';
    closeDialog(state);
    Audio().scene();

    const duration = 950 + Math.random() * 350;
    setTimeout(() => {
      onMid(targetId);
      setTimeout(() => {
        state.transitioning = false;
        state.mode = 'play';
        onDone(targetId);
      }, 300);
    }, duration);

    return { msg, sub };
  }

  // ── Friend / timer ────────────────────────────────────────────
  function updateTimerAndFriend(state, friend, dt) {
    if (!state.flags.messaged || state.friendArrived) return;

    const left = remainingMs(state);
    if (left <= 0 && !friend.walking && !friend.visible) {
      friend.visible = true;
      friend.walking = true;
      friend.facing = -1;
      friend.frame = 0;
      friend.frameT = 0;
      friend.x = C().WORLD_W + 80;
      friend.y = C().FLOOR_Y - friend.h;
    }
  }

  /**
   * Caminata animada del transa (cycle de 4 frames: w1, w3, w2, w3).
   */
  function updateFriendWalk(state, friend, dt, onArriveStreet, onArriveElsewhere) {
    // idle suave cuando ya llegó (bob leve del bolso)
    if (friend.visible && !friend.walking) {
      friend.bob = Math.sin(state.time * 3) * 2;
      return;
    }
    if (!friend.walking) return;

    const speed = friend.speed || 95;
    friend.x -= speed * dt;
    friend.facing = -1;

    // ciclo de caminata
    friend.frameT += dt;
    const step = 0.14;
    if (friend.frameT >= step) {
      friend.frameT = 0;
      friend.frame = (friend.frame + 1) % 4;
    }
    // bob vertical sutil al caminar
    friend.bob = Math.abs(Math.sin(state.time * 12)) * 3;

    const meetX = 1100; // esquina / cebra frente al Gevi
    if (friend.x <= meetX) {
      friend.x = meetX;
      friend.walking = false;
      friend.frame = 0;
      friend.bob = 0;
      state.friendArrived = true;
      if (state.winQueued) return;
      if (state.sceneId === 'street' && state.mode === 'play') {
        state.winQueued = true;
        onArriveStreet();
      } else if (state.mode === 'play') {
        onArriveElsewhere();
      }
    }
  }

  // ── Camera ────────────────────────────────────────────────────
  function updateCamera(state, player) {
    const { VIEW_W, WORLD_W } = C();
    const target = player.x + player.w / 2 - VIEW_W / 2;
    state.camX += (target - state.camX) * 0.12;
    state.camX = Math.max(0, Math.min(WORLD_W - VIEW_W, state.camX));
  }

  return {
    fmtMs,
    remainingMs,
    createFriend,
    say,
    closeDialog,
    addMoney,
    onCash,
    useItem,
    startPeeing,
    buyItem,
    tryMessage,
    pressZ,
    beginSceneChange,
    updateTimerAndFriend,
    updateFriendWalk,
    updateCamera,
  };
})();
