// ── HEAT OVERLAY ────────────────────────────────────────────────────────
// Extracted from CardScene: progressive red vignette that intensifies with heat.

import { SIZES } from '../constants.js';

export class HeatOverlay {
    constructor(scene) {
        this._gfx = scene.add.graphics();
        this._gfx.setDepth(0);
    }

    update(heat) {
        this._gfx.clear();
        if (heat <= 30) return;

        let alpha;
        if (heat <= 50)      alpha = (heat - 30) / 100;
        else if (heat <= 70) alpha = 0.2 + (heat - 50) / 60;
        else if (heat <= 85) alpha = 0.5 + (heat - 70) / 60;
        else                 alpha = 0.7 + (heat - 85) / 60;
        alpha = Math.min(alpha, 0.85);

        const w = SIZES.W;
        const h = SIZES.H;
        const edge = 120 + (heat - 30) * 2;

        // Top
        this._gfx.fillGradientStyle(0xCC2222, 0xCC2222, 0xCC2222, 0xCC2222, alpha, alpha, 0, 0);
        this._gfx.fillRect(0, 0, w, edge);
        // Bottom
        this._gfx.fillGradientStyle(0xCC2222, 0xCC2222, 0xCC2222, 0xCC2222, 0, 0, alpha, alpha);
        this._gfx.fillRect(0, h - edge, w, edge);
        // Left
        this._gfx.fillGradientStyle(0xCC2222, 0xCC2222, 0xCC2222, 0xCC2222, alpha, 0, 0, alpha);
        this._gfx.fillRect(0, 0, edge, h);
        // Right
        this._gfx.fillGradientStyle(0xCC2222, 0xCC2222, 0xCC2222, 0xCC2222, 0, alpha, alpha, 0);
        this._gfx.fillRect(w - edge, 0, edge, h);
    }

    destroy() {
        this._gfx.destroy();
    }
}
