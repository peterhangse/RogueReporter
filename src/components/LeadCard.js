// ── LEAD CARD ───────────────────────────────────────────────────────────
// Compact card displayed in the 3-card hand tray.
// Shows headline, type, evidence hint, and cost.
// Tap to select → CardScene handles resolve flow.

import Phaser from 'phaser';
import { COLORS, CARD_COLORS, SIZES, FONTS } from '../constants.js';

export class LeadCard extends Phaser.GameObjects.Container {
    constructor(scene, x, y, cardData, onSelect) {
        super(scene, x, y);
        this.cardData = cardData;
        this.onSelect = onSelect;
        this._selected = false;
        this._gone = false;

        const W = SIZES.HAND_CARD_W;
        const H = SIZES.HAND_CARD_H;
        const ox = -W / 2;
        const oy = -H / 2;

        // Shadow
        const shadow = scene.add.graphics();
        shadow.fillStyle(0x000000, 0.35);
        shadow.fillRoundedRect(ox + 2, oy + 3, W, H, 8);
        this.add(shadow);

        // Background
        const bgColor = CARD_COLORS[cardData.type] || CARD_COLORS.witness;
        this._bg = scene.add.graphics();
        this._bg.fillStyle(bgColor, 1);
        this._bg.fillRoundedRect(ox, oy, W, H, 8);
        this._bg.lineStyle(1.5, COLORS.YELLOW, 0.8);
        this._bg.strokeRoundedRect(ox, oy, W, H, 8);
        this.add(this._bg);

        // Type badge (top-left)
        this.add(scene.add.text(ox + 10, oy + 6,
            cardData.type.toUpperCase(), {
            fontFamily: 'Share Tech Mono', fontSize: '9px', color: '#F5C518'
        }));

        // Heat badge (top-right) if dangerous
        const heatCost = cardData.swipeEffects?.right?.heatChange || 0;
        if (heatCost >= 8) {
            const badge = scene.add.graphics();
            badge.fillStyle(COLORS.RED, 0.9);
            badge.fillCircle(ox + W - 16, oy + 14, 10);
            this.add(badge);
            this.add(scene.add.text(ox + W - 16, oy + 14, `+${heatCost}`, {
                fontFamily: 'Share Tech Mono', fontSize: '8px', color: '#FFF', align: 'center'
            }).setOrigin(0.5));
        }

        // Title
        this.add(scene.add.text(ox + 10, oy + 22, cardData.title, {
            fontFamily: 'Playfair Display', fontSize: '13px', color: '#F5F0E8',
            fontStyle: 'bold', wordWrap: { width: W - 20 }
        }));

        // Body text (truncated)
        const bodyText = cardData.text.length > 80
            ? cardData.text.substring(0, 77) + '...'
            : cardData.text;
        this.add(scene.add.text(ox + 10, oy + 55, bodyText, {
            fontFamily: 'Lora', fontSize: '10px', color: '#C0B898',
            wordWrap: { width: W - 20 }, lineSpacing: 2
        }));

        // Evidence hint at bottom
        const nodeId = cardData.swipeEffects?.right?.addsNode;
        if (nodeId) {
            const nodeLabel = nodeId.replace(/_/g, ' ');
            this.add(scene.add.text(ox + 10, oy + H - 22,
                '\u{1F4CC} ' + nodeLabel, {
                fontFamily: 'Share Tech Mono', fontSize: '9px', color: '#4A8A6A'
            }));
        }

        // Interaction
        this.setSize(W, H);
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', () => {
            if (!this._gone) this.onSelect(this);
        });
        this.on('pointerover', () => {
            if (!this._gone && !this._selected) {
                scene.tweens.add({
                    targets: this, scaleX: 1.04, scaleY: 1.04, y: y - 6,
                    duration: 100, ease: 'Sine.Out'
                });
            }
        });
        this.on('pointerout', () => {
            if (!this._gone && !this._selected) {
                scene.tweens.add({
                    targets: this, scaleX: 1, scaleY: 1, y,
                    duration: 100, ease: 'Sine.Out'
                });
            }
        });

        scene.add.existing(this);
    }

    /** Highlight as selected — zooms up to resolve position. */
    select() {
        this._selected = true;
        this.disableInteractive();
    }

    /** "LEAD LOST" stamp + fly off. */
    lose(direction) {
        this._gone = true;
        this.disableInteractive();

        // Stamp
        const stamp = this.scene.add.text(0, 0, 'LOST', {
            fontFamily: 'Playfair Display', fontSize: '22px',
            color: '#CC2222', fontStyle: 'bold'
        }).setOrigin(0.5).setAngle(-12).setAlpha(0);
        this.add(stamp);
        this.scene.tweens.add({ targets: stamp, alpha: 0.7, duration: 150 });

        const flyX = direction < 0 ? -400 : SIZES.W + 400;
        this.scene.tweens.add({
            targets: this,
            x: flyX, alpha: 0, angle: direction < 0 ? -15 : 15,
            duration: 400, ease: 'Cubic.In', delay: 250,
            onComplete: () => this.destroy()
        });
    }
}
