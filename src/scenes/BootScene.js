import Phaser from 'phaser';
import { musicManager } from '../audio/MusicManager.js';

export class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        // Loading bar
        const loadBar = this.add.graphics();
        this.load.on('progress', v => {
            loadBar.clear();
            loadBar.fillStyle(0xF5C518, 1);
            loadBar.fillRect(330, 308, 300 * v, 8);
        });

        // JSON load error handling
        this.load.on('loaderror', (file) => {
            console.error(`Failed to load: ${file.key} (${file.url})`);
            this.add.text(480, 340, `Load error: ${file.key}`, {
                fontFamily: 'monospace', fontSize: '12px', color: '#CC2222', align: 'center'
            }).setOrigin(0.5);
        });

        this.load.json('cards-tutorial', 'data/cards-tutorial.json');
        this.load.json('cards-trench-coat-kids', 'data/cards-trench-coat.json');
        this.load.json('board-trench-coat-kids', 'data/board-trench-coat.json');
        this.load.json('conspiracy-trench-coat-kids', 'data/conspiracy-trench-coat.json');
    }

    create() {
        this.scene.launch('UIOverlayScene');

        // Wait for web fonts before any canvas text renders
        document.fonts.ready.then(() => {
            const isMobile = /Mobi|Android/i.test(navigator.userAgent);
            if (isMobile && window.innerHeight > window.innerWidth) {
                this._showOrientationWarning();
                return;
            }
            this.scene.start('MenuScene');
        });
    }

    _showOrientationWarning() {
        this.add.text(480, 260, '↺', { fontSize: '64px', color: '#F5C518' }).setOrigin(0.5);
        this.add.text(480, 340, 'ROTATE YOUR DEVICE\nLandscape mode required', {
            fontFamily: 'Share Tech Mono', fontSize: '16px', color: '#F5F0E8', align: 'center'
        }).setOrigin(0.5);

        // Poll for rotation
        const check = setInterval(() => {
            if (window.innerWidth > window.innerHeight) {
                clearInterval(check);
                this.scene.start('MenuScene');
            }
        }, 500);
    }
}
