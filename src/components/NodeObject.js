import Phaser from 'phaser';
import { NODE_COLORS, SIZES, FONTS, COLORS } from '../constants.js';

export class NodeObject extends Phaser.GameObjects.Container {
    constructor(scene, nodeData, isUnlocked = false) {
        // nodeData.x and nodeData.y are board-local (within the 390×620 board area)
        // BoardScene renders board starting at y=60, so add offset when placing
        super(scene, nodeData.x, nodeData.y);

        this.nodeData = nodeData;
        this.isUnlocked = isUnlocked;
        this.isSelected = false;
        this._glow = null;

        this._buildVisuals();

        // PHASER GOTCHA: Containers need explicit hit area
        this.setSize(SIZES.NODE_RADIUS * 2, SIZES.NODE_RADIUS * 2);
        this.setInteractive(
            new Phaser.Geom.Circle(0, 0, SIZES.NODE_RADIUS),
            Phaser.Geom.Circle.Contains
        );

        if (!isUnlocked) this.setAlpha(0.35);

        scene.add.existing(this);
    }

    _buildVisuals() {
        const { fill, border } = NODE_COLORS[this.nodeData.type] || NODE_COLORS.evidence;
        const r = SIZES.NODE_RADIUS;

        this._circle = this.scene.add.graphics();
        this._drawCircle(fill, border, false);
        this.add(this._circle);

        // Type icon inside circle — text stamps only, no emoji (cross-platform safe) [v5]
        const NODE_ICONS = {
            person: '[P]',
            event: '[EV]',
            motive: '[?]',
            evidence: '[DOC]',
            supernatural: '[X]',
        };
        this._icon = this.scene.add.text(0, -6, NODE_ICONS[this.nodeData.type] || '[?]', {
            fontFamily: 'Share Tech Mono', fontSize: '10px', color: '#F5F0E8', align: 'center'
        }).setOrigin(0.5);
        this.add(this._icon);

        // Label below node
        this._label = this.scene.add.text(0, r + 10, this.nodeData.label, {
            ...FONTS.STAMP, align: 'center'
        }).setOrigin(0.5, 0);
        this.add(this._label);
    }

    _drawCircle(fill, border, dashed = false) {
        const { fill: defaultFill, border: defaultBorder } = NODE_COLORS[this.nodeData.type] || NODE_COLORS.evidence;
        const r = SIZES.NODE_RADIUS;
        this._circle.clear();

        // Fill
        this._circle.fillStyle(fill || defaultFill, 1);
        this._circle.fillCircle(0, 0, r);

        // Border — dashed if locked
        if (dashed) {
            // Approximate dashed circle with short arc segments
            this._circle.lineStyle(2, border || defaultBorder, 0.7);
            for (let a = 0; a < Math.PI * 2; a += 0.3) {
                this._circle.beginPath();
                this._circle.arc(0, 0, r, a, a + 0.15);
                this._circle.strokePath();
            }
        } else {
            this._circle.lineStyle(3, border || defaultBorder, 1);
            this._circle.strokeCircle(0, 0, r);
        }
    }

    unlock() {
        this.isUnlocked = true;
        this.setAlpha(1);
        const { fill, border } = NODE_COLORS[this.nodeData.type] || NODE_COLORS.evidence;
        this._drawCircle(fill, border, false);

        // Pop tween
        this.scene.tweens.add({
            targets: this, scaleX: 1.2, scaleY: 1.2,
            duration: 120, yoyo: true, ease: 'Cubic.Out'
        });
    }

    select() {
        this.isSelected = true;
        this.scene.tweens.add({
            targets: this, scaleX: 1.1, scaleY: 1.1,
            duration: 100, ease: 'Cubic.Out'
        });
        this._label.setColor('#F5C518');

        // [v5] Glow added to Container (this.add) so it is Container-relative, not world-absolute
        // fillCircle(0, 0, ...) is relative to the Container's own origin
        this._glow = this.scene.add.graphics();
        this._glow.fillStyle(COLORS.YELLOW, 0.25);
        this._glow.fillCircle(0, 0, SIZES.NODE_RADIUS + 12);
        this.addAt(this._glow, 0); // insert behind circle and label
        this.scene.tweens.add({
            targets: this._glow, alpha: { from: 0.25, to: 0.5 },
            duration: 400, yoyo: true, repeat: -1
        });
    }

    deselect() {
        this.isSelected = false;
        this.scene.tweens.killTweensOf(this);
        this.setScale(1);
        this._label.setColor('#F5C518');
        if (this._glow) { this._glow.destroy(); this._glow = null; }
    }

    pulse() {
        this.scene.tweens.add({
            targets: this, scaleX: 1.1, scaleY: 1.1,
            duration: 100, yoyo: true, ease: 'Cubic.Out'
        });
    }
}
