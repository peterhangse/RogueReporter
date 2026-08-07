import Phaser from 'phaser';
import { GameState } from '../GameState.js';
import { COLORS, FONTS, SIZES } from '../constants.js';
import { musicManager } from '../audio/MusicManager.js';

export class EditorIntroScene extends Phaser.Scene {
    constructor() { super({ key: 'EditorIntroScene' }); }

    init(data) {
        this.state = data.gameState || new GameState();
    }

    create() {
        musicManager.play('EditorIntroScene');
        this.scene.bringToTop('UIOverlayScene');

        this.cameras.main.fadeIn(400, 0, 0, 0);

        // Desk background
        this.add.rectangle(SIZES.W / 2, SIZES.H / 2, SIZES.W, SIZES.H, 0x1A1208);

        // Editor nameplate
        this.add.rectangle(SIZES.W / 2, 50, SIZES.W, 50, COLORS.PANEL);
        this.add.text(SIZES.W / 2, 50, 'CHIEF EDITOR', {
            fontFamily: 'Playfair Display', fontSize: '24px', color: '#F5C518', fontStyle: 'bold'
        }).setOrigin(0.5);

        // ── Single-page briefing ────────────────────────────────────────
        this.add.text(SIZES.W / 2, 100, "Here's the deal, rookie.", {
            fontFamily: 'Playfair Display', fontSize: '22px', color: '#F5F0E8', fontStyle: 'italic', align: 'center'
        }).setOrigin(0.5);

        // Four actions — compact visual cheat sheet
        const actions = [
            { label: '→ INVESTIGATE', desc: 'Follow the lead — costs time & HEAT', color: '#4A8A6A', bgColor: 0x1D3A1D },
            { label: '← IGNORE',     desc: 'Skip it — safe, learn nothing',       color: '#666666', bgColor: 0x1A1A1A },
            { label: '↑ FAKE',       desc: 'Fabricate — fast but wrecks CREDIBILITY', color: '#CC2222', bgColor: 0x2D0808 },
            { label: '↓ LEAK',       desc: 'Tip off rival — cools HEAT, costs CRED',  color: '#C8AA40', bgColor: 0x2D2810 },
        ];

        actions.forEach((a, i) => {
            const y = 145 + i * 62;
            const bg = this.add.graphics();
            bg.fillStyle(a.bgColor, 0.9);
            bg.fillRoundedRect(160, y, 640, 50, 8);
            bg.lineStyle(1, Phaser.Display.Color.HexStringToColor(a.color).color, 0.5);
            bg.strokeRoundedRect(160, y, 640, 50, 8);

            this.add.text(200, y + 14, a.label, {
                fontFamily: 'Share Tech Mono', fontSize: '15px', color: a.color, fontStyle: 'bold'
            });
            this.add.text(400, y + 14, a.desc, {
                fontFamily: 'Lora', fontSize: '13px', color: '#C8C0A8'
            });
        });

        // Key info: publish-when-you-dare
        this.add.text(SIZES.W / 2, 415, 'You choose when to publish your story.', {
            fontFamily: 'Playfair Display', fontSize: '17px', color: '#F5C518', fontStyle: 'bold', align: 'center'
        }).setOrigin(0.5);
        this.add.text(SIZES.W / 2, 445, 'Push too long and you\'ll get arrested or fired.\nEach round shows two leads — pick one, the other is gone forever.', {
            fontFamily: 'Lora', fontSize: '14px', color: '#888888', align: 'center', lineSpacing: 4
        }).setOrigin(0.5);

        // BEGIN button
        const bw = 380; const bh = 55; const bx = SIZES.W / 2; const by = 530;
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x1D3A1D, 1);
        btnBg.fillRoundedRect(bx - bw / 2, by - bh / 2, bw, bh, 8);
        btnBg.lineStyle(2, COLORS.GREEN, 1);
        btnBg.strokeRoundedRect(bx - bw / 2, by - bh / 2, bw, bh, 8);

        const btn = this.add.text(bx, by, 'GET TO WORK →', { ...FONTS.BUTTON })
            .setOrigin(0.5)
            .setInteractive(new Phaser.Geom.Rectangle(-bw / 2, -bh / 2, bw, bh), Phaser.Geom.Rectangle.Contains);
        btn.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('CardScene', { gameState: this.state });
            });
        });
        btn.on('pointerover', () => btnBg.setAlpha(0.8));
        btn.on('pointerout', () => btnBg.setAlpha(1));
    }
}
