import Phaser from 'phaser';
import { GameState } from '../GameState.js';
import { COLORS, FONTS, SIZES } from '../constants.js';
import { musicManager } from '../audio/MusicManager.js';

export class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        musicManager.play('MenuScene');
        this.scene.bringToTop('UIOverlayScene');

        const hasSave = !!localStorage.getItem('rr_gamestate');

        // Scene lifecycle cleanup
        this.events.once('shutdown', () => this.tweens.killAll());

        // Fade in on arrival
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // Background
        this.add.rectangle(SIZES.W / 2, SIZES.H / 2, SIZES.W, SIZES.H, COLORS.BG);

        // NEWSPAPER BACKGROUND TEXTURE
        const paper = this.add.graphics();
        paper.lineStyle(1, 0x1E1810, 0.9);
        for (let y = 60; y < SIZES.H - 60; y += 14) {
            paper.lineBetween(20, y, SIZES.W - 20, y);
        }
        paper.lineStyle(1, 0x222018, 0.7);
        paper.lineBetween(SIZES.W / 2, 80, SIZES.W / 2, SIZES.H - 80);
        paper.lineBetween(SIZES.W / 3, 220, SIZES.W / 3, SIZES.H - 120);
        paper.lineBetween((SIZES.W * 2) / 3, 220, (SIZES.W * 2) / 3, SIZES.H - 120);

        // Masthead rule
        this.add.text(SIZES.W / 2, 55, 'THE DAILY EXPOSÉ', {
            fontFamily: 'Share Tech Mono', fontSize: '14px', color: '#555555', letterSpacing: 6
        }).setOrigin(0.5);
        const rule = this.add.graphics();
        rule.lineStyle(1, COLORS.YELLOW, 0.6);
        rule.lineBetween(30, 73, SIZES.W - 30, 73);
        rule.lineStyle(1, COLORS.YELLOW, 0.3);
        rule.lineBetween(30, 77, SIZES.W - 30, 77);

        // Title
        this.add.text(60, 95, 'ROGUE', {
            fontFamily: 'Playfair Display', fontSize: '60px', color: '#F5C518', fontStyle: 'bold'
        });
        this.add.text(60, 155, 'REPORTER', {
            fontFamily: 'Playfair Display', fontSize: '60px', color: '#F5C518', fontStyle: 'bold'
        });

        // Tagline
        this.add.text(62, 230, 'Conspiracy journalism roguelike', {
            fontFamily: 'Lora', fontSize: '16px', color: '#C0B898', fontStyle: 'italic'
        });

        // Fake teaser headline
        this.add.text(62, 260, '"MAYOR SVENSSON IS THREE CHILDREN\nIN A TRENCH COAT" — sources say', {
            fontFamily: 'Special Elite', fontSize: '12px', color: '#666666', lineSpacing: 2
        });

        // Start button
        this._makeButton(SIZES.W / 2, 390, '📰  START INVESTIGATION', 0x1D3A1D, COLORS.GREEN, () => {
            this._fadeToScene('ConspiracySelectScene');
        });

        // Continue button (only if save exists)
        if (hasSave) {
            this._makeButton(SIZES.W / 2, 465, '📂  CONTINUE', COLORS.PANEL, COLORS.GREY, () => {
                this._fadeToScene('CardScene', { gameState: GameState.load() || GameState.fresh() });
            });
        }

        // Version footer
        this.add.text(SIZES.W / 2, SIZES.H - 20, 'v0.1 DEMO', {
            fontFamily: 'Share Tech Mono', fontSize: '10px', color: '#444444'
        }).setOrigin(0.5);
    }

    _fadeToScene(key, data = {}) {
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(key, data);
        });
    }

    _makeButton(x, y, label, bgColor, borderColor, callback) {
        const w = 380; const h = 55;
        const bg = this.add.graphics();
        bg.fillStyle(bgColor, 1);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        bg.lineStyle(2, borderColor, 1);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);

        const t = this.add.text(x, y, label, { ...FONTS.BUTTON, align: 'center' })
            .setOrigin(0.5)
            .setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
        t.on('pointerdown', callback);
        t.on('pointerover', () => bg.setAlpha(0.8));
        t.on('pointerout', () => bg.setAlpha(1));
    }
}
