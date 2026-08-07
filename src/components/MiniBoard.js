// ── MINI BOARD ──────────────────────────────────────────────────────────
// Compact read-only conspiracy board rendered inside the CardScene.
// Shows nodes, connections, and ghost lines — grows as the player investigates.

import { COLORS, NODE_COLORS, FONTS } from '../constants.js';
import { drawDashedLine } from '../utils/drawDashedLine.js';

export class MiniBoard {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x - Left edge
     * @param {number} y - Top edge
     * @param {number} w - Width
     * @param {number} h - Height
     */
    constructor(scene, x, y, w, h) {
        this.scene = scene;
        this.bounds = { x, y, w, h };
        this._nodeSprites = {};   // nodeId -> { circle, label, glow }
        this._connectionLines = [];
        this._ghostGfx = scene.add.graphics();

        this._buildBackground();
    }

    _buildBackground() {
        const { x, y, w, h } = this.bounds;
        // Cork board base
        this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x1C1410);

        // Dot grid texture
        const dots = this.scene.add.graphics();
        for (let dx = 16; dx < w; dx += 16) {
            for (let dy = 16; dy < h; dy += 16) {
                dots.fillStyle(0x2A1E14, 0.7);
                dots.fillCircle(x + dx, y + dy, 0.8);
            }
        }

