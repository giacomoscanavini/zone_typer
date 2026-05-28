'use strict';

function drawGrid() {
  const laneWidth = GAME.gridRight - GAME.gridLeft;
  const cellCount = 12;
  const cellWidth = laneWidth / cellCount;

  ctx.save();
  ctx.shadowColor = '#ff38c8';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = '#ff38c8';
  ctx.lineWidth = 2;
  roundRect(GAME.gridLeft - 14, GAME.gridTop - 14, laneWidth + 92, GAME.gridBottom - GAME.gridTop + 28, 18, false, true);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(3, 6, 18, 0.82)';
  roundRect(GAME.gridLeft, GAME.gridTop, laneWidth, GAME.gridBottom - GAME.gridTop, 8, true, false);

  const floorGrad = ctx.createLinearGradient(GAME.gridLeft, GAME.gridTop, GAME.gridRight, GAME.gridBottom);
  floorGrad.addColorStop(0, 'rgba(44, 17, 55, 0.36)');
  floorGrad.addColorStop(0.55, 'rgba(8, 15, 35, 0.82)');
  floorGrad.addColorStop(1, 'rgba(18, 34, 62, 0.56)');
  ctx.fillStyle = floorGrad;
  roundRect(GAME.gridLeft, GAME.gridTop, laneWidth, GAME.gridBottom - GAME.gridTop, 8, true, false);

  for (const lane of GAME.lanes) {
    const danger = getLaneDanger(lane.index);
    const flashAlpha = lane.flashTimer > 0 ? 0.24 : 0;
    const warningAlpha = danger > 0.68 ? (danger - 0.68) * 0.95 : 0;

    ctx.fillStyle = `rgba(53, 246, 255, ${flashAlpha})`;
    ctx.fillRect(GAME.gridLeft, lane.top, laneWidth, lane.bottom - lane.top);

    ctx.fillStyle = `rgba(255, 56, 200, ${warningAlpha})`;
    ctx.fillRect(GAME.gridLeft, lane.top, laneWidth, lane.bottom - lane.top);
  }

  ctx.strokeStyle = 'rgba(53, 246, 255, 0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= cellCount; i += 1) {
    const x = GAME.gridLeft + i * cellWidth;
    ctx.beginPath();
    ctx.moveTo(x, GAME.gridTop);
    ctx.lineTo(x, GAME.gridBottom);
    ctx.stroke();
  }

  for (const lane of GAME.lanes) {
    ctx.strokeStyle = 'rgba(255, 56, 200, 0.62)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GAME.gridLeft, lane.top);
    ctx.lineTo(GAME.gridRight, lane.top);
    ctx.stroke();

    ctx.fillStyle = 'rgba(10, 6, 28, 0.86)';
    ctx.strokeStyle = '#8f4dff';
    ctx.shadowColor = '#8f4dff';
    ctx.shadowBlur = 8;
    roundRect(GAME.gridLeft - 48, lane.y - 19, 34, 38, 8, true, true);
    ctx.shadowBlur = 0;
    drawNeonText(String(lane.index + 1), GAME.gridLeft - 31, lane.y, 20, 'center', '#d8b4ff', 8);
  }

  const lastLane = GAME.lanes[GAME.lanes.length - 1];
  ctx.strokeStyle = 'rgba(255, 56, 200, 0.62)';
  ctx.beginPath();
  ctx.moveTo(GAME.gridLeft, lastLane.bottom);
  ctx.lineTo(GAME.gridRight, lastLane.bottom);
  ctx.stroke();

  ctx.save();
  const zoneGrad = ctx.createLinearGradient(GAME.protectedZoneX, GAME.gridTop, GAME.protectedZoneX + 60, GAME.gridTop);
  zoneGrad.addColorStop(0, 'rgba(53, 246, 255, 0.26)');
  zoneGrad.addColorStop(1, 'rgba(53, 246, 255, 0.02)');
  ctx.fillStyle = zoneGrad;
  ctx.fillRect(GAME.protectedZoneX, GAME.gridTop, 58, GAME.gridBottom - GAME.gridTop);
  ctx.strokeStyle = '#35f6ff';
  ctx.shadowColor = '#35f6ff';
  ctx.shadowBlur = 16;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(GAME.protectedZoneX, GAME.gridTop - 4);
  ctx.lineTo(GAME.protectedZoneX, GAME.gridBottom + 4);
  ctx.stroke();
  ctx.restore();

  drawNeonText('ZONE', GAME.protectedZoneX + 31, GAME.gridTop - 25, 17, 'center', '#35f6ff', 12);
  ctx.restore();
}


function wordTextSize(word) {
  if (word.length > 18) return 12;
  if (word.length > 14) return 14;
  if (word.length > 10) return 16;
  if (word.length > 7) return 18;
  return 22;
}

function drawWords() {
  for (const lane of GAME.lanes) {
    const word = lane.word;
    const typed = GAME.input;
    const isTarget = word.startsWith(typed) && typed.length > 0;
    const danger = getLaneDanger(lane.index);
    const wordX = GAME.protectedZoneX + 63;
    const panelWidth = 184;
    const panelColor = isTarget ? '#ffd34d' : danger > 0.72 ? '#ff38c8' : '#35f6ff';

    ctx.save();
    ctx.fillStyle = isTarget ? 'rgba(255, 211, 77, 0.10)' : 'rgba(5, 8, 24, 0.78)';
    ctx.strokeStyle = panelColor;
    ctx.lineWidth = isTarget ? 2.5 : 1.5;
    ctx.shadowColor = panelColor;
    ctx.shadowBlur = isTarget ? 14 : 7;
    roundRect(wordX - panelWidth / 2, lane.y - 21, panelWidth, 42, 8, true, true);
    ctx.restore();

    drawNeonText(word, wordX, lane.y, wordTextSize(word), 'center', lane.wrongTimer > 0 ? '#ff7a9d' : isTarget ? '#ffd34d' : '#eafcff', 8);
  }
}


function drawInputUnderGrid() {
  const inputText = GAME.input.length > 0 ? GAME.input : 'TYPE A LANE WORD';
  const y = Math.min(GAME.gridBottom + 58, HEIGHT - 28);
  const width = 520;
  const x = WIDTH / 2 - width / 2;
  const color = GAME.input.length > 0 ? '#ffd34d' : '#35f6ff';

  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 24, 0.86)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  roundRect(x, y - 22, width, 44, 10, true, true);
  ctx.restore();

  drawNeonText('INPUT', x + 58, y, 16, 'center', '#9befff', 8);
  drawNeonText(inputText, x + 292, y, GAME.input.length > 16 ? 18 : 24, 'center', color, 12);
}
