import Phaser from 'phaser';
import { COLORS, FONTS, SIZES } from '../constants.js';
import { musicManager } from '../audio/MusicManager.js';

export class PublishScene extends Phaser.Scene {
    constructor() { super({ key: 'PublishScene' }); }

    init(data) {
        this.state = data.gameState;
    }

    create() {
        musicManager.play('PublishScene');
        this.scene.bringToTop('UIOverlayScene');
        this.cameras.main.fadeIn(300, 0, 0, 0);

        this.add.rectangle(SIZES.W / 2, SIZES.H / 2, SIZES.W, SIZES.H, COLORS.BG);
        this.add.text(SIZES.W / 2, SIZES.H / 2, 'GOING TO PRINT...', {
            fontFamily: 'Playfair Display', fontSize: '28px', color: '#F5C518', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.time.delayedCall(1500, () => {
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('ResultsScene', { gameState: this.state });
            });
        });
    }
}
