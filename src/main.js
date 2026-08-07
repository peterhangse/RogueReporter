import Phaser from 'phaser';

import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { ConspiracySelectScene } from './scenes/ConspiracySelectScene.js';
import { BriefingScene } from './scenes/BriefingScene.js';
import { CardScene } from './scenes/CardScene.js';
import { BoardScene } from './scenes/BoardScene.js';
import { PublishScene } from './scenes/PublishScene.js';
import { ResultsScene } from './scenes/ResultsScene.js';
import { EditorIntroScene } from './scenes/EditorIntroScene.js';
import { DeadlineScene } from './scenes/DeadlineScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { UIOverlayScene } from './scenes/UIOverlayScene.js';

import { SIZES } from './constants.js';

const config = {
    type: Phaser.AUTO,
    width: SIZES.W,
    height: SIZES.H,
    backgroundColor: '#0D0B08',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game-container'
    },
    scene: [
        BootScene,
        MenuScene,
        ConspiracySelectScene,
        BriefingScene,
        EditorIntroScene,
        CardScene,
        BoardScene,
        PublishScene,
        ResultsScene,
        DeadlineScene,
        GameOverScene,
        UIOverlayScene
    ]
};

// Start the game!
const game = new Phaser.Game(config);
window.__PHASER_GAME__ = game;

// Global error boundary — catch scene crashes and recover to MenuScene
window.addEventListener('error', (e) => {
    console.error('Rogue Reporter caught error:', e.error);
    try {
        if (game.scene.isActive('MenuScene')) return;
        game.scene.start('MenuScene');
    } catch (_) { /* last resort — do nothing */ }
});
window.addEventListener('unhandledrejection', (e) => {
    console.error('Rogue Reporter unhandled rejection:', e.reason);
    try {
        if (game.scene.isActive('MenuScene')) return;
        game.scene.start('MenuScene');
    } catch (_) { /* last resort */ }
});
