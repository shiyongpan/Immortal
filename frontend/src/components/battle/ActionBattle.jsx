import { useEffect, useRef, useCallback } from "react";
import {
  W, H,
  createPlayer, createEnemy,
  rectsOverlap, dist, calcDmg, makeParticle,
} from "./gameEngine";
import { useBattle } from "../../contexts/BattleContext";

// ───────── 繪製輔助 ─────────
function drawRoundRect(ctx, x, y, w, h, r = 6) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function bar(ctx, x, y, w, h, pct, fg, bg = "#1a1a1a") {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fg;
  ctx.fillRect(x, y, Math.max(0, w * pct), h);
}

function drawEntity(ctx, e, isPlayer) {
  if (e.state === "dead") return;
  const x = Math.round(e.x), y = Math.round(e.y);
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(x + e.w / 2, y + e.h + 4, e.w / 2.2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // flash when hurt
  const hurt = e.hurtTimer > 0;
  ctx.save();
  if (hurt) { ctx.filter = "brightness(3) saturate(0)"; }

  if (isPlayer) {
    // body
    ctx.fillStyle = "#4f8ef7";
    drawRoundRect(ctx, x + 4, y + 16, e.w - 8, e.h - 16, 4);
    ctx.fill();
    // head
    ctx.fillStyle = "#f7c97a";
    ctx.beginPath();
    ctx.ellipse(x + e.w / 2, y + 10, 9, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // 劍光改由 render 用 aimAngle 統一繪製
  } else {
    // monster body
    ctx.fillStyle = "#a04040";
    drawRoundRect(ctx, x + 3, y + 14, e.w - 6, e.h - 14, 5);
    ctx.fill();
    // head
    ctx.fillStyle = "#7a1a1a";
    ctx.beginPath();
    ctx.ellipse(x + e.w / 2, y + 8, 10, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(x + e.w / 2 - 6, y + 5, 4, 4);
    ctx.fillRect(x + e.w / 2 + 2, y + 5, 4, 4);
    // attack wind-up
    if (e.state === "attack" && e.atkTimer > e.atkDuration * 0.5) {
      ctx.fillStyle = "rgba(255,80,80,0.35)";
      ctx.beginPath();
      ctx.arc(x + e.w / 2, y + e.h / 2, e.atkRange * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // HP bar above
  if (!isPlayer) {
    bar(ctx, x, y - 10, e.w, 5, e.hp / e.maxHp, "#e84040");
  }
}

// ───────── 投射物繪製 ─────────
function drawProjectile(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.atan2(p.vy, p.vx));
  ctx.fillStyle = p.color || "#ffe066";
  ctx.shadowColor = p.color || "#ffe066";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ───────── 技能 1 - 劍氣斬 (projectile) ─────────
function castSwordQi(player, mouseRef) {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const mx = mouseRef.current.x;
  const my = mouseRef.current.y;
  const angle = Math.atan2(my - py, mx - px);
  return {
    x: px, y: py,
    vx: Math.cos(angle) * 9,
    vy: Math.sin(angle) * 9,
    w: 28, h: 10,
    color: "#ffe066",
    dmgMult: 1.8,
    life: 55,
    fromPlayer: true,
  };
}

// ───────── 技能 2 - 烈焰爆 (AoE) ─────────
function castFlameBurst(player, enemies, particles) {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const radius = 120;
  enemies.forEach((e) => {
    if (e.state === "dead") return;
    const d = dist(player, e);
    if (d < radius) {
      const { dmg, isCrit } = calcDmg(player.atk * 2, e.def, player.critRate, player.critDmg);
      e.hp -= dmg;
      e.hurtTimer = 10;
      if (e.hp <= 0) e.state = "dead";
      particles.push(makeParticle(e.x + e.w / 2, e.y, isCrit ? `暴擊 ${dmg}` : String(dmg), isCrit ? "#ff6600" : "#ff4444"));
    }
  });
  // return AoE visual ring
  return { x: px, y: py, radius, life: 30, maxLife: 30, type: "aoe" };
}

// ───────── 技能 3 - 靈氣療愈 ─────────
function castHeal(player, particles) {
  const heal = Math.floor(player.maxHp * 0.35);
  player.hp = Math.min(player.maxHp, player.hp + heal);
  particles.push(makeParticle(player.x + player.w / 2, player.y - 10, `+${heal}`, "#44ff88", -2.2));
}

// ───────── 技能 4 - 瞬步閃 ─────────
function castDash(player, keys) {
  let dx = 0, dy = 0;
  if (keys.w) dy = -1;
  if (keys.s) dy = 1;
  if (keys.a) { dx = -1; player.facing = -1; }
  if (keys.d) { dx = 1; player.facing = 1; }
  if (dx === 0 && dy === 0) dx = player.facing;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  player.dashVx = (dx / len) * 11;
  player.dashVy = (dy / len) * 11;
  player.dashTimer = 14;
  player.invincible = 18;
  player.state = "dashing";
}

// ───────── Main Component ─────────
export default function ActionBattle({ monsters, playerStats, onFinish }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const { setBattleStats } = useBattle();
  const setBattleStatsRef = useRef(setBattleStats);
  useEffect(() => { setBattleStatsRef.current = setBattleStats; }, [setBattleStats]);
  const keysRef = useRef({ w: false, a: false, s: false, d: false });
  const mouseRef = useRef({ x: W / 2, y: H / 2, left: false, right: false });
  const rafRef = useRef(null);

  // 鎖住 mount 當下的初始值 —— 避免外部 player/monsters 引用變動時重新初始化遊戲
  const initialStatsRef = useRef(playerStats);
  const initialMonstersRef = useRef(monsters);
  // onFinish 用 ref 儲存最新版本，keydown handler 不需要重綁
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  // 空依賴：只在 mount 時建立一次，之後 player/monsters prop 改變也不會重置
  const initState = useCallback(() => {
    const player = createPlayer(initialStatsRef.current);
    const enemies = initialMonstersRef.current.map((m, i) =>
      createEnemy(m, i, initialMonstersRef.current.length),
    );
    stateRef.current = {
      player,
      enemies,
      projectiles: [],
      aoeFx: [],
      particles: [],
      phase: "playing",
      timer: 0,
      lastAttack: 0,
      winData: null,
    };
  }, []); // ← 空依賴，永不重建

  // ───────── Game Loop ─────────
  const tick = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "playing") return;
    const { player, enemies, projectiles, aoeFx, particles } = s;
    const keys = keysRef.current;
    const mouse = mouseRef.current;
    s.timer++;

    // 每 20 幀同步一次 HP/MP 到右側資訊欄
    if (s.timer % 20 === 0) {
      setBattleStatsRef.current({
        hp: Math.ceil(player.hp),
        maxHp: player.maxHp,
        mp: Math.ceil(player.mp),
        maxMp: player.maxMp,
      });
    }

    // ── Player movement ──
    if (player.state !== "dead") {
      // 隨時更新瞄準角度（對準滑鼠游標）
      const pcx = player.x + player.w / 2;
      const pcy = player.y + player.h / 2;
      player.aimAngle = Math.atan2(mouse.y - pcy, mouse.x - pcx);
      // facing 跟著滑鼠左右方向（影響貼圖朝向）
      player.facing = mouse.x >= pcx ? 1 : -1;

      if (player.dashTimer > 0) {
        player.x += player.dashVx;
        player.y += player.dashVy;
        player.dashTimer--;
        if (player.dashTimer <= 0) player.state = "idle";
      } else {
        let mvx = 0, mvy = 0;
        if (keys.w) mvy -= 1;
        if (keys.s) mvy += 1;
        if (keys.a) mvx -= 1;
        if (keys.d) mvx += 1;
        const len = Math.sqrt(mvx * mvx + mvy * mvy) || 1;
        if (mvx !== 0 || mvy !== 0) {
          player.x += (mvx / len) * player.spd;
          player.y += (mvy / len) * player.spd;
          player.state = "moving";
        } else {
          if (player.state === "moving") player.state = "idle";
        }
      }
      // clamp to arena
      player.x = Math.max(0, Math.min(W - player.w, player.x));
      player.y = Math.max(50, Math.min(H - player.h - 10, player.y));

      // invincible countdown
      if (player.invincible > 0) player.invincible--;
      if (player.hurtTimer > 0) player.hurtTimer--;

      // melee attack: left click — hitbox 朝向滑鼠方向
      if (mouse.left && player.atkCool <= 0 && player.state !== "dashing") {
        player.state = "attacking";
        player.atkTimer = player.atkDuration;
        player.atkCool = player.atkCoolMax;
        const na = player.aimAngle;
        const reach = 46;
        const hw = 44, hh = 38;
        player.hitbox = {
          x: pcx + Math.cos(na) * reach - hw / 2,
          y: pcy + Math.sin(na) * reach - hh / 2,
          w: hw, h: hh,
          life: 8,
          angle: na,   // 供繪製用
        };
      }
      if (player.atkCool > 0) player.atkCool--;
      if (player.atkTimer > 0) { player.atkTimer--; if (player.atkTimer <= 0) player.state = "idle"; }

      // hitbox vs enemies
      if (player.hitbox) {
        player.hitbox.life--;
        enemies.forEach((e) => {
          if (e.state === "dead") return;
          if (rectsOverlap(player.hitbox, e)) {
            const { dmg, isCrit } = calcDmg(player.atk, e.def, player.critRate, player.critDmg);
            e.hp -= dmg;
            e.hurtTimer = 8;
            if (e.hp <= 0) { e.state = "dead"; e.deathTimer = 40; player.kills++; player.expGained += e.expReward; player.stonesGained += e.stoneReward; }
            particles.push(makeParticle(e.x + e.w / 2, e.y, isCrit ? `暴擊 ${dmg}` : String(dmg), isCrit ? "#ffcc00" : "#ff8888"));
          }
        });
        if (player.hitbox.life <= 0) player.hitbox = null;
      }

      // skill cooldown tick
      player.skills.forEach((sk) => { if (sk.cur > 0) sk.cur--; });

      // MP regen
      if (s.timer % 90 === 0 && player.mp < player.maxMp) {
        player.mp = Math.min(player.maxMp, player.mp + 3);
      }
    }

    // ── Enemies update ──
    enemies.forEach((e) => {
      if (e.state === "dead") {
        if (e.deathTimer > 0) e.deathTimer--;
        return;
      }
      if (e.hurtTimer > 0) e.hurtTimer--;
      if (e.atkCool > 0) e.atkCool--;

      const d = dist(e, player);
      if (d < e.aggroRange && player.state !== "dead") {
        if (d < e.atkRange) {
          e.state = "attack";
          if (e.atkCool <= 0) {
            e.atkTimer = e.atkDuration;
            e.atkCool = e.atkCoolMax;
          }
        } else {
          e.state = "chase";
          const dx = (player.x + player.w / 2) - (e.x + e.w / 2);
          const dy = (player.y + player.h / 2) - (e.y + e.h / 2);
          const len2 = Math.sqrt(dx * dx + dy * dy) || 1;
          e.x += (dx / len2) * e.spd;
          e.y += (dy / len2) * e.spd;
          e.facing = dx > 0 ? 1 : -1;
        }
      } else {
        e.state = "idle";
      }

      // attack lands mid-swing
      if (e.atkTimer > 0) {
        e.atkTimer--;
        if (e.atkTimer === Math.floor(e.atkDuration * 0.4) && player.invincible <= 0) {
          if (dist(e, player) < e.atkRange + 20) {
            const { dmg } = calcDmg(e.atk, player.def, e.critRate, 150);
            player.hp -= dmg;
            player.hurtTimer = 10;
            player.invincible = 12;
            particles.push(makeParticle(player.x + player.w / 2, player.y, `-${dmg}`, "#ff4444", -2));
          }
        }
      }

      e.x = Math.max(0, Math.min(W - e.w, e.x));
      e.y = Math.max(50, Math.min(H - e.h - 10, e.y));
    });

    // ── Projectiles ──
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
        projectiles.splice(i, 1); continue;
      }
      if (p.fromPlayer) {
        let hit = false;
        enemies.forEach((e) => {
          if (e.state === "dead" || hit) return;
          if (p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h) {
            const { dmg, isCrit } = calcDmg(player.atk * (p.dmgMult || 1), e.def, player.critRate, player.critDmg);
            e.hp -= dmg;
            e.hurtTimer = 8;
            if (e.hp <= 0) { e.state = "dead"; e.deathTimer = 40; player.kills++; player.expGained += e.expReward; player.stonesGained += e.stoneReward; }
            particles.push(makeParticle(e.x + e.w / 2, e.y, isCrit ? `暴擊 ${dmg}` : String(dmg), isCrit ? "#ffcc00" : "#ffe066"));
            hit = true;
          }
        });
        if (hit) { projectiles.splice(i, 1); }
      }
    }

    // ── AoE FX ──
    for (let i = aoeFx.length - 1; i >= 0; i--) {
      aoeFx[i].life--;
      if (aoeFx[i].life <= 0) aoeFx.splice(i, 1);
    }

    // ── Particles ──
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      p.vy *= 0.92;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // ── Win / Lose check ──
    const aliveEnemies = enemies.filter((e) => e.state !== "dead");
    if (aliveEnemies.length === 0) {
      s.phase = "win";
      s.winData = {
        expGained: player.expGained, stonesGained: player.stonesGained, kills: player.kills,
        finalHp: Math.ceil(player.hp), finalMp: Math.ceil(player.mp),
      };
    }
    if (player.hp <= 0) {
      player.hp = 0;
      player.state = "dead";
      s.phase = "lose";
      s.loseData = { finalHp: 0, finalMp: Math.ceil(player.mp) };
    }
  }, []);

  // ───────── Render ─────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;
    if (!s) return;
    const { player, enemies, projectiles, aoeFx, particles } = s;

    // background
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, W, H);
    // ground
    ctx.fillStyle = "#1a2030";
    ctx.fillRect(0, H - 30, W, 30);
    ctx.fillStyle = "#223";
    for (let gx = 0; gx < W; gx += 60) {
      ctx.fillRect(gx, H - 30, 1, 30);
    }

    // AoE rings
    aoeFx.forEach((fx) => {
      if (fx.type === "aoe") {
        const alpha = fx.life / fx.maxLife;
        ctx.save();
        ctx.strokeStyle = `rgba(255,120,30,${alpha * 0.9})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.radius * (1 - alpha * 0.15), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,60,0,${alpha * 0.12})`;
        ctx.fill();
        ctx.restore();
      }
    });

    // Entities
    enemies.forEach((e) => {
      if (e.deathTimer <= 0 && e.state === "dead") return;
      drawEntity(ctx, e, false);
    });
    if (player.state !== "dead") drawEntity(ctx, player, true);

    // Projectiles
    projectiles.forEach((p) => drawProjectile(ctx, p));

    // ── 瞄準線 + 劍光 ──
    if (player.state !== "dead") {
      const pcx = player.x + player.w / 2;
      const pcy = player.y + player.h / 2;
      const aim = player.aimAngle ?? 0;

      // 瞄準虛線（淡）
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(255,220,80,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pcx, pcy);
      ctx.lineTo(pcx + Math.cos(aim) * 80, pcy + Math.sin(aim) * 80);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 攻擊時劍光（旋轉朝滑鼠）
      if (player.hitbox && player.hitbox.life > 0) {
        const alpha = player.hitbox.life / 8;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(pcx, pcy);
        ctx.rotate(aim);
        // 劍身
        ctx.fillStyle = "#ffe066";
        ctx.shadowColor = "#ffe066";
        ctx.shadowBlur = 14;
        ctx.fillRect(12, -4, 48, 8);
        // 劍尖
        ctx.beginPath();
        ctx.moveTo(60, -4);
        ctx.lineTo(72, 0);
        ctx.lineTo(60, 4);
        ctx.fill();
        ctx.restore();
      }
    }

    // Particles
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${p.text.length > 5 ? 13 : 15}px monospace`;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillText(p.text, p.x - ctx.measureText(p.text).width / 2, p.y);
      ctx.restore();
    });

    // ───── HUD ─────
    // Player HP bar
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    drawRoundRect(ctx, 8, 8, 200, 48, 6);
    ctx.fill();
    ctx.fillStyle = "#e8c84a";
    ctx.font = "bold 11px monospace";
    ctx.fillText("HP", 18, 24);
    bar(ctx, 40, 14, 158, 11, player.hp / player.maxHp, "#e84040");
    ctx.fillStyle = "#6ec6f7";
    ctx.fillText("MP", 18, 42);
    bar(ctx, 40, 32, 158, 11, player.mp / player.maxMp, "#4080e0");
    ctx.fillStyle = "#aaa";
    ctx.font = "10px monospace";
    ctx.fillText(`${Math.ceil(player.hp)}/${player.maxHp}`, 42, 23);
    ctx.fillText(`${Math.ceil(player.mp)}/${player.maxMp}`, 42, 41);

    // Skill bar (bottom center)
    const skNames = ["劍氣斬", "烈焰爆", "靈氣療愈", "瞬步閃"];
    const skCosts = [12, 25, 30, 15];
    const skBx = W / 2 - 130;
    const skBy = H - 58;
    player.skills.forEach((sk, i) => {
      const bx = skBx + i * 66;
      const ready = sk.cur <= 0 && player.mp >= skCosts[i];
      ctx.fillStyle = ready ? "rgba(50,40,10,0.85)" : "rgba(20,20,20,0.85)";
      drawRoundRect(ctx, bx, skBy, 60, 46, 5);
      ctx.fill();
      ctx.strokeStyle = ready ? "#e8c84a" : "#444";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // key label
      ctx.fillStyle = ready ? "#ffe066" : "#555";
      ctx.font = "bold 11px monospace";
      ctx.fillText(`[${i + 1}]`, bx + 4, skBy + 13);
      // name
      ctx.fillStyle = ready ? "#ddd" : "#555";
      ctx.font = "10px monospace";
      ctx.fillText(skNames[i], bx + 4, skBy + 26);
      // cooldown overlay
      if (sk.cur > 0) {
        const cdPct = sk.cur / sk.cd;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(bx + 1, skBy + 1, 58, Math.floor(44 * cdPct));
        ctx.fillStyle = "#888";
        ctx.font = "bold 14px monospace";
        const cdSec = Math.ceil(sk.cur / 60);
        ctx.fillText(cdSec, bx + 22, skBy + 29);
      }
      // MP cost
      ctx.fillStyle = "#4080e0";
      ctx.font = "9px monospace";
      ctx.fillText(`${skCosts[i]}mp`, bx + 38, skBy + 42);
    });

    // Kill/enemy count top right
    const alive = enemies.filter((e) => e.state !== "dead").length;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    drawRoundRect(ctx, W - 110, 8, 102, 36, 5);
    ctx.fill();
    ctx.fillStyle = "#e8c84a";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`剩餘妖獸: ${alive}`, W - 104, 30);

    // Invincible flash
    if (player.invincible > 0 && s.timer % 4 < 2) {
      ctx.save();
      ctx.strokeStyle = "rgba(100,200,255,0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(player.x - 2, player.y - 2, player.w + 4, player.h + 4);
      ctx.restore();
    }

    // ── Phase overlays ──
    if (s.phase === "win") {
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ffe066";
      ctx.font = "bold 42px serif";
      ctx.textAlign = "center";
      ctx.fillText("✦ 戰鬥勝利 ✦", W / 2, H / 2 - 30);
      ctx.fillStyle = "#aaa";
      ctx.font = "18px monospace";
      ctx.fillText(`擊殺: ${s.winData.kills}  修為: +${s.winData.expGained}  靈石: +${s.winData.stonesGained}`, W / 2, H / 2 + 10);
      ctx.fillStyle = "#666";
      ctx.font = "14px monospace";
      ctx.fillText("按 [Enter] 確認", W / 2, H / 2 + 44);
      ctx.textAlign = "left";
    }
    if (s.phase === "lose") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#e84040";
      ctx.font = "bold 42px serif";
      ctx.textAlign = "center";
      ctx.fillText("✗ 道心蒙塵 ✗", W / 2, H / 2 - 20);
      ctx.fillStyle = "#666";
      ctx.font = "14px monospace";
      ctx.fillText("按 [Enter] 退出", W / 2, H / 2 + 24);
      ctx.textAlign = "left";
    }
  }, []);

  // ───────── RAF loop ─────────
  const loop = useCallback(() => {
    tick();
    render();
    rafRef.current = requestAnimationFrame(loop);
  }, [tick, render]);

  // ───────── Input handlers ─────────
  useEffect(() => {
    const downHandler = (e) => {
      const k = e.key.toLowerCase();
      const map = { w: "w", a: "a", s: "s", d: "d" };
      if (map[k]) { keysRef.current[map[k]] = true; e.preventDefault(); }

      // Skills 1-4
      const skillIdx = parseInt(k) - 1;
      const s = stateRef.current;
      if (!s || s.phase !== "playing") {
        if (k === "enter") { onFinishRef.current(s?.winData || null); }
        return;
      }
      const { player, enemies, projectiles, aoeFx, particles } = s;
      if (skillIdx >= 0 && skillIdx <= 3 && player.state !== "dead") {
        const sk = player.skills[skillIdx];
        const costs = [12, 25, 30, 15];
        if (sk.cur > 0 || player.mp < costs[skillIdx]) return;
        player.mp -= costs[skillIdx];
        sk.cur = sk.cd;
        if (skillIdx === 0) projectiles.push(castSwordQi(player, mouseRef));
        if (skillIdx === 1) { const fx = castFlameBurst(player, enemies, particles); aoeFx.push(fx); }
        if (skillIdx === 2) castHeal(player, particles);
        if (skillIdx === 3) castDash(player, keysRef.current);
      }
      if (k === "enter" && (s.phase === "win" || s.phase === "lose")) {
        onFinishRef.current(s.phase === "win" ? s.winData : s.loseData || { finalHp: 0, finalMp: 0 });
      }
    };
    const upHandler = (e) => {
      const k = e.key.toLowerCase();
      const map = { w: "w", a: "a", s: "s", d: "d" };
      if (map[k]) keysRef.current[map[k]] = false;
    };
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, []); // ← onFinish 改用 ref，不需要重綁

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const moveHandler = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      mouseRef.current.x = (e.clientX - rect.left) * scaleX;
      mouseRef.current.y = (e.clientY - rect.top) * scaleY;
    };
    const downHandler = (e) => {
      if (e.button === 0) mouseRef.current.left = true;
      if (e.button === 2) mouseRef.current.right = true;
    };
    const upHandler = (e) => {
      if (e.button === 0) mouseRef.current.left = false;
      if (e.button === 2) mouseRef.current.right = false;
    };
    canvas.addEventListener("mousemove", moveHandler);
    canvas.addEventListener("mousedown", downHandler);
    canvas.addEventListener("mouseup", upHandler);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    return () => {
      canvas.removeEventListener("mousemove", moveHandler);
      canvas.removeEventListener("mousedown", downHandler);
      canvas.removeEventListener("mouseup", upHandler);
    };
  }, []);

  // ───────── Mount / unmount ─────────
  useEffect(() => {
    initState();
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // 戰鬥結束，清除右側欄的即時覆蓋
      setBattleStatsRef.current(null);
    };
  }, [initState, loop]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-lg border border-yellow-900/50 cursor-crosshair"
        style={{ maxWidth: "100%", imageRendering: "pixelated" }}
      />
      <div className="text-gray-500 text-xs flex gap-6">
        <span><kbd className="bg-gray-800 px-1 rounded">WASD</kbd> 移動</span>
        <span><kbd className="bg-gray-800 px-1 rounded">左鍵</kbd> 近戰攻擊</span>
        <span><kbd className="bg-gray-800 px-1 rounded">1-4</kbd> 技能</span>
        <span><kbd className="bg-gray-800 px-1 rounded">Enter</kbd> 確認結果</span>
      </div>
    </div>
  );
}
