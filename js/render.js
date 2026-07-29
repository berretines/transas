/**
 * render.js — Dibujo en canvas
 */
window.TRANSAS_Render = (() => {
  const C = () => window.TRANSAS_CONFIG;
  const Assets = () => window.TRANSAS_Assets;
  const Scenes = () => window.TRANSAS_Scenes;
  const PlayerAPI = () => window.TRANSAS_Player;

  function drawSprite(ctx, im, x, y, h, flip) {
    if (!im) return;
    const ratio = im.width / im.height;
    const dh = h;
    const dw = dh * ratio;
    ctx.save();
    if (flip) {
      ctx.translate(x + dw, y);
      ctx.scale(-1, 1);
      ctx.drawImage(im, 0, 0, dw, dh);
    } else {
      ctx.drawImage(im, x, y, dw, dh);
    }
    ctx.restore();
  }

  function drawPlayer(ctx, player, camX) {
    const cfg = C();
    const key = PlayerAPI().spriteKey(player);
    const im = Assets().get(key) || Assets().get('protaIdle');
    if (!im) return;

    // Sprite de meada (de espaldas): no flip
    const noFlip = player.action && player.action.noFlip;
    const flip = noFlip ? false : player.facing < 0;
    const dh = cfg.PLAYER_DRAW_H;
    const dw = dh * cfg.SPRITE_ASPECT;
    const drawX = player.x + player.w / 2 - dw / 2 - camX;
    const drawY = player.y + player.h - dh;
    drawSprite(ctx, im, drawX, drawY, dh, flip);

    // Chorro: sale de la mano/zona de la vejiga (perfil 3/4 de espalda) → inodoro
    if (player.action && player.action.type === 'pee' && player.action.t > 0.1) {
      const a = player.action;
      const fadeIn = Math.min(1, (a.t - 0.1) / 0.18);
      const fadeOut = a.t > a.dur - 0.35 ? Math.max(0, (a.dur - a.t) / 0.35) : 1;
      const life = fadeIn * fadeOut;
      // mano tapando la entrepierna (sprite 3/4 de espalda, mirando a la der.)
      const sx = drawX + dw * 0.58;
      const sy = drawY + dh * 0.54;
      let ex = sx + 48;
      let ey = sy + 42;
      if (a.targetX != null && a.targetY != null) {
        ex = a.targetX - camX;
        ey = a.targetY;
      }
      const phase = a.t * 22;
      const n = 34;
      ctx.save();
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const px = sx + (ex - sx) * t + Math.sin(phase + i * 0.65) * (1.0 * (1 - t));
        const py = sy + (ey - sy) * t + t * t * 14;
        const size = Math.max(1.2, (3.6 - t * 1.9) * life);
        ctx.globalAlpha = (0.95 - t * 0.5) * life;
        ctx.fillStyle = i % 3 === 0 ? '#f5e07a' : i % 3 === 1 ? '#e8c84a' : '#c9a832';
        ctx.fillRect(px, py, size, size + 0.4);
      }
      ctx.globalAlpha = 0.65 * life;
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 ? '#f0d060' : '#e8c84a';
        ctx.fillRect(
          ex + Math.sin(phase + i * 1.5) * (3 + i * 0.7),
          ey + Math.cos(phase * 1.1 + i) * 2.2,
          2 + (i % 3),
          2
        );
      }
      ctx.restore();
    }

    // Humo solo si fuma y está quieto
    if (
      player.action &&
      player.action.type === 'smoke' &&
      !(player.anim === 'walk' && Math.abs(player.vx) > 25)
    ) {
      const sx = drawX + dw * (flip ? 0.28 : 0.72);
      const sy = drawY + dh * 0.20;
      ctx.save();
      ctx.globalAlpha = 0.38;
      for (let i = 0; i < 5; i++) {
        const rise = (player.action.t * 18 + i * 11) % 40;
        ctx.fillStyle = i % 2 ? '#ececec' : '#c8c8c8';
        ctx.beginPath();
        ctx.arc(sx + Math.sin(player.action.t * 2.2 + i) * 6, sy - rise, 2.4 + i * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /**
   * Sprite del transa:
   *  - caminando: walk1 → walk3 → walk2 → walk3
   *  - parado (llegó): idle con bolsita
   * Los walk miran a la izquierda; idle con bag mira a la derecha → flip al idle.
   */
  function friendSpriteKey(friend) {
    if (!friend.walking) return 'friendIdle';
    const cycle = ['friendWalk1', 'friendWalk3', 'friendWalk2', 'friendWalk3'];
    return cycle[friend.frame % cycle.length];
  }

  function drawFriend(ctx, friend, camX, sceneId) {
    if (!friend.visible || sceneId !== 'street') return;
    const key = friendSpriteKey(friend);
    const im = Assets().get(key) || Assets().get('friend') || Assets().get('friendIdle');
    if (!im) return;
    const cfg = C();
    const dh = cfg.FRIEND_DRAW_H;
    // canvas normalizado 420×900
    const dw = dh * cfg.SPRITE_ASPECT;
    const bob = friend.bob || 0;
    const drawX = friend.x + friend.w / 2 - dw / 2 - camX;
    const drawY = friend.y + friend.h - dh - bob;

    // walk frames ya miran a la izquierda; idle (bag) mira a la derecha → flip
    const flip = !friend.walking;
    drawSprite(ctx, im, drawX, drawY, dh, flip);

    // sombra suave bajo los pies
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    const sx = friend.x + friend.w / 2 - camX;
    const sy = friend.y + friend.h - 4;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPickups(ctx, scene, state, camX) {
    const bill = Assets().get('bill');
    if (!bill) return;
    for (const o of Scenes().liveObjects(scene, state)) {
      if (!o.pickup) continue;
      const bob = Math.sin(state.time * 4 + o.x) * 3;
      ctx.drawImage(bill, o.x - camX, o.y + bob, o.w, o.h);
    }
  }

  function drawPhoneHint(ctx, scene, state, camX) {
    if (scene.id !== 'room' || state.flags.phone) return;
    const phone = Assets().get('phone');
    const clothes = scene.objects.find((o) => o.id === 'clothes');
    if (!phone || !clothes) return;
    const bob = Math.sin(state.time * 3) * 4;
    ctx.drawImage(phone, clothes.x + clothes.w / 2 - 16 - camX, clothes.y - 40 + bob, 32, 38);
  }

  function drawHighlight(ctx, o, camX) {
    if (!o) return;
    ctx.save();
    ctx.strokeStyle = o.pickup ? '#7dce82' : '#ffe66d';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(o.x - camX - 2, o.y - 2, o.w + 4, o.h + 4);
    ctx.setLineDash([]);

    const label = o.pickup ? `$${o.amount}` : o.name;
    ctx.font = 'bold 12px "Courier New", monospace';
    const tw = ctx.measureText(label).width;
    const lx = o.x - camX + o.w / 2 - tw / 2 - 6;
    const ly = o.y - 26;
    ctx.fillStyle = 'rgba(10,6,18,0.88)';
    ctx.fillRect(lx, ly, tw + 12, 20);
    ctx.strokeStyle = o.pickup ? '#7dce82' : '#ffe66d';
    ctx.lineWidth = 2;
    ctx.strokeRect(lx, ly, tw + 12, 20);
    ctx.fillStyle = o.pickup ? '#7dce82' : '#ffe66d';
    ctx.fillText(label, lx + 6, ly + 14);
    ctx.restore();
  }

  function drawCornerMarker(ctx, state, camX) {
    if (state.sceneId !== 'street' || !state.flags.messaged || state.friendArrived) return;
    const x = 800 - camX;
    const y = C().FLOOR_Y - 95;
    const bob = Math.sin(state.time * 4) * 4;
    ctx.fillStyle = 'rgba(255,45,149,0.9)';
    ctx.beginPath();
    ctx.moveTo(x, y + bob);
    ctx.lineTo(x + 12, y + 20 + bob);
    ctx.lineTo(x - 12, y + 20 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe66d';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText('ESQUINA', x - 30, y - 6 + bob);
  }

  /** Un flash blanco/rosa corto por cada toque de Z (no parpadeo continuo). */
  function drawStrobe(ctx, state) {
    if (state.strobe <= 0) return;
    const { VIEW_W: W, VIEW_H: H } = C();
    const k = Math.min(1, state.strobe / 0.12);
    ctx.save();
    ctx.globalAlpha = 0.55 * k;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.28 * k;
    ctx.fillStyle = '#ff2d95';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.12 * k;
    ctx.fillStyle = '#00f5d4';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawDebug(ctx, scene, state, player, camX) {
    if (!state.debugHitboxes) return;
    ctx.save();
    for (const o of Scenes().liveObjects(scene, state)) {
      // visual box
      ctx.strokeStyle = o.pickup ? 'rgba(125,206,130,0.9)' : 'rgba(0,245,212,0.8)';
      ctx.strokeRect(o.x - camX, o.y, o.w, o.h);
      // interact zone to floor
      const z = Scenes().interactZone(o);
      ctx.strokeStyle = 'rgba(255,230,109,0.35)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(z.x - camX, z.y, z.w, z.h);
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = 'rgba(255,45,149,0.95)';
    ctx.strokeRect(player.x - camX, player.y, player.w, player.h);
    ctx.restore();
  }

  function drawFrame(ctx, state, player, friend, scene) {
    const { VIEW_W: W, VIEW_H: H, WORLD_W } = C();
    const camX = state.camX;
    ctx.clearRect(0, 0, W, H);

    // Title / load backdrop
    if (state.mode === 'title' || state.mode === 'load') {
      const bg = Assets().get('bgRoom');
      if (bg) {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(bg, 0, 0, WORLD_W, H, 0, 0, W, H);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = '#12081c';
        ctx.fillRect(0, 0, W, H);
      }
      if (state.mode === 'title') {
        const idle = Assets().get('protaIdle');
        if (idle) drawSprite(ctx, idle, W / 2 - 60, H - C().PLAYER_DRAW_H - 40, C().PLAYER_DRAW_H + 10, false);
      }
      return;
    }

    if (state.mode === 'end') {
      const bg = Assets().get('bgStreet');
      if (bg) ctx.drawImage(bg, 0, 0, WORLD_W, H, 0, 0, W, H);
      const fr = Assets().get('friendIdle') || Assets().get('friend');
      const idle = Assets().get('protaIdle');
      if (fr) drawSprite(ctx, fr, W / 2 + 40, H - C().FRIEND_DRAW_H - 28, C().FRIEND_DRAW_H, true);
      if (idle) drawSprite(ctx, idle, W / 2 - 150, H - C().PLAYER_DRAW_H - 28, C().PLAYER_DRAW_H, false);
      return;
    }

    // Mundo
    const bg = Assets().get(scene.bgKey);
    if (bg) {
      // dibuja el mapa ancho desplazado por cámara
      ctx.drawImage(bg, camX, 0, W, H, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#1a1020';
      ctx.fillRect(0, 0, W, H);
    }

    drawPickups(ctx, scene, state, camX);
    drawPhoneHint(ctx, scene, state, camX);
    drawCornerMarker(ctx, state, camX);
    drawHighlight(ctx, state.nearObj, camX);
    drawPlayer(ctx, player, camX);
    drawFriend(ctx, friend, camX, state.sceneId);
    drawStrobe(ctx, state);
    drawDebug(ctx, scene, state, player, camX);
  }

  return { drawFrame };
})();
