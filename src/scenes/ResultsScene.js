import Phaser from 'phaser';
import { GameState } from '../GameState.js';
import { getScore, getGrade, getNarrative } from '../utils/scoreCalculator.js';
import { COLORS, FONTS, SIZES } from '../constants.js';
import { musicManager } from '../audio/MusicManager.js';
import { BALANCE } from '../balanceConfig.js';

export class ResultsScene extends Phaser.Scene {
    constructor() { super({ key: 'ResultsScene' }); }

    init(data) {
        this.state = data.gameState;
        this.score = getScore(this.state);
        this.grade = getGrade(this.score);
    }

    create() {
        musicManager.play('ResultsScene');
        this.scene.bringToTop('UIOverlayScene');

        this.events.once('shutdown', () => this.tweens.killAll());
        this.cameras.main.fadeIn(400, 0, 0, 0);

        this._buildMasthead();
        this._buildGradeStamp();
        this._buildHeadline();
        this._buildScoreBreakdown();
        this._buildFinalScore();
        this._buildButtons();
    }

    _buildMasthead() {
        this.add.rectangle(SIZES.W / 2, 25, SIZES.W, 50, 0x0D0B08);
        const rule = this.add.graphics();
        rule.lineStyle(2, COLORS.YELLOW, 0.8);
        rule.lineBetween(10, 48, SIZES.W - 10, 48);
        rule.lineStyle(1, COLORS.YELLOW, 0.3);
        rule.lineBetween(10, 52, SIZES.W - 10, 52);
        this.add.text(SIZES.W / 2, 25, 'THE DAILY EXPOSÉ', {
            fontFamily: 'Playfair Display', fontSize: '20px', color: '#F5C518', fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    _buildGradeStamp() {
        const stamp = this.add.text(SIZES.W / 2, 110, this.grade.label, {
            fontFamily: 'Playfair Display', fontSize: '64px',
            color: this.grade.color, fontStyle: 'bold'
        }).setOrigin(0.5).setAngle(-8).setAlpha(0);

        const gfx = this.add.graphics();
        gfx.x = SIZES.W / 2;
        gfx.y = 110;
        gfx.lineStyle(4, Phaser.Display.Color.HexStringToColor(this.grade.color).color, 0.8);
        gfx.strokeRect(-140, -38, 280, 80);
        gfx.setAngle(-8);

        this.tweens.add({
            targets: [stamp, gfx], alpha: 1, scaleX: { from: 1.3, to: 1 }, scaleY: { from: 1.3, to: 1 },
            duration: 250, ease: 'Cubic.Out', delay: 200
        });
    }

    _buildHeadline() {
        const conspiracy = this.cache.json.get('conspiracy-trench-coat-kids');
        const title = conspiracy?.name || 'Mayor Was 3 Kids in a Trench Coat';
        this.add.text(SIZES.W / 2, 170, title.toUpperCase(), {
            fontFamily: 'Playfair Display', fontSize: '16px', color: '#F5F0E8',
            fontStyle: 'bold', wordWrap: { width: 600 }, align: 'center', lineSpacing: 3
        }).setOrigin(0.5, 0);

        const narrative = getNarrative(this.grade.label);
        this.add.text(SIZES.W / 2, 200, narrative, {
            fontFamily: 'Lora', fontSize: '13px', color: '#C8C0A8',
            fontStyle: 'italic', wordWrap: { width: 600 }, align: 'center', lineSpacing: 4
        }).setOrigin(0.5, 0);
    }

    _buildScoreBreakdown() {
        const nodeCount = this.state.boardNodes.length;
        const valid = this.state.connections.filter(c => c.strength !== 'dead_end');
        const strong = valid.filter(c => c.strength === 'strong').length;
        const weak = valid.filter(c => c.strength === 'weak').length;
        const fabricated = this.state.connections.filter(c => c.strength === 'fabricated').length;
        const deadEnds = this.state.connections.filter(c => c.strength === 'dead_end').length;

        const rule = this.add.graphics();
        rule.lineStyle(1, COLORS.YELLOW, 0.3);
        rule.lineBetween(20, 235, SIZES.W - 20, 235);

        const s = BALANCE.score;
        const rows = [
            ['CREDIBILITY', `${Math.round(this.state.credibility)}%`, `${Math.round(this.state.credibility * s.credibilityWeight)} pts`],
            ['NODES', `${nodeCount}`, `${nodeCount * s.nodeWeight} pts`],
            ['STRONG LINKS', `${strong}`, `${strong * s.strongWeight} pts`],
            ['WEAK LINKS', `${weak}`, `${weak * s.weakWeight} pts`],
            ['FABRICATED', `${fabricated}`, `−${fabricated * s.fabricatedPenalty} pts`],
            ['DEAD ENDS', `${deadEnds}`, `−${deadEnds * s.deadEndPenalty} pts`],
        ];

        rows.forEach(([label, value, pts], i) => {
            const y = 248 + i * 24;
            this.add.text(40, y, label, { ...FONTS.STAMP, color: '#666666' });
            this.add.text(SIZES.W / 2, y, value, { ...FONTS.METER, align: 'center' }).setOrigin(0.5, 0);
            this.add.text(SIZES.W - 40, y, pts, { ...FONTS.METER, align: 'right' }).setOrigin(1, 0);
        });

        const divider = this.add.graphics();
        divider.lineStyle(1, COLORS.YELLOW, 0.3);
        divider.lineBetween(40, 396, SIZES.W - 40, 396);
    }

    _buildFinalScore() {
        this.add.text(40, 408, 'FINAL SCORE', { ...FONTS.STAMP, color: '#666666' });
        const scoreText = this.add.text(SIZES.W - 40, 404, '0', { ...FONTS.SCORE }).setOrigin(1, 0);

        this.tweens.addCounter({
            from: 0, to: this.score, duration: 800, ease: 'Cubic.Out', delay: 400,
            onUpdate: (tween) => { scoreText.setText(Math.round(tween.getValue()).toLocaleString()); }
        });

        const barBg = this.add.graphics();
        barBg.fillStyle(0x333333, 1);
        barBg.fillRoundedRect(40, 456, SIZES.W - 80, 10, 5);

        const maxScore = 2000;
        const fillW = Math.min(1, this.score / maxScore) * (SIZES.W - 80);
        const barFill = this.add.graphics();
        barFill.fillStyle(Phaser.Display.Color.HexStringToColor(this.grade.color).color, 1);
        this.tweens.add({
            targets: { w: 0 }, w: fillW, duration: 800, ease: 'Cubic.Out', delay: 400,
            onUpdate: (tween, target) => {
                barFill.clear();
                barFill.fillStyle(Phaser.Display.Color.HexStringToColor(this.grade.color).color, 1);
                barFill.fillRoundedRect(40, 456, target.w, 10, 5);
            }
        });

        // Find the NEXT grade above current score (lowest threshold that's still above)
        const sortedAsc = [...BALANCE.grades].sort((a, b) => a.threshold - b.threshold);
        const nextGrade = sortedAsc.find(g => g.threshold > this.score);
        if (nextGrade) {
            const needed = nextGrade.threshold - this.score;
            this.add.text(SIZES.W / 2, 474,
                `${nextGrade.label} needs ${nextGrade.threshold} pts — ${needed} more`, {
                fontFamily: 'Share Tech Mono', fontSize: '10px', color: '#666666', align: 'center'
            }).setOrigin(0.5);
        }
    }

    _buildButtons() {
        const makeBtn = (x, y, label, bgColor, borderColor, cb) => {
            const w = 170; const h = 65;
            const bg = this.add.graphics();
            bg.fillStyle(bgColor, 1);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
            bg.lineStyle(2, borderColor, 1);
            bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
            const t = this.add.text(x, y, label, { ...FONTS.BUTTON, align: 'center' })
                .setOrigin(0.5)
                .setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
            t.on('pointerdown', cb);
            t.on('pointerover', () => bg.setAlpha(0.8));
            t.on('pointerout', () => bg.setAlpha(1));
        };

        const fadeOut = (cb) => {
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', cb);
        };

        makeBtn(SIZES.W / 4 + 10, 550, 'PLAY\nAGAIN', 0x1D3A1D, COLORS.GREEN, () => {
            fadeOut(() => this.scene.start('ConspiracySelectScene'));
        });
        makeBtn((SIZES.W * 3) / 4 - 10, 550, 'MAIN\nMENU', COLORS.PANEL, COLORS.GREY, () => {
            fadeOut(() => this.scene.start('MenuScene'));
        });
    }
}
