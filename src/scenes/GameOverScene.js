import Phaser from 'phaser';
import { COLORS, FONTS, SIZES } from '../constants.js';
import { GameState } from '../GameState.js';
import { musicManager } from '../audio/MusicManager.js';

export class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.state = data.gameState;
        this.cause = data.cause; // 'FIRED' | 'ARRESTED'
    }

    create() {
        musicManager.play('GameOverScene');
        this.scene.bringToTop('UIOverlayScene');

        this.cameras.main.fadeIn(300, 0, 0, 0);
        this._buildBackground();
        this._buildCause();
        this._buildLastSwipes();
        this._buildButtons();
    }

    _buildBackground() {
        this.add.rectangle(SIZES.W / 2, SIZES.H / 2, SIZES.W, SIZES.H, COLORS.BG);
        // Red top stripe
        this.add.rectangle(SIZES.W / 2, 30, SIZES.W, 60, COLORS.RED);
        this.add.text(SIZES.W / 2, 30,
            this.cause === 'FIRED' ? 'YOU\'VE BEEN FIRED' : 'YOU\'VE BEEN ARRESTED',
            { fontFamily: 'Playfair Display', fontSize: '20px', color: '#F5F0E8', fontStyle: 'bold' }
        ).setOrigin(0.5);
    }

    _buildCause() {
        const copy = {
            FIRED: 'Your credibility hit zero.\nNo paper will touch your byline.',
            ARRESTED: 'The heat got too high.\nYou\'re in a cell. Story\'s dead.',
        };
        this.add.text(SIZES.W / 2, 130, copy[this.cause], {
            fontFamily: 'Lora', fontSize: '15px', color: '#F5F0E8',
            align: 'center', wordWrap: { width: 600 }, lineSpacing: 6
        }).setOrigin(0.5);
    }

    _buildLastSwipes() {
        this.add.text(SIZES.W / 2, 220, 'YOUR LAST 3 MOVES:', {
            ...FONTS.STAMP, color: '#666666'
        }).setOrigin(0.5);

        const last3 = this.state.swipedCards.slice(-3);
        last3.forEach((s, i) => {
            const y = 260 + i * 70;
            const dirLabel = { right: 'INVESTIGATED', left: 'IGNORED', up: 'FABRICATED', down: 'LEAKED' };
            const dirColor = { right: '#4A8A6A', left: '#666666', up: '#CC2222', down: '#C8AA40' };
            // Card title
            this.add.text(20, y, s.card.title, { ...FONTS.STAMP, color: '#F5F0E8' });
            // Swipe direction
            this.add.text(SIZES.W - 20, y, dirLabel[s.direction] || s.direction.toUpperCase(), {
                ...FONTS.STAMP, color: dirColor[s.direction] || '#888888'
            }).setOrigin(1, 0);
            // Meter consequence summary
            const fx = s.card.swipeEffects?.[s.direction] || {};
            const parts = [];
            if (fx.credibilityChange) parts.push(`CRED ${fx.credibilityChange > 0 ? '+' : ''}${fx.credibilityChange}`);
            if (fx.heatChange) parts.push(`HEAT ${fx.heatChange > 0 ? '+' : ''}${fx.heatChange}`);
            this.add.text(20, y + 20, parts.join('  ') || '—', {
                fontFamily: 'Share Tech Mono', fontSize: '10px', color: '#666666'
            });
        });
    }

    _buildButtons() {
        const makeBtn = (x, label, cb) => {
            const w = 160; const h = 60;
            const gfx = this.add.graphics();
            gfx.fillStyle(COLORS.PANEL, 1);
            gfx.fillRoundedRect(x - w / 2, 510, w, h, 8);
            gfx.lineStyle(2, COLORS.YELLOW, 1);
            gfx.strokeRoundedRect(x - w / 2, 510, w, h, 8);
            const t = this.add.text(x, 540, label, { ...FONTS.BUTTON })
                .setOrigin(0.5).setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
            t.on('pointerdown', cb);
        };

        const fade = (cb) => {
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', cb);
        };

        makeBtn(SIZES.W / 4 + 10, 'TRY AGAIN', () => fade(() => this.scene.start('ConspiracySelectScene')));
        makeBtn((SIZES.W / 4) * 3 - 10, 'MAIN MENU', () => fade(() => this.scene.start('MenuScene')));
    }
}
