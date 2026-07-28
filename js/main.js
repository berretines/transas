/**
 * main.js — Orquestador del juego TRANSAS
 *
 * Flujo:
 *  1. Cargar assets
 *  2. Title screen
 *  3. Loop: input → update → render → UI
 *
 * Módulos (orden de carga en index.html):
 *  config → assets → input → audio → state → scenes → player → systems → render → ui → main
 */
(() => {
  'use strict';

  const C = window.TRANSAS_CONFIG;
  const Assets = window.TRANSAS_Assets;
  const Input = window.TRANSAS_Input;
  const Audio = window.TRANSAS_Audio;
  const StateAPI = window.TRANSAS_State;
  const ScenesAPI = window.TRANSAS_Scenes;
  const PlayerAPI = window.TRANSAS_Player;
  const Sys = window.TRANSAS_Systems;
  const Render = window.TRANSAS_Render;
  const UI = window.TRANSAS_UI;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = C.VIEW_W;
  canvas.height = C.VIEW_H;

  let state = StateAPI.get();
  let player = PlayerAPI.create();
  let friend = Sys.createFriend();
  let scenes = null; // se construye con handlers

  // ── Handlers de interacción (inyectados a scenes) ─────────────
  function buildHandlers() {
    return {
      say(who, text) {
        Sys.say(state, who, text);
        UI.openDialog(who, text);
      },
      onBed() {
        if (!state.flags.woke) {
          state.flags.woke = true;
          this.say('VOS', 'Ufff… qué resaca. Estoy al pedo total.');
        } else {
          this.say('VOS', 'Si me acuesto de nuevo no me levanto más.');
        }
      },
      onClothes() {
        if (!state.flags.phone) {
          state.flags.phone = true;
          state.inv.phone = true;
          Audio.money();
          UI.updateHud(state, currentScene().name);
          this.say('VOS', 'El celu. Estaba debajo del calzoncillo de ayer. Qué asco.');
        } else {
          this.say('VOS', 'Ya saqué el celu. El resto es mugre.');
        }
      },
      onFridge() {
        state.flags.fridge = true;
        this.say('VOS', 'Vacía. Solo un limón seco y una birra vieja. La concha de tu madre.');
      },
      onMirror() {
        state.flags.mirror = true;
        this.say('VOS', 'Uf… qué cara de orto. Ojos de mapache total.');
      },
      onToilet() {
        const toilet = currentScene().objects.find((o) => o.id === 'toilet');
        Sys.startPeeing(state, player, PlayerAPI, toilet);
        UI.openDialog(state.dialog.who, state.dialog.text);
      },
      onCash(obj) {
        Sys.onCash(state, obj);
        UI.openDialog(state.dialog.who, state.dialog.text);
        UI.updateHud(state, currentScene().name);
      },
      onCorner() {
        if (!state.flags.messaged) {
          this.say('VOS', 'Acá espero al transa… cuando le mande mensaje.');
        } else if (!state.friendArrived) {
          const left = Sys.remainingMs(state);
          this.say(
            'VOS',
            left > 0
              ? `Esperando. Faltan ${Sys.fmtMs(left)}.\nApretå Z para esperar råpido.`
              : 'Debería estar por llegar…'
          );
        } else {
          this.say('VOS', 'Llegó. Ahí está con la bolsita.');
        }
      },
      openShop() {
        state.shopOpen = true;
        const refresh = () => {
          UI.openShop(state, (id) => {
            if (Sys.buyItem(state, id)) {
              UI.updateHud(state, currentScene().name);
              refresh();
            }
          });
        };
        refresh();
      },
      goStreet() {
        changeScene('street', 'Saliendo a la calle…', 'monoambiente → calle');
      },
      goRoom() {
        changeScene('room', 'Volviendo al monoambiente…', 'calle → monoambiente');
      },
    };
  }

  function currentScene() {
    return scenes[state.sceneId];
  }

  function changeScene(targetId, msg, sub) {
    const info = Sys.beginSceneChange(
      state,
      targetId,
      msg,
      sub,
      (id) => {
        applyScene(id);
      },
      (id) => {
        UI.hideSceneLoad();
        UI.showPlayHud(state, currentScene().name);
        // Transa ya esperando
        if (id === 'street' && state.friendArrived && !state.winQueued) {
          state.winQueued = true;
          Sys.say(state, 'TRANSA', 'Llegué. Traje la merca. Te estaba esperando.');
          UI.openDialog(state.dialog.who, state.dialog.text);
          setTimeout(() => winGame(), 1600);
        }
      }
    );
    if (info !== undefined || state.mode === 'sceneLoad') {
      UI.showSceneLoad(msg, sub);
    }
  }

  function applyScene(id) {
    const prev = state.sceneId;
    state.sceneId = id;
    const sc = scenes[id];
    player.action = null;
    player.vx = 0;
    player.vy = 0;

    let spawn = sc.spawnIn;
    if (id === 'street' && prev === 'room') spawn = sc.spawnFromRoom;
    if (id === 'room' && prev === 'street') spawn = sc.spawnFromStreet;

    player.x = spawn.x;
    player.y = C.FLOOR_Y - player.h;
    player.facing = spawn.facing || 1;
    state.camX = Math.max(0, Math.min(C.WORLD_W - C.VIEW_W, player.x - C.VIEW_W / 2));

    if (id === 'street' && state.friendArrived) {
      friend.visible = true;
      friend.walking = false;
      friend.x = 1100;
      friend.y = C.FLOOR_Y - friend.h;
    }
  }

  function startGame() {
    state = StateAPI.resetPlay();
    player = PlayerAPI.create();
    friend = Sys.createFriend();
    scenes = ScenesAPI.buildScenes(buildHandlers());
    state.sceneId = 'room';
    player.x = scenes.room.spawnIn.x;
    player.y = C.FLOOR_Y - player.h;
    state.camX = 0;
    UI.closeDialog();
    UI.closeShop();
    UI.showPlayHud(state, scenes.room.name);
    Sys.say(state, 'VOS', '¿Qué hora es…? Da igual. Estoy al pedo. Necesito el celu y merca.');
    UI.openDialog(state.dialog.who, state.dialog.text);
  }

  function winGame() {
    state.mode = 'end';
    UI.showEnd();
  }

  function closeDialogFlow() {
    Sys.closeDialog(state);
    UI.closeDialog();
    state.inputLock = 0.2;
  }

  // ── Input de un frame ─────────────────────────────────────────
  function handlePlayInput() {
    if (state.dialog) {
      if (Input.just('enter') || Input.just(' ')) closeDialogFlow();
      return;
    }
    if (state.shopOpen) {
      if (Input.just('escape')) {
        state.shopOpen = false;
        UI.closeShop();
      }
      return;
    }

    if (Input.just('e') && state.nearObj && state.nearObj.interact) {
      state.nearObj.interact();
      if (state.dialog) UI.openDialog(state.dialog.who, state.dialog.text);
    }
    if (Input.just('c')) {
      Sys.tryMessage(state);
      if (state.dialog) UI.openDialog(state.dialog.who, state.dialog.text);
      UI.updateHud(state, currentScene().name);
    }
    if (Input.just('z')) {
      Sys.pressZ(state);
      if (state.dialog) UI.openDialog(state.dialog.who, state.dialog.text);
    }
    if (Input.just('h')) state.debugHitboxes = !state.debugHitboxes;
    // Inventario: solo click/touch en íconos (no teclas 1–4)
  }

  function syncDialogHud() {
    if (state.dialog) UI.openDialog(state.dialog.who, state.dialog.text);
    UI.updateHud(state, currentScene().name);
  }

  // ── Loop ──────────────────────────────────────────────────────
  let last = performance.now();

  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    state.time += dt;
    if (state.inputLock > 0) state.inputLock -= dt;
    if (state.strobe > 0) state.strobe = Math.max(0, state.strobe - dt);

    if (state.mode === 'play' && !state.transitioning) {
      handlePlayInput();

      const blocked = !!(state.dialog || state.shopOpen);
      PlayerAPI.update(player, dt, Input, currentScene(), {
        blocked,
        inputLock: state.inputLock > 0,
        onJump: () => Audio.jump(),
      });

      Sys.updateCamera(state, player);
      Sys.updateTimerAndFriend(state, friend, dt);
      Sys.updateFriendWalk(
        state,
        friend,
        dt,
        () => {
          Sys.say(state, 'TRANSA', 'Llegué. Traje la merca. No me digas que te dormiste de nuevo.');
          UI.openDialog(state.dialog.who, state.dialog.text);
          setTimeout(() => { if (state.mode === 'play') winGame(); }, 1800);
        },
        () => {
          Sys.say(state, 'VOS', 'Creo que llegó… mejor salgo a la esquina.');
          UI.openDialog(state.dialog.who, state.dialog.text);
        }
      );

      state.nearObj = ScenesAPI.findNearest(player, currentScene(), state);

      // Prompt
      if (state.nearObj && !state.dialog && !state.shopOpen) {
        const tag = state.nearObj.isExit ? '🚪 ' : state.nearObj.pickup ? '💵 ' : '';
        const label = state.nearObj.pickup ? `$${state.nearObj.amount}` : state.nearObj.name;
        UI.setPrompt(`[E] ${tag}${label}`);
      } else if (!state.dialog && state.flags.phone && !state.flags.messaged && !state.shopOpen) {
        UI.setPrompt('[C] Mandar mensaje');
      } else {
        UI.setPrompt(null);
      }

      UI.updateTimer(state);
    } else if (state.mode === 'sceneLoad') {
      Sys.updateTimerAndFriend(state, friend, dt);
      Sys.updateFriendWalk(state, friend, dt, () => {}, () => {});
    }

    // Title start keys
    if (state.mode === 'title' && (Input.just('enter') || Input.just(' '))) {
      startGame();
    }

    if (scenes) {
      Render.drawFrame(ctx, state, player, friend, currentScene() || scenes.room);
    } else {
      Render.drawFrame(ctx, state, player, friend, {
        id: 'room', bgKey: 'bgRoom', objects: [], platforms: [],
      });
    }

    Input.endFrame();
    requestAnimationFrame(frame);
  }

  // ── Wire DOM ──────────────────────────────────────────────────
  function wireUI() {
    const e = UI.els();
    UI.setTouchMode(UI.isTouch);

    e.btnStart.addEventListener('click', startGame);
    e.btnRestart.addEventListener('click', () => {
      state.mode = 'title';
      UI.showTitle();
    });
    e.btnCloseShop.addEventListener('click', () => {
      state.shopOpen = false;
      UI.closeShop();
    });
    e.dialog.addEventListener('click', closeDialogFlow);
    canvas.addEventListener('click', () => {
      if (state.dialog) closeDialogFlow();
    });
    // Touch en canvas también cierra diálogo
    canvas.addEventListener('pointerup', (ev) => {
      if (state.dialog && ev.pointerType === 'touch') closeDialogFlow();
    });
    e.soundBtn.addEventListener('click', () => {
      const on = Audio.toggle();
      UI.setSoundIcon(on);
    });
    // Consumir item: un solo handler (pointerup) evita doble gasto en mobile
    e.invBar.addEventListener('pointerup', (ev) => {
      if (ev.button !== undefined && ev.button !== 0) return;
      const slot = ev.target.closest('.inv-slot');
      if (!slot || !slot.dataset.item) return;
      ev.preventDefault();
      Sys.useItem(state, player, PlayerAPI, slot.dataset.item);
      syncDialogHud();
    });

    window.addEventListener('resize', () => UI.fitCanvas(canvas));
    window.addEventListener('orientationchange', () => {
      setTimeout(() => UI.fitCanvas(canvas), 120);
    });
    // iOS visual viewport (barra de URL)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => UI.fitCanvas(canvas));
    }
    UI.fitCanvas(canvas);
  }

  // ── Boot ──────────────────────────────────────────────────────
  async function boot() {
    // Bind teclado + botones táctiles (data-key en #touchPad)
    Input.bind(document.getElementById('ui'));
    wireUI();
    try {
      await Assets.loadAll(C.ASSETS, (n, total) => UI.setLoadProgress(n, total));
      scenes = ScenesAPI.buildScenes(buildHandlers());
      state.mode = 'title';
      UI.showTitle();
      requestAnimationFrame(frame);
    } catch (err) {
      UI.els().loadTxt.textContent =
        'Error cargando assets: ' + err.message +
        '\nAbrí con servidor local: python3 -m http.server';
      console.error(err);
    }
  }

  // Debug API
  window.TRANSAS = {
    get state() { return state; },
    get player() { return player; },
    skipWait() { state.messageAt = Date.now() - C.WAIT_MS; },
    toggleDebug() { state.debugHitboxes = !state.debugHitboxes; },
  };

  boot();
})();
