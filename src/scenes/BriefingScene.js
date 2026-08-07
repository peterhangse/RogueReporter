import Phaser from 'phaser';
import { GameState } from '../GameState.js';
import { COLORS, FONTS, SIZES } from '../constants.js';
import { musicManager } from '../audio/MusicManager.js';

const TRUTH_LEVEL_COLORS = {
    absurd: { bg: 0x3A1D3A, border: 0x9A4ACA, text: '#9A4ACA' },
    'x-files': { bg: 0x152030, border: 0x4A8ACA, text: '#4A8ACA' },
    'sci-fi': { bg: 0x152515, border: 0x4A8A6A, text: '#4A8A6A' },
    thriller: { bg: 0x3A1515, border: 0xCC2222, text: '#CC2222' },
    serious: { bg: 0x2D2810, border: 0xC8AA40, text: '#C8AA40' },
    subversion: { bg: 0x1A1208, border: 0x666666, text: '#666666' },
};

const BRIEFINGS = {
    trench_coat_kids: {
        title: 'Mayor Svensson is Actually 3 Kids in a Trench Coat',
        body: 'Something is deeply wrong at City Hall. The height inconsistencies. The bulk candy orders. The trench coat in August. Either Mayor Svensson has a severe growth disorder and an unusual snack budget, or your instincts are correct and this town is being governed by children.',
        hints: ['Height records don\'t match driver\'s license', '$800/month in candy — billed to "Office Supplies"', 'Office lights on until 4AM, multiple voices overheard'],
        truthLevel: 'absurd',
    },
};

export class BriefingScene extends Phaser.Scene {
    constructor() { super({ key: 'BriefingScene' }); }

    init(data) {
        this.conspiracyId = data.conspiracyId || 'trench_coat_kids';
        this.briefing = BRIEFINGS[this.conspiracyId];
        this.state = data.gameState;
    }

    create() {
        musicManager.play('BriefingScene');
        this.scene.bringToTop('UIOverlayScene');

        this.events.once('shutdown', () => this.tweens.killAll());
        this.cameras.main.fadeIn(300, 0, 0, 0);

        this._buildMasthead();
        this._buildTruthBadge();
        this._buildTitle();
        this._buildBody();
        this._buildHints();
        this._buildGoal();
        this._buildBeginButton();
    }

    _buildMasthead() {
        this.add.rectangle(SIZES.W / 2, 25, SIZES.W, 50, COLORS.PANEL);
        const border = this.add.graphics();
        border.lineStyle(1, COLORS.YELLOW, 0.5);
        border.lineBetween(0, 50, SIZES.W, 50);
        this.add.text(SIZES.W / 2, 25, '░░  THE DAILY EXPOSÉ — YOUR ASSIGNMENT  ░░', {
            fontFamily: 'Share Tech Mono', fontSize: '10px', color: '#555555', letterSpacing: 2
        }).setOrigin(0.5);
    }

    _buildTruthBadge() {
        const level = this.briefing.truthLevel || 'absurd';
        const colors = TRUTH_LEVEL_COLORS[level] || TRUTH_LEVEL_COLORS.absurd;
        const bg = this.add.graphics();
        const bw = 120; const bh = 28;
        bg.fillStyle(colors.bg, 1);
        bg.fillRoundedRect(SIZES.W / 2 - bw / 2, 62, bw, bh, 14);
        bg.lineStyle(1, colors.border, 1);
        bg.strokeRoundedRect(SIZES.W / 2 - bw / 2, 62, bw, bh, 14);
        this.add.text(SIZES.W / 2, 76, level.toUpperCase(), {
            fontFamily: 'Share Tech Mono', fontSize: '11px', color: colors.text, letterSpacing: 3
        }).setOrigin(0.5);
    }

    _buildTitle() {
        this.add.text(SIZES.W / 2, 105, this.briefing.title, {
            fontFamily: 'Playfair Display', fontSize: '20px', color: '#F5F0E8',
            fontStyle: 'italic', wordWrap: { width: 700 }, align: 'center', lineSpacing: 4
        }).setOrigin(0.5, 0);
    }

    _buildBody() {
        this.add.text(80, 170, this.briefing.body, {
            fontFamily: 'Lora', fontSize: '14px', color: '#C8C0A8',
            wordWrap: { width: 800 }, lineSpacing: 5
        });
    }

    _buildHints() {
        const ruleY = 280;
        const rule = this.add.graphics();
        rule.lineStyle(1, COLORS.YELLOW, 0.3);
        rule.lineBetween(80, ruleY, SIZES.W - 80, ruleY);
        this.add.text(SIZES.W / 2, ruleY - 12, 'WHAT YOU KNOW', {
            fontFamily: 'Share Tech Mono', fontSize: '11px', color: '#666666', letterSpacing: 3
        }).setOrigin(0.5, 1);

        this.briefing.hints.forEach((hint, i) => {
            this.add.text(80, 296 + i * 30, `• ${hint}`, {
                fontFamily: 'Special Elite', fontSize: '13px', color: '#C0B898'
            });
        });
    }

    _buildGoal() {
        const ruleY = 400;
        const rule = this.add.graphics();
        rule.lineStyle(1, COLORS.YELLOW, 0.3);
        rule.lineBetween(80, ruleY, SIZES.W - 80, ruleY);
        this.add.text(SIZES.W / 2, ruleY - 12, 'YOUR GOAL', {
            fontFamily: 'Share Tech Mono', fontSize: '11px', color: '#666666', letterSpacing: 3
        }).setOrigin(0.5, 1);

        this.add.text(80, 414, 'Investigate leads. Build your evidence board.', {
            fontFamily: 'Share Tech Mono', fontSize: '13px', color: '#4A8A6A', wordWrap: { width: 800 }
        });
        this.add.text(80, 440, 'Publish when you\'re ready — or when time runs out.', {
            fontFamily: 'Lora', fontSize: '14px', color: '#888888', wordWrap: { width: 800 }, fontStyle: 'italic'
        });
    }

    _buildBeginButton() {
        const w = 380; const h = 55; const x = SIZES.W / 2; const y = 530;
        const bg = this.add.graphics();
        bg.fillStyle(0x1D3A1D, 1);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        bg.lineStyle(2, COLORS.GREEN, 1);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);

        const t = this.add.text(x, y, 'BEGIN INVESTIGATION →', { ...FONTS.BUTTON })
            .setOrigin(0.5)
            .setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
        t.on('pointerdown', () => {
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('EditorIntroScene', { gameState: this.state, conspiracyId: this.conspiracyId });
            });
        });
        t.on('pointerover', () => bg.setAlpha(0.8));
        t.on('pointerout', () => bg.setAlpha(1));
    }
}
