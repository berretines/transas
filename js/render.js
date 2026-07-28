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

    const flip = player.facing < 0;
    const dh = cfg.PLAYER_DRAW_H;
    const dw = dh * cfg.SPRITE_ASPECT;
    const drawX = player.x + player.w / 2 - dw / 2 - camX;
    const drawY = player.y + player.h - dh;
    drawSprite(ctx, im, drawX, drawY, dh, flip);

    // Chorrito animado al mear (stream + gotas + splash)
    if (player.action && player.action.type === 'pee' && player.action.t > 0.15 && player.action.t < 2.55) {
      const dir = flip ? -1 : 1;
      const sx = drawX + dw * (flip ? 0.40 : 0.58);
      const sy = drawY + dh * 0.56;
      const phase = player.action.t * 22;
      const life = Math.min(1, (player.action.t - 0.15) / 0.25);

      ctx.save();
      for (let i = 0; i < 18; i++) {
        const t = i / 18;
        const wobble = Math.sin(phase + i * 0.85) * (1.8 + t * 2);
        const px = sx + dir * (i * 2.6 + t * 4) + wobble;
        const py = sy + i * 2.35 + Math.cos(phase * 0.7 + i) * 0.6;
        const size = (3.2 - t * 1.2) * life;
        ctx.globalAlpha = (0.95 - t * 0.35) * life;
        ctx.fillStyle = i % 3 === 0 ? '#f5e07a' : i % 3 === 1 ? '#e8c84a' : '#d4b040';
        ctx.fillRect(px, py, size, size + 0.5);
      }
      for (let i = 0; i < 6; i++) {
        const g = (phase * 0.4 + i * 1.7) % 10;
        ctx.globalAlpha = 0.55 * life;
        ctx.fillStyle = '#f0d060';
        ctx.fillRect(
          sx + dir * (8 + i * 3.5) + Math.sin(phase + i * 2) * 3,
          sy + 18 + g * 2.2,
          2,
          2
        );
      }
      const splashY = drawY + dh - 6;
      const splashX = sx + dir * 38;
      ctx.globalAlpha = 0.5 * life;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = '#e8c84a';
        ctx.fillRect(
          splashX + Math.sin(phase + i * 1.3) * (4 + i * 2),
          splashY + (i % 2),
          2 + (i % 3),
          2
        );
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // humo al fumar
    if (player.action && player.action.type === 'smoke') {
      const sx = flip ? drawX + dw * 0.32 : drawX + dw * 0.68;
      const sy = drawY + dh * 0.18;
      ctx.globalAlpha = 0.4;
      for (let i = 0; i < 5; i++) {
        const rise = (player.action.t * 28 + i * 12) % 40;
        ctx.fillStyle = i % 2 ? '#ddd' : '#bbb';
        ctx.beginPath();
        ctx.arc(sx + Math.sin(player.action.t * 3 + i) * 8, sy - rise, 3 + i * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawFriend(ctx, friend, camX, sceneId) {
    if (!friend.visible || sceneId !== 'street') return;
    const im = Assets().get('friend');
    if (!im) return;
    const cfg = C();
    const dh = cfg.FRIEND_DRAW_H;
    const dw = dh * (im.width / im.height);
    const drawX = friend.x + friend.w / 2 - dw / 2 - camX;
    const drawY = friend.y + friend.h - dh;
    drawSprite(ctx, im, drawX, drawY, dh, true);
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

  function drawStrobe(ctx, state) {
    if (state.strobe <= 0) return;
    const { VIEW_W: W, VIEW_H: H } = C();
    const flash = Math.floor(state.time * 28) % 2 === 0;
    ctx.save();
    if (flash) {
      ctx.globalAlpha = 0.22 + state.strobe * 0.25;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#ff2d95';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.globalAlpha = 0.35 * state.strobe;
      ctx.fillStyle = '#0a0612';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#00f5d4';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = 0.15 * state.strobe;
    ctx.fillStyle = '#000';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
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
      const fr = Assets().get('friend');
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
