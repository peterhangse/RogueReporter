import Phaser from 'phaser';
import { COLORS } from '../constants.js';
import { drawDashedLine } from '../utils/drawDashedLine.js';

const LINE_STYLES = {
    strong: { color: COLORS.GREEN, width: 3, dashed: false },
    weak: { color: COLORS.MONEY, width: 2, dashed: true },
    fabricated: { color: COLORS.RED, width: 2, dashed: true },
    dead_end: { color: COLORS.GREY, width: 1, dashed: true },
};

export class ConnectionLine {
    constructor(scene, fromNode, toNode, strength) {
        this.scene = scene;
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.strength = strength;
        this._gfx = scene.add.graphics();

        this.draw();

        // For dead_end connections, draw an X at the midpoint
        if (strength === 'dead_end') this._drawDeadEndX();
    }

    draw() {
        const style = LINE_STYLES[this.strength] || LINE_STYLES.weak;
        this._gfx.clear();
        this._gfx.lineStyle(style.width, style.color, 1);

        const x1 = this.fromNode.x;
        const y1 = this.fromNode.y;
        const x2 = this.toNode.x;
        const y2 = this.toNode.y;

        if (style.dashed) {
            drawDashedLine(this._gfx, x1, y1, x2, y2, 8, 4);
        } else {
            this._gfx.lineBetween(x1, y1, x2, y2);
        }
    }

    _drawDeadEndX() {
        const mx = (this.fromNode.x + this.toNode.x) / 2;
        const my = (this.fromNode.y + this.toNode.y) / 2;
        const s = 8;
        this._gfx.lineStyle(2, COLORS.GREY, 1);
        this._gfx.lineBetween(mx - s, my - s, mx + s, my + s);
        this._gfx.lineBetween(mx + s, my - s, mx - s, my + s);
    }

    destroy() {
        this._gfx.destroy();
    }
}
