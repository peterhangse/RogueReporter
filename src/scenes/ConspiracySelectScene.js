import Phaser from 'phaser';
import { COLORS, FONTS, SIZES } from '../constants.js';
import { GameState } from '../GameState.js';
import { musicManager } from '../audio/MusicManager.js';

export class ConspiracySelectScene extends Phaser.Scene {
    constructor() { super('ConspiracySelectScene'); }

    create() {
        musicManager.play('ConspiracySelectScene');
        this.scene.bringToTop('UIOverlayScene');

        this.cameras.main.fadeIn(300, 0, 0, 0);
        this._buildHeader();
        this._buildCards();
    }

    _buildHeader() {
        this.add.rectangle(SIZES.W / 2, 35, SIZES.W, 70, COLORS.PANEL);
        this.add.text(SIZES.W / 2, 24, 'CHOOSE YOUR INVESTIGATION', {
            fontFamily: 'Playfair Display', fontSize: '20px',
            color: '#F5C518', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(SIZES.W / 2, 52, 'EACH CASE IS A UNIQUE RUN. PICK ONE TO BEGIN.', {
            fontFamily: 'Share Tech Mono', fontSize: '11px', color: '#888888'
        }).setOrigin(0.5);
    }

    _buildCards() {
        const conspiracies = [
            { id: 'trench_coat_kids', title: 'THE TRENCH COAT KIDS', teaser: 'The mayor is not who you think.', available: true, accentColor: 0xC8AA40, bgColor: 0x2D2810 },
            { id: 'alien_zoning', title: 'ALIEN ZONING BOARD', teaser: 'Follow the permits.', available: false, accentColor: 0x4A8ACA, bgColor: 0x152030 },
            { id: 'time_loop', title: 'THE TIME LOOP', teaser: 'Something keeps repeating.', available: false, accentColor: 0x9A4ACA, bgColor: 0x251530 },
        ];

        const cardW = 270;
        const cardH = 420;
        const gap = 30;
        const totalW = conspiracies.length * cardW + (conspiracies.length - 1) * gap;
        const startX = (SIZES.W - totalW) / 2 + cardW / 2;
        const cardY = 70 + cardH / 2 + 30;

        conspiracies.forEach((c, i) => {
            const x = startX + i * (cardW + gap);
            const alpha = c.available ? 1 : 0.4;
            const bg = this.add.graphics();
            bg.fillStyle(c.bgColor, 1);
            bg.fillRoundedRect(x - cardW / 2, cardY - cardH / 2, cardW, cardH, 8);
            bg.lineStyle(2, c.available ? c.accentColor : COLORS.GREY, 0.6);
            bg.strokeRoundedRect(x - cardW / 2, cardY - cardH / 2, cardW, cardH, 8);
            bg.setAlpha(alpha);

            this.add.text(x, cardY - 60, c.title, {
                fontFamily: 'Playfair Display', fontSize: '18px', color: '#F5C518', fontStyle: 'bold',
                wordWrap: { width: cardW - 40 }, align: 'center'
            }).setOrigin(0.5).setAlpha(alpha);

            this.add.text(x, cardY + 10, c.teaser, {
                fontFamily: 'Lora', fontSize: '14px', color: '#E0D8C0', wordWrap: { width: cardW - 40 }, align: 'center'
            }).setOrigin(0.5).setAlpha(alpha);

            if (!c.available) {
                this.add.text(x, cardY + 80, '[COMING IN PHASE 1]', {
                    fontFamily: 'Share Tech Mono', fontSize: '11px', color: '#666666'
                }).setOrigin(0.5);
            }

            if (c.available) {
                const hitArea = this.add.rectangle(x, cardY, cardW, cardH, 0x000000, 0)
                    .setInteractive();
                hitArea.on('pointerdown', () => {
                    this.cameras.main.fadeOut(200, 0, 0, 0);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        const gs = GameState.fresh();
                        gs.conspiracyId = c.id;
                        this.scene.start('BriefingScene', { conspiracyId: c.id, gameState: gs });
                    });
                });
                hitArea.on('pointerover', () => bg.setAlpha(0.8));
                hitArea.on('pointerout', () => bg.setAlpha(1));
            }
        });
    }
}
