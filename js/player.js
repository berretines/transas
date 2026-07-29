/**
 * player.js — Física, animaciones y acciones del protagonista
 */
window.TRANSAS_Player = (() => {
  const C = () => window.TRANSAS_CONFIG;

  function create() {
    const cfg = C();
    return {
      x: 160,
      y: cfg.FLOOR_Y - cfg.PLAYER_H,
      w: cfg.PLAYER_W,
      h: cfg.PLAYER_H,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      anim: 'idle',
      frameT: 0,
      walkFlip: false,
      // action: { type, t, dur, frame, frameT, canWalk }
      action: null,
    };
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function resolve(ent, platforms, axis) {
    for (const p of platforms) {
      if (!aabb(ent, p)) continue;
      if (axis === 'x') {
        if (ent.vx > 0) ent.x = p.x - ent.w;
        else if (ent.vx < 0) ent.x = p.x + p.w;
        ent.vx = 0;
      } else if (ent.vy > 0) {
        ent.y = p.y - ent.h;
        ent.vy = 0;
        ent.onGround = true;
      } else if (ent.vy < 0) {
        ent.y = p.y + p.h;
        ent.vy = 0;
      }
    }
  }

  function startAction(player, type, dur) {
    player.action = {
      type,
      t: 0,
      dur,
      frame: 0,
      frameT: 0,
      canWalk: true,
    };
  }

  /**
   * Update físico. Las acciones de inventario NO bloquean el movimiento.
   */
  function update(player, dt, input, scene, opts) {
    const { PHYS, FLOOR_Y } = C();
    const blocked = opts.blocked; // dialog / shop / transition

    // Tick de animación de acción
    if (player.action) {
      player.action.t += dt;
      player.action.frameT += dt;
      if (player.action.frameT > 0.16) {
        player.action.frameT = 0;
        player.action.frame = (player.action.frame + 1) % 2;
      }
      if (player.action.t >= player.action.dur) player.action = null;
    }

    if (blocked) return;

    const left = input.isDown('arrowleft') || input.isDown('a');
    const right = input.isDown('arrowright') || input.isDown('d');
    const jumpPressed =
      input.just('arrowup') || input.just('w') || input.just(' ');

    if (left) {
      player.vx -= PHYS.accel * dt;
      player.facing = -1;
    } else if (right) {
      player.vx += PHYS.accel * dt;
      player.facing = 1;
    } else {
      if (player.vx > 0) player.vx = Math.max(0, player.vx - PHYS.friction * dt);
      if (player.vx < 0) player.vx = Math.min(0, player.vx + PHYS.friction * dt);
    }
    player.vx = Math.max(-PHYS.maxSpeed, Math.min(PHYS.maxSpeed, player.vx));

    // En mobile no hay salto (solo desktop / teclado)
    if (!opts.noJump && !opts.inputLock && jumpPressed && player.onGround) {
      player.vy = -PHYS.jump;
      player.onGround = false;
      if (opts.onJump) opts.onJump();
    }

    player.vy += PHYS.gravity * dt;
    if (player.vy > 1000) player.vy = 1000;

    player.x += player.vx * dt;
    resolve(player, scene.platforms, 'x');
    player.y += player.vy * dt;
    player.onGround = false;
    resolve(player, scene.platforms, 'y');

    player.x = Math.max(scene.bounds.minX, Math.min(scene.bounds.maxX, player.x));
    if (player.y > FLOOR_Y + 200) {
      player.y = FLOOR_Y - player.h;
      player.vy = 0;
    }

    if (Math.abs(player.vx) > 25 && player.onGround) {
      player.anim = 'walk';
      player.frameT += dt;
      if (player.frameT > 0.15) {
        player.frameT = 0;
        player.walkFlip = !player.walkFlip;
      }
    } else {
      player.anim = 'idle';
    }
  }

  /** Qué imagen dibujar según estado */
  function spriteKey(player) {
    if (player.action) {
      const f = player.action.frame;
      switch (player.action.type) {
        case 'smoke': return f ? 'actSmoke2' : 'actSmoke1';
        case 'chew':  return f ? 'actChew2' : 'actChew1';
        case 'beer':  return 'actDrinkBeer';
        case 'pepsi': return 'actDrinkPepsi';
        case 'pee':   return f ? 'actPee2' : 'actPee1'; // frames alternados + stream en render
        default: break;
      }
    }
    if (player.anim === 'walk') return player.walkFlip ? 'protaWalk' : 'protaIdle';
    return 'protaIdle';
  }

  return { create, update, startAction, spriteKey };
})();
