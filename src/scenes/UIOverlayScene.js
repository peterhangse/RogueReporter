import Phaser from 'phaser';
import { SIZES, COLORS } from '../constants.js';
import { musicManager } from '../audio/MusicManager.js';

/**
 * Persistent overlay scene that renders the mute button on top of all others.
 * Launched once from BootScene and stays active for the entire session.
 */
export class UIOverlayScene extends Phaser.Scene {
    constructor() { super({ key: 'UIOverlayScene' }); }

    create() {
        const x = 28;
        const y = SIZES.H - 28;
        const r = 18;

        // Background circle
        this._bg = this.add.graphics();
        this._drawBg(x, y, r, 0.7, 0.4);

        // Speaker icon
        this._icon = this.add.text(x, y,
            musicManager.muted ? '🔇' : '🔊',
            { fontSize: '16px' }
        ).setOrigin(0.5);

        // Hit zone
        const hit = this.add.circle(x, y, r).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
            const muted = musicManager.toggleMute();
            this._icon.setText(muted ? '🔇' : '🔊');
        });
        hit.on('pointerover', () => this._drawBg(x, y, r, 0.9, 0.8));
        hit.on('pointerout', () => this._drawBg(x, y, r, 0.7, 0.4));
    }

    _drawBg(x, y, r, fillAlpha, strokeAlpha) {
        this._bg.clear();
        this._bg.fillStyle(COLORS.PANEL, fillAlpha);
        this._bg.fillCircle(x, y, r);
        this._bg.lineStyle(1, COLORS.YELLOW, strokeAlpha);
        this._bg.strokeCircle(x, y, r);
    }
}
