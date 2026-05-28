'use strict';

function drawMonsterEye(x, y, color = '#fff6b0') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#050515';
  ctx.beginPath();
  ctx.arc(x + 1, y, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMonsterSprite(monster, color) {
  const image = SPRITES[monster.typeKey];
  const size = monster.typeKey === 'runner' ? 58 : monster.typeKey === 'tank' ? 68 : monster.typeKey === 'elite' ? 66 : 64;

  if (image && image.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
    return;
  }

  // Fallback if image assets are not available.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, monster.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawMonsterHealth(monster) {
  if (monster.maxHp <= 1) return;

  const width = 34;
  const height = 5;
  const x = -width / 2;
  const y = monster.radius + 22;
  ctx.save();
  ctx.fillStyle = 'rgba(2, 5, 15, 0.82)';
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  roundRect(x, y, width, height, 3, true, true);
  ctx.fillStyle = monster.hp === monster.maxHp ? '#35f6ff' : '#ff4b6e';
  roundRect(x + 1, y + 1, (width - 2) * (monster.hp / monster.maxHp), height - 2, 2, true, false);
  ctx.restore();
}

function drawShieldBreakCue(monster) {
  if (monster.typeKey !== 'tank' || monster.hp !== monster.maxHp) return;

  const pulse = 0.55 + Math.sin(performance.now() / 120) * 0.18;
  ctx.save();
  ctx.strokeStyle = `rgba(53, 246, 255, ${pulse})`;
  ctx.shadowColor = '#35f6ff';
  ctx.shadowBlur = 18;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, monster.radius + 18, -0.6, Math.PI * 1.65);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, monster.radius + 22, Math.PI * 0.25, Math.PI * 0.88);
  ctx.stroke();
  ctx.restore();
}

function drawMonsterLabel(monster, color) {
  const labels = {
    basic: 'DEMON',
    runner: 'BOT',
    tank: monster.hp === monster.maxHp ? 'SHIELD' : 'TANK',
    elite: 'SKULL',
  };

  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = 'rgba(5, 8, 24, 0.72)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  roundRect(-28, -42, 56, 16, 4, true, true);
  ctx.restore();
  drawNeonText(labels[monster.typeKey], 0, -34, 9, 'center', color, 5);
}

function drawMonsters() {
  for (const monster of GAME.monsters) {
    if (!monster.active) continue;

    const danger = getLaneDanger(monster.laneIndex);
    const baseColor = monster.typeKey === 'basic' ? '#ff3e55'
      : monster.typeKey === 'runner' ? '#35dfff'
      : monster.typeKey === 'tank' ? '#ffd34d'
      : '#c084fc';
    const color = danger > 0.72 ? '#ff2f6d' : baseColor;
    const bob = Math.sin(performance.now() / 170 + monster.x * 0.05) * 2;

    ctx.save();
    ctx.translate(monster.x, monster.y + bob);


    drawMonsterSprite(monster, color);
    drawShieldBreakCue(monster);
    drawMonsterHealth(monster);

    ctx.restore();
  }
}
