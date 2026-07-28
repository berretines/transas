/**
 * scenes.js — Mapas, objetos e hitboxes
 *
 * Coordenadas MUNDO 0…1920 × 0…540 (mapas a esa resolución).
 * Cajas calibradas con grilla de 100px sobre bg_room / bg_street.
 *
 * Hitboxes:
 *  - x,y,w,h = marco visual del objeto (highlight)
 *  - interactZone() extiende hasta el piso → no hace falta saltar
 */
window.TRANSAS_Scenes = (() => {
  const C = () => window.TRANSAS_CONFIG;

  function obj(def) {
    return def;
  }

  function buildScenes(handlers) {
    const { FLOOR_Y, WORLD_W } = C();
    const H = handlers;

    return {
      // ══════════════════════════════════════════════════════════
      // MONOAMBIENTE (bg_room 1920×540) — grilla 100px
      // ══════════════════════════════════════════════════════════
      room: {
        id: 'room',
        name: 'Monoambiente',
        bgKey: 'bgRoom',
        worldW: WORLD_W,
        spawnIn: { x: 160, facing: 1 },
        spawnFromStreet: { x: 860, facing: -1 },
        bounds: { minX: 24, maxX: WORLD_W - 70 },
        platforms: [
          { x: -120, y: FLOOR_Y, w: WORLD_W + 240, h: 100 },
        ],
        objects: [
          // Cama Boca: ~x50–480, y285–450
          obj({
            id: 'bed',
            name: 'Cama',
            x: 55, y: 285, w: 420, h: 165,
            interact: () => H.onBed(),
          }),
          // Poster Boca: ~x235–400, y80–230
          obj({
            id: 'posterB',
            name: 'Poster Boca',
            x: 235, y: 80, w: 165, h: 155,
            interact: () => H.say('VOS', 'Boca… la mitad más uno. Hoy no gana ni el monoambiente.'),
          }),
          // Poster River: ~x405–535, y80–240
          obj({
            id: 'posterR',
            name: 'Poster River',
            x: 405, y: 78, w: 135, h: 165,
            interact: () => H.say('VOS', 'River… el gallinero del barrio.'),
          }),
          // Pila de ropa + bolsas: ~x500–720, y250–420
          obj({
            id: 'clothes',
            name: 'Pila de ropa',
            x: 500, y: 250, w: 230, h: 175,
            interact: () => H.onClothes(),
          }),
          // Puerta verde: ~x735–980, y75–405
          obj({
            id: 'door',
            name: 'Puerta a la calle',
            x: 735, y: 75, w: 250, h: 330,
            isExit: true,
            interact: () => H.goStreet(),
          }),
          // Heladera + puerta abierta: ~x1145–1405, y110–420
          obj({
            id: 'fridge',
            name: 'Heladera',
            x: 1145, y: 110, w: 265, h: 315,
            interact: () => H.onFridge(),
          }),
          // Espejo baño: ~x1480–1630, y95–210
          obj({
            id: 'mirror',
            name: 'Espejo',
            x: 1480, y: 95, w: 155, h: 120,
            interact: () => H.onMirror(),
          }),
          // Inodoro: ~x1685–1885, y280–470
          obj({
            id: 'toilet',
            name: 'Inodoro',
            x: 1685, y: 280, w: 200, h: 195,
            interact: () => H.onToilet(),
          }),
          // Billete en el piso junto a la ropa
          obj({
            id: 'cash2000',
            name: 'Billete $2000',
            x: 475, y: 445, w: 52, h: 28,
            pickup: true,
            amount: 2000,
            interact: function () { H.onCash(this); },
          }),
        ],
      },

      // ══════════════════════════════════════════════════════════
      // CALLE (bg_street 1920×540) — El Gevi — grilla 100px
      // ══════════════════════════════════════════════════════════
      street: {
        id: 'street',
        name: 'Calle',
        bgKey: 'bgStreet',
        worldW: WORLD_W,
        spawnIn: { x: 90, facing: 1 },
        spawnFromRoom: { x: 85, facing: 1 },
        bounds: { minX: 18, maxX: WORLD_W - 70 },
        platforms: [
          { x: -120, y: FLOOR_Y, w: WORLD_W + 240, h: 100 },
        ],
        objects: [
          // Puerta enrejada del depto: ~x90–200, y230–390
          obj({
            id: 'home',
            name: 'Volver al depto',
            x: 88, y: 225, w: 120, h: 175,
            isExit: true,
            interact: () => H.goRoom(),
          }),
          // Muro graffiti: ~x250–1040, y160–390
          obj({
            id: 'graffiti',
            name: 'Graffiti',
            x: 250, y: 160, w: 790, h: 235,
            interact: () => H.say('VOS', 'Graffiti del barrio. Colores, flechas y cero futuro. Clásico.'),
          }),
          // Esquina / cebra (vereda frente al Gevi): ~x1000–1250, y400–475
          obj({
            id: 'corner',
            name: 'Esquina',
            x: 1000, y: 400, w: 260, h: 78,
            interact: () => H.onCorner(),
          }),
          // Kiosco EL GEVI: ~x1050–1410, y155–400
          obj({
            id: 'kiosk',
            name: 'Kiosco El Gevi',
            x: 1045, y: 155, w: 365, h: 250,
            interact: () => H.openShop(),
          }),
          // Farola: sin hitbox (decorativa)
          // Parada COLECTIVOS: ~x1545–1860, y195–420
          obj({
            id: 'busstop',
            name: 'Parada de bondi',
            x: 1545, y: 195, w: 320, h: 230,
            interact: () => H.say('VOS', 'La parada. Hoy el bondi no pasa. Mejor.'),
          }),
          // Billetes en vereda
          obj({
            id: 'cash1000a',
            name: 'Billete $1000',
            x: 340, y: 448, w: 48, h: 26,
            pickup: true,
            amount: 1000,
            interact: function () { H.onCash(this); },
          }),
          obj({
            id: 'cash1000b',
            name: 'Billete $1000',
            x: 1300, y: 450, w: 48, h: 26,
            pickup: true,
            amount: 1000,
            interact: function () { H.onCash(this); },
          }),
        ],
      },
    };
  }

  /**
   * Zona de interacción: ancho casi igual al visual,
   * altura desde el tope del objeto hasta el piso.
   */
  function interactZone(o) {
    const floor = C().FLOOR_Y;
    const padX = 6;
    const top = Math.min(o.y, floor - 48);
    return {
      x: o.x - padX,
      y: top,
      w: o.w + padX * 2,
      h: floor + 20 - top,
    };
  }

  /**
   * Cerca = pies dentro del ancho del objeto (± margen)
   * y cuerpo solapa la zona hasta el piso.
   */
  function isPlayerNear(player, o) {
    const zone = interactZone(o);
    const feetX = player.x + player.w / 2;
    const margin = 22;
    const inX = feetX >= o.x - margin && feetX <= o.x + o.w + margin;

    const body = { x: player.x, y: player.y, w: player.w, h: player.h };
    const overlap =
      body.x < zone.x + zone.w &&
      body.x + body.w > zone.x &&
      body.y < zone.y + zone.h &&
      body.y + body.h > zone.y;

    return inX && overlap;
  }

  function liveObjects(scene, state) {
    return scene.objects.filter((o) => !(o.pickup && state.picked[o.id]));
  }

  function findNearest(player, scene, state) {
    let best = null;
    let bestDist = Infinity;
    const px = player.x + player.w / 2;
    for (const o of liveObjects(scene, state)) {
      if (!isPlayerNear(player, o)) continue;
      const cx = o.x + o.w / 2;
      const d = Math.abs(px - cx);
      if (d < bestDist) {
        bestDist = d;
        best = o;
      }
    }
    return best;
  }

  return { buildScenes, interactZone, isPlayerNear, liveObjects, findNearest };
})();
