import Phaser from 'phaser';
import { COLORS, CARD_COLORS, SIZES, ROTATIONS, FONTS } from '../constants.js';
import { hashCode } from '../utils/hashCode.js';

export class CardObject extends Phaser.GameObjects.Container {
    constructor(scene, x, y, cardData, onSwipe) {
        super(scene, x, y);
        this.cardData = cardData;
        this.onSwipe = onSwipe;
        this.startX = x;
        this.startY = y;
        this._dismissed = false;
        this._baseAngle = ROTATIONS[cardData.type] || 0;
        this.angle = this._baseAngle;

        this._buildVisuals();
        scene.add.existing(this);
    }

    _buildVisuals() {
        const { CARD_W, CARD_H } = SIZES;
        const ox = -CARD_W / 2;
        const oy = -CARD_H / 2;

        // Shadow
        const shadow = this.scene.add.graphics();
        shadow.fillStyle(0x000000, 0.4);
        shadow.fillRoundedRect(ox + 3, oy + 4, CARD_W, CARD_H, 12);
        this.add(shadow);

        // Card background
        const bg = this.scene.add.graphics();
        bg.fillStyle(CARD_COLORS[this.cardData.type] || CARD_COLORS.witness, 1);
        bg.fillRoundedRect(ox, oy, CARD_W, CARD_H, 12);
        bg.lineStyle(2, COLORS.YELLOW, 1);
        bg.strokeRoundedRect(ox, oy, CARD_W, CARD_H, 12);
        this.add(bg);

        // Torn bottom edge
        const torn = this.scene.add.graphics();
        torn.fillStyle(CARD_COLORS[this.cardData.type] || CARD_COLORS.witness, 1);
        const teeth = [];
        teeth.push({ x: ox, y: oy + CARD_H - 14 });
        const seedOffset = hashCode(this.cardData.id);
        for (let x = 0; x <= CARD_W; x += 10) {
            const jag = (Math.sin(x * 0.8 + seedOffset) * 5) + (Math.sin(x * 1.7 + seedOffset) * 3);
            teeth.push({ x: ox + x, y: oy + CARD_H - 8 + jag });
        }
        teeth.push({ x: ox + CARD_W, y: oy + CARD_H - 14 });
        teeth.push({ x: ox + CARD_W, y: oy + CARD_H });
        teeth.push({ x: ox, y: oy + CARD_H });
        torn.fillPoints(teeth, true, true);
        torn.lineStyle(1.5, 0xFFFFFF, 0.35);
        for (let i = 0; i < teeth.length - 4; i++) {
            torn.lineBetween(teeth[i].x, teeth[i].y, teeth[i + 1].x, teeth[i + 1].y);
        }
        this.add(torn);

        const BAND_COLORS = {
            witness: 0x2C3E50,
            document: 0x2D4A2D,
            photo: 0x4A3728,
            event: 0x5C2D2D,
        };

        const band = this.scene.add.graphics();
        band.fillStyle(BAND_COLORS[this.cardData.type] || 0x2A2018, 0.6);
        band.fillRect(ox, oy + 42, CARD_W, 26);
        this.add(band);

        // Type stamp (top-left)
        this.add(this.scene.add.text(ox + 14, oy + 12, this.cardData.type.toUpperCase(), FONTS.STAMP));

        // Danger badge (top-right)
        if (this.cardData.swipeEffects?.right?.heatChange >= 10) {
            const dangerBg = this.scene.add.graphics();
            dangerBg.fillStyle(COLORS.RED, 1);
            dangerBg.fillCircle(ox + CARD_W - 14, oy + 34, 12);
            this.add(dangerBg);

            const dangerTxt = this.scene.add.text(ox + CARD_W - 14, oy + 34, `+${this.cardData.swipeEffects.right.heatChange}\nHT`, {
                fontFamily: 'Share Tech Mono', fontSize: '9px', color: '#F5F0E8', align: 'center'
            }).setOrigin(0.5);
            this.add(dangerTxt);
        }

        // Title
        this.add(this.scene.add.text(ox + 16, oy + 74, this.cardData.title, {
            ...FONTS.HEADLINE, wordWrap: { width: CARD_W - 32 }
        }));

        // Body
        this.add(this.scene.add.text(ox + 16, oy + 118, this.cardData.text, {
            ...FONTS.BODY, wordWrap: { width: CARD_W - 32 }, lineSpacing: 4
        }));

        // NPC name (witness only)
        if (this.cardData.type === 'witness' && this.cardData.npcId) {
            this.add(this.scene.add.text(ox + 16, oy + CARD_H - 48,
                this.cardData.npcId.replace(/_/g, ' ').toUpperCase(), FONTS.NPC
            ));
        }

        // Tabloid stamp (centered on container origin)
        this._tabloidStamp = this.scene.add.text(0, 0, 'TABLOID', {
            fontFamily: 'Playfair Display', fontSize: '40px', color: '#CC2222',
            fontStyle: 'bold', alpha: 0.25
        }).setOrigin(0.5).setAngle(40).setAlpha(0).setVisible(false);
        this.add(this._tabloidStamp);

        // Hidden label placeholder (centered on container origin)
        this._dragLabel = this.scene.add.text(0, 0, '', {
            fontFamily: 'Playfair Display', fontSize: '22px', color: '#FFFFFF', fontStyle: 'bold', align: 'center'
        }).setOrigin(0.5).setAlpha(0);
        this.add(this._dragLabel);
    }

    showTabloidStamp() {
        this._tabloidStamp.setVisible(true).setAlpha(0.3);
    }

    _setupInput() {
        // No-op: click buttons are built by CardScene around the card
    }

    /** Called by CardScene to trigger a direction choice via button click */
    choose(dir) {
        if (this._dismissed) return;
        if (this.cardData.tutorial?.lockOtherDirections && dir !== this.cardData.tutorial.forcedDirection) {
            this._wrongSwipeHint();
            return;
        }
        this._dismissed = true;
        this._dragLabel.setAlpha(0);
        this._flyOff(dir);
        this.scene.time.delayedCall(280, () => this.onSwipe(dir));
    }

    _flyOff(dir) {
        const targets = { right: { x: 1200 }, left: { x: -400 }, up: { y: -400 }, down: { y: 900 } };
        const angleEnd = dir === 'right' ? 20 : dir === 'left' ? -20 : this._baseAngle;
        this.scene.tweens.add({
            targets: this, ...targets[dir], angle: angleEnd,
            duration: 260, ease: 'Cubic.Out',
            onComplete: () => this.destroy()
        });
    }

    _wrongSwipeHint() {
        const msg = `Try ${this.cardData.tutorial.forcedDirection.toUpperCase()}!`;
        const t = this.scene.add.text(SIZES.W / 2, SIZES.H / 2, msg, { ...FONTS.BUTTON, color: '#CC2222' }).setOrigin(0.5);
        this.scene.tweens.add({ targets: t, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
    }
}
