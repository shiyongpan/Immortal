// ===== 常數 =====
export const W = 800;
export const H = 460;

// ===== 工廠函數 =====
export function createPlayer(stats) {
  return {
    x: 160, y: H / 2 - 24,
    w: 32, h: 44,
    vx: 0, vy: 0,
    hp: Number(stats.current_hp) || 100,
    maxHp: Number(stats.max_hp) || 100,
    mp: Number(stats.current_mp) || 50,
    maxMp: Number(stats.max_mp) || 50,
    atk: Number(stats.attack) || 15,
    def: Number(stats.defense) || 5,
    spd: Math.max(2, Number(stats.speed) || 5) * 0.55,
    critRate: Number(stats.critical_rate) || 5,
    critDmg: Number(stats.critical_damage) || 150,
    facing: 1,
    state: 'idle',       // idle | moving | attacking | hurt | dead | dashing
    atkTimer: 0, atkDuration: 14, atkCool: 0, atkCoolMax: 22,
    hurtTimer: 0,
    dashTimer: 0, dashCool: 0, dashCoolMax: 45, dashVx: 0, dashVy: 0,
    hitbox: null,        // active attack hitbox { x, y, w, h, life }
    skills: [
      { name: '劍氣斬', mpCost: 12, cd: 80, cur: 0, type: 'projectile' },
      { name: '烈焰爆', mpCost: 25, cd: 200, cur: 0, type: 'aoe' },
      { name: '靈氣療愈', mpCost: 30, cd: 280, cur: 0, type: 'heal' },
      { name: '瞬步閃', mpCost: 15, cd: 100, cur: 0, type: 'dash' },
    ],
    invincible: 0,
    expGained: 0,
    stonesGained: 0,
    kills: 0,
  };
}

export function createEnemy(monster, index, total) {
  const spread = 220;
  const cx = W * 0.62 + (index % 2) * 120;
  const cy = H / 2 - 24 + Math.floor(index / 2) * 90 - (total > 2 ? 45 : 0);
  return {
    id: monster.id,
    name: monster.monster_name,
    x: cx + (Math.random() - 0.5) * 40,
    y: Math.max(60, Math.min(H - 110, cy + (Math.random() - 0.5) * 40)),
    w: 36, h: 46,
    hp: parseInt(monster.max_hp) || 100,
    maxHp: parseInt(monster.max_hp) || 100,
    atk: Number(monster.attack) || 10,
    def: Number(monster.defense) || 3,
    spd: Math.max(0.8, Number(monster.speed) || 3) * 0.42,
    critRate: 5,
    expReward: parseInt(monster.exp_reward) || 50,
    stoneReward: Number(monster.spirit_stone_reward) || 10,
    state: 'idle',     // idle | chase | attack | hurt | dead
    atkTimer: 0, atkDuration: 22, atkCool: 0, atkCoolMax: 100,
    hurtTimer: 0,
    aggroRange: 280,
    atkRange: 52,
    facing: -1,
    deathTimer: 0,
  };
}

// ===== 碰撞 =====
export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

export function dist(a, b) {
  const dx = (a.x + a.w / 2) - (b.x + b.w / 2);
  const dy = (a.y + a.h / 2) - (b.y + b.h / 2);
  return Math.sqrt(dx * dx + dy * dy);
}

// ===== 傷害計算 =====
export function calcDmg(atk, def, critRate, critDmgPct) {
  const isCrit = Math.random() * 100 < critRate;
  let dmg = Math.max(1, atk - def + Math.floor(Math.random() * 5));
  if (isCrit) dmg = Math.floor(dmg * critDmgPct / 100);
  return { dmg, isCrit };
}

// ===== 粒子 =====
export function makeParticle(x, y, text, color, vy = -1.8) {
  return { x, y, text, color, vy, vx: (Math.random() - 0.5) * 1.2, life: 55, maxLife: 55 };
}
