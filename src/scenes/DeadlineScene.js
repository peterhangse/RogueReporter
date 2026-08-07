import Phaser from 'phaser';
import { COLORS, FONTS, SIZES } from '../constants.js';
import { musicManager } from '../audio/MusicManager.js';

export class DeadlineScene extends Phaser.Scene {
    constructor() { super('DeadlineScene'); }

    init(data) { this.state = data.gameState; }

    create() {
        musicManager.play('DeadlineScene');
        this.scene.bringToTop('UIOverlayScene');

        // Calm dark background — not angry red
        this.add.rectangle(SIZES.W / 2, SIZES.H / 2, SIZES.W, SIZES.H, COLORS.BG);

        // Subtle gold border
        const border = this.add.graphics();
        border.lineStyle(2, COLORS.YELLOW, 0.4);
        border.strokeRect(40, 40, SIZES.W - 80, SIZES.H - 80);

        this.add.text(SIZES.W / 2, SIZES.H / 2 - 80, 'TIME\'S UP', {
            fontFamily: 'Playfair Display', fontSize: '42px',
            color: '#C8AA40', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(SIZES.W / 2, SIZES.H / 2, 'The editor called.\nWe\'re printing what you have.', {
            fontFamily: 'Lora', fontSize: '16px', color: '#C8C0A8',
            align: 'center', lineSpacing: 6
        }).setOrigin(0.5);

        this.add.text(SIZES.W / 2, SIZES.H / 2 + 60, 'Your investigation window closed.', {
            fontFamily: 'Share Tech Mono', fontSize: '12px', color: '#666666'
        }).setOrigin(0.5);

        // Auto-dismiss after 1.5s → ResultsScene
        this.time.delayedCall(1500, () => {
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('ResultsScene', {
                    gameState: this.state
                });
            });
        });
    }
}
