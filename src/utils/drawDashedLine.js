// PHASER GOTCHA: Phaser's Graphics API has no native dashed line support.
// Use this utility instead of graphics.lineBetween() for dashed/dotted lines.
// Call graphics.lineStyle() before calling this — it does not set stroke style itself.
export function drawDashedLine(graphics, x1, y1, x2, y2, dashLength = 8, gapLength = 4) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const totalLen = Math.sqrt(dx * dx + dy * dy);
    if (totalLen === 0) return;
    const nx = dx / totalLen;
    const ny = dy / totalLen;
    let traveled = 0;
    let drawing = true;

    while (traveled < totalLen) {
        const segLen = Math.min(drawing ? dashLength : gapLength, totalLen - traveled);
        if (drawing) {
            graphics.lineBetween(
                x1 + nx * traveled, y1 + ny * traveled,
                x1 + nx * (traveled + segLen), y1 + ny * (traveled + segLen)
            );
        }
        traveled += segLen;
        drawing = !drawing;
    }
}
