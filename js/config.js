/**
 * config.js — Constantes globales del juego
 * Todo tamaño/tiempo/precio se define acá para no hardcodear en la lógica.
 */
window.TRANSAS_CONFIG = Object.freeze({
  // Viewport (cámara / canvas)
  VIEW_W: 960,
  VIEW_H: 540,

  // Mundo horizontal (mapas 1920×540)
  WORLD_W: 1920,
  WORLD_H: 540,

  // Piso y personaje
  FLOOR_Y: 478,
  PLAYER_W: 48,
  PLAYER_H: 96,
  PLAYER_DRAW_H: 210,
  FRIEND_DRAW_H: 200,
  // Sprites normalizados a 420×900
  SPRITE_ASPECT: 420 / 900,

  // Física
  PHYS: Object.freeze({
    accel: 2000,
    maxSpeed: 230,
    friction: 1700,
    gravity: 1900,
    jump: 560,
  }),

  // Economía
  START_MONEY: 8000,
  WAIT_MS: 10 * 60 * 1000,

  // Tienda
  // pack = cuántas unidades entran al inventario por compra
  SHOP: Object.freeze([
    Object.freeze({ id: 'redpoint', name: 'Red Point', price: 2000, icon: 'item_redpoint', pack: 20 }),
    Object.freeze({ id: 'chicles',  name: 'Chicles',   price: 500,  icon: 'item_chicles',  pack: 5 }),
    Object.freeze({ id: 'birra',    name: 'Birra',     price: 2500, icon: 'item_birra',    pack: 1 }),
    Object.freeze({ id: 'pepsi',    name: 'Pepsi',     price: 1500, icon: 'item_pepsi',    pack: 1 }),
  ]),

  // Assets (rutas relativas a index.html)
  ASSETS: Object.freeze({
    protaIdle: 'assets/prota_idle.png',
    protaWalk: 'assets/prota_walk.png',
    protaPee: 'assets/prota_pee.png',
    actSmoke1: 'assets/act_smoke1.png',
    actSmoke2: 'assets/act_smoke2.png',
    actChew1: 'assets/act_chew1.png',
    actChew2: 'assets/act_chew2.png',
    actDrinkBeer: 'assets/act_drink_beer.png',
    actDrinkPepsi: 'assets/act_drink_pepsi.png',
    actPee1: 'assets/act_pee1.png',
    actPee2: 'assets/act_pee2.png',
    friend: 'assets/friend.png',
    friendIdle: 'assets/friend_idle.png',
    friendWalk1: 'assets/friend_walk1.png',
    friendWalk2: 'assets/friend_walk2.png',
    friendWalk3: 'assets/friend_walk3.png',
    phone: 'assets/phone.png',
    bill: 'assets/bill.png',
    item_redpoint: 'assets/item_redpoint.png',
    item_chicles: 'assets/item_chicles.png',
    item_birra: 'assets/item_birra.png',
    item_pepsi: 'assets/item_pepsi.png',
    bgRoom: 'assets/bg_room.jpg',
    bgStreet: 'assets/bg_street.jpg',
  }),
});