        // Subtle border
        const border = this.scene.add.graphics();
        border.lineStyle(1, COLORS.YELLOW, 0.3);
        border.strokeRect(x, y, w, h);
    }

    /**
     * Map a board-data position (designed for 960×250 space) into the mini board area.
     */
    _mapPos(bx, by) {
        // Board data x: 80–880 range, y: 30–250 range
        const nx = (bx - 80) / 800;
        const ny = (by - 20) / 230;
        return {
            x: this.bounds.x + 30 + nx * (this.bounds.w - 60),
            y: this.bounds.y + 20 + ny * (this.bounds.h - 40),
        };
    }

    /**
     * Set the board data and game state, then render all known nodes/connections.
     */
    init(boardData, gameState) {
        this.boardData = boardData;
        this.gameState = gameState;

        // Render all nodes (locked ones are hidden, unlocked ones visible)
        boardData.nodes.forEach(nd => {
            const unlocked = gameState.boardNodes.includes(nd.id);
            this._createNode(nd, unlocked);
        });

        this._drawGhostLines();
        this._drawConnections();
    }

    _createNode(nodeData, unlocked) {
        const pos = this._mapPos(nodeData.x, nodeData.y);
        const colors = NODE_COLORS[nodeData.type] || NODE_COLORS.evidence;
        const r = 14;

        // Glow ring (hidden until animated)
        const glow = this.scene.add.graphics();
        glow.lineStyle(2, colors.border, 0.6);
        glow.strokeCircle(pos.x, pos.y, r + 4);
        glow.setAlpha(0);

        // Circle
        const circle = this.scene.add.graphics();
        if (unlocked) {
            const isFabricated = this.gameState.fabricatedNodes.includes(nodeData.id);
            if (isFabricated) {
                circle.lineStyle(2, colors.border, 0.7);
                drawDashedLine(circle, pos.x - r, pos.y, pos.x + r, pos.y, 3, 3);
                circle.strokeCircle(pos.x, pos.y, r);
            } else {
                circle.fillStyle(colors.fill, 1);
                circle.fillCircle(pos.x, pos.y, r);
                circle.lineStyle(1.5, colors.border, 0.9);
                circle.strokeCircle(pos.x, pos.y, r);
            }
        } else {
            circle.lineStyle(1, 0x444444, 0.15);
            circle.strokeCircle(pos.x, pos.y, r);
        }

        // Label
        const label = this.scene.add.text(pos.x, pos.y + r + 8,
            unlocked ? (nodeData.label || nodeData.id) : '',
            { fontFamily: 'Share Tech Mono', fontSize: '8px', color: '#888', align: 'center' }
        ).setOrigin(0.5);

        this._nodeSprites[nodeData.id] = { circle, label, glow, pos, nodeData, unlocked };
    }

    _drawGhostLines() {
        this._ghostGfx.clear();
        if (!this.boardData || !this.gameState) return;

        const unlocked = this.gameState.boardNodes;
        this.boardData.validConnections.forEach(([a, b]) => {
            if (!unlocked.includes(a) || !unlocked.includes(b)) return;
            // Skip if already connected
            const connected = this.gameState.connections.some(
                c => (c.fromId === a && c.toId === b) || (c.fromId === b && c.toId === a)
            );
            if (connected) return;

            const pA = this._nodeSprites[a]?.pos;
            const pB = this._nodeSprites[b]?.pos;
            if (!pA || !pB) return;

            this._ghostGfx.lineStyle(1, 0xFFFFFF, 0.1);
            drawDashedLine(this._ghostGfx, pA.x, pA.y, pB.x, pB.y, 3, 5);
        });
    }

    _drawConnections() {
        if (!this.gameState) return;
        this.gameState.connections.forEach(conn => {
            this._drawConnection(conn.fromId, conn.toId, conn.strength);
        });
    }

    _drawConnection(fromId, toId, strength) {
        const pA = this._nodeSprites[fromId]?.pos;
        const pB = this._nodeSprites[toId]?.pos;
        if (!pA || !pB) return;

        const colors = {
            strong: 0x4A8A6A, weak: 0xC8AA40,
            fabricated: 0xCC2222, dead_end: 0x666666,
        };
        const gfx = this.scene.add.graphics();
        gfx.lineStyle(2, colors[strength] || 0x666666, 0.7);
        gfx.lineBetween(pA.x, pA.y, pB.x, pB.y);
        this._connectionLines.push(gfx);
    }

    /**
     * Animate a new node appearing on the board.
     * Returns a Promise that resolves when animation is done.
     */
    animateNewNode(nodeId) {
        const sprite = this._nodeSprites[nodeId];
        if (!sprite || sprite.unlocked) return;

        const nd = sprite.nodeData;
        const pos = sprite.pos;
        const colors = NODE_COLORS[nd.type] || NODE_COLORS.evidence;
        const isFabricated = this.gameState.fabricatedNodes.includes(nodeId);
        const r = 14;

        // Rebuild the circle as filled/visible
        sprite.circle.clear();
        if (isFabricated) {
            sprite.circle.lineStyle(2, colors.border, 0.7);
            sprite.circle.strokeCircle(pos.x, pos.y, r);
        } else {
            sprite.circle.fillStyle(colors.fill, 1);
            sprite.circle.fillCircle(pos.x, pos.y, r);
            sprite.circle.lineStyle(1.5, colors.border, 0.9);
            sprite.circle.strokeCircle(pos.x, pos.y, r);
        }
        sprite.circle.setScale(0);
        sprite.label.setText(nd.label || nd.id);
        sprite.unlocked = true;

        // Pin animation: scale up with bounce
        this.scene.tweens.add({
            targets: sprite.circle,
            scaleX: 1, scaleY: 1,
            duration: 350, ease: 'Back.out',
        });

        // Glow pulse
        sprite.glow.setAlpha(1);
        this.scene.tweens.add({
            targets: sprite.glow,
            alpha: 0, scaleX: 1.5, scaleY: 1.5,
            duration: 600, ease: 'Sine.Out',
        });

        // Redraw ghost lines (new connections may be possible)
        this.scene.time.delayedCall(400, () => this._drawGhostLines());
    }

    /** Dim the board (during card resolve overlay). */
    dim(alpha = 0.4) {
        // Iterate all children and dim
        Object.values(this._nodeSprites).forEach(s => {
            s.circle.setAlpha(alpha);
            s.label.setAlpha(alpha);
        });
        this._ghostGfx.setAlpha(alpha);
        this._connectionLines.forEach(g => g.setAlpha(alpha));
    }

    /** Restore full brightness. */
    undim() {
        Object.values(this._nodeSprites).forEach(s => {
            s.circle.setAlpha(1);
            s.label.setAlpha(1);
        });
        this._ghostGfx.setAlpha(1);
        this._connectionLines.forEach(g => g.setAlpha(1));
    }

    /** Full refresh after state changes. */
    refresh() {
        this._drawGhostLines();
    }
}
