/**
 * state.js — Estado mutable del juego
 */
window.TRANSAS_State = (() => {
  const C = () => window.TRANSAS_CONFIG;

  function createInitial() {
    return {
      mode: 'load',          // load | title | play | sceneLoad | end
      sceneId: 'room',       // room | street
      time: 0,
      camX: 0,

      dialog: null,          // { who, text }
      dialogLockUntil: 0,    // anti ghost-touch al abrir cartel
      nearObj: null,
      inputLock: 0,
      transitioning: false,
      shopOpen: false,
      debugHitboxes: false,
      strobe: 0,

      money: C().START_MONEY,
      inv: { phone: false, redpoint: 0, chicles: 0, birra: 0, pepsi: 0 },
      flags: {
        woke: false,
        peed: false,
        fridge: false,
        phone: false,
        messaged: false,
        mirror: false,
      },
      picked: {},            // id billete → true
      messageAt: 0,
      friendArrived: false,
      winQueued: false,
      pendingWin: false, // true tras diálogo del transa; win a los 5s de cerrarlo
    };
  }

  let state = createInitial();

  function get() { return state; }

  function resetPlay() {
    state = createInitial();
    state.mode = 'play';
    state.sceneId = 'room';
    return state;
  }

  return { get, resetPlay, createInitial };
})();
