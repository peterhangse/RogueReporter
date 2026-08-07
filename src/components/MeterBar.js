import { COLORS, SIZES, FONTS } from '../constants.js';

const BAR_COLORS = {
    credibility: COLORS.GREEN,
    heat: COLORS.RED,
    deadline: COLORS.MONEY,
};

export class MeterBar {
    constructor(scene, x, key, icon) {
        this.scene = scene;
        this.key = key;
        this.x = x;
        this.colW = SIZES.W / 3;

        // Panel cell background
        scene.add.rectangle(x + this.colW / 2, SIZES.METER_H / 2, this.colW - 2, SIZES.METER_H, COLORS.PANEL);

        this._icon = scene.add.text(x + 6, 4, icon, { ...FONTS.STAMP, fontSize: '14px' });
        this._label = scene.add.text(x + 24, 4, key.slice(0, 5).toUpperCase(), FONTS.STAMP).setAlpha(0.6);
        this._bg = scene.add.graphics();
        this._fill = scene.add.graphics();
        this._val = scene.add.text(x + this.colW - 8, 20, '50%', { ...FONTS.METER, align: 'right' }).setOrigin(1, 0);

        this.update(50);
    }

    setDepth(depth) {
        [this._icon, this._label, this._bg, this._fill, this._val].forEach(o => o.setDepth(depth));
        return this;
    }

    update(value) {
        const bx = this.x + 6;
        const by = 38;
        const barW = this.colW - 14;

        this._bg.clear();
        this._bg.fillStyle(0x333333, 1);
        this._bg.fillRoundedRect(bx, by, barW, 6, 3);

        this._fill.clear();
        const col = (value < 20 && this.key === 'credibility') ? COLORS.RED : (BAR_COLORS[this.key] || COLORS.YELLOW);
        this._fill.fillStyle(col, 1);
        this._fill.fillRoundedRect(bx, by, Math.max(0, (value / 100) * barW), 6, 3);

        this._val.setText(`${Math.round(value)}%`);
    }
}
