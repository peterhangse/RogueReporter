// ── NEWSPAPER DECORATIONS ────────────────────────────────────────────────
// Fills the 35-40% dead space around the card with subtle newspaper ambiance.
// All elements are low-alpha background decoration — never interactive.

import { COLORS, SIZES } from '../constants.js';

const CLASSIFIEDS = [
    'FOR SALE: One trench coat,\nslightly suspicious. $12 OBO.',
    'LOST: Cat answering to\n"Mayor Svensson." Grey tabby.',
    'WANTED: Honest politician.\nReward: We\'ll let you know.',
    'FREE: Stack of blank invoices.\nNo questions asked.',
    'HELP WANTED: Night shift,\nCity Hall. Must like candy.',
    'FOUND: Three pairs of\nchildren\'s shoes in mayoral\noffice. Unclaimed.',
];

export class NewspaperDecor {
    constructor(scene) {
        this._items = [];
        this._build(scene);
    }

    _build(scene) {
        const top = SIZES.METER_H;
        const bot = SIZES.H - SIZES.BOTTOM_NAV_H;
        const mid = (top + bot) / 2;

        // ── Column rules ────────────────────────────────────────────────
        const rules = scene.add.graphics();
        rules.lineStyle(1, COLORS.YELLOW, 0.06);
        // Far-left column rule
        rules.lineBetween(24, top + 8, 24, bot - 8);
        // Near-left rule (between margin and card)
        rules.lineBetween(140, top + 20, 140, bot - 20);
        // Near-right rule
        rules.lineBetween(SIZES.W - 140, top + 20, SIZES.W - 140, bot - 20);
        // Far-right column rule
        rules.lineBetween(SIZES.W - 24, top + 8, SIZES.W - 24, bot - 8);
        rules.setDepth(-1);
        this._items.push(rules);

        // ── Horizontal rules (newspaper section dividers) ───────────────
        const hRules = scene.add.graphics();
        hRules.lineStyle(1, COLORS.YELLOW, 0.04);
        hRules.lineBetween(8, mid - 60, 130, mid - 60);
        hRules.lineBetween(8, mid + 80, 130, mid + 80);
        hRules.lineBetween(SIZES.W - 130, mid - 60, SIZES.W - 8, mid - 60);
        hRules.lineBetween(SIZES.W - 130, mid + 80, SIZES.W - 8, mid + 80);
        hRules.setDepth(-1);
        this._items.push(hRules);

        // ── Classified ads (left margin, below action button) ───────────
        const leftAd = this._randomClassified();
        const leftText = scene.add.text(14, bot - 130, leftAd, {
            fontFamily: 'Special Elite', fontSize: '8px', color: '#444433',
            lineSpacing: 2, wordWrap: { width: 110 }
        }).setAlpha(0.35).setDepth(-1);
        this._items.push(leftText);

        // ── Classified ads (right margin) ───────────────────────────────
        const rightAd = this._randomClassified();
        const rightText = scene.add.text(SIZES.W - 128, bot - 130, rightAd, {
            fontFamily: 'Special Elite', fontSize: '8px', color: '#444433',
            lineSpacing: 2, wordWrap: { width: 110 }
        }).setAlpha(0.35).setDepth(-1);
        this._items.push(rightText);

        // ── Section headers (top margins) ───────────────────────────────
        const leftHeader = scene.add.text(14, top + 12, 'CLASSIFIEDS', {
            fontFamily: 'Share Tech Mono', fontSize: '7px', color: '#555544',
            letterSpacing: 3
        }).setAlpha(0.3).setDepth(-1);
        this._items.push(leftHeader);

        const rightHeader = scene.add.text(SIZES.W - 14, top + 12, 'LOCAL NEWS', {
            fontFamily: 'Share Tech Mono', fontSize: '7px', color: '#555544',
            letterSpacing: 3
        }).setOrigin(1, 0).setAlpha(0.3).setDepth(-1);
        this._items.push(rightHeader);

        // ── Dateline (bottom-left, above nav) ───────────────────────────
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
        const day = days[Math.floor(Math.random() * days.length)];
        const dateline = scene.add.text(14, bot - 14, `${day} EDITION • P.${Math.floor(Math.random() * 12) + 3}`, {
            fontFamily: 'Share Tech Mono', fontSize: '7px', color: '#444433'
        }).setAlpha(0.25).setDepth(-1);
        this._items.push(dateline);

        // ── Faux body text lines (right margin, top area) ───────────────
        const faux = scene.add.graphics();
        faux.fillStyle(0x333322, 0.08);
        for (let i = 0; i < 8; i++) {
            const lw = 80 + Math.random() * 30;
            faux.fillRect(SIZES.W - 126, top + 40 + i * 11, lw, 2);
        }
        faux.setDepth(-1);
        this._items.push(faux);

        // ── Faux body text lines (left margin, top area) ────────────────
        const fauxL = scene.add.graphics();
        fauxL.fillStyle(0x333322, 0.08);
        for (let i = 0; i < 6; i++) {
            const lw = 70 + Math.random() * 40;
            fauxL.fillRect(14, top + 40 + i * 11, lw, 2);
        }
        fauxL.setDepth(-1);
        this._items.push(fauxL);
    }

    _randomClassified() {
        return CLASSIFIEDS[Math.floor(Math.random() * CLASSIFIEDS.length)];
    }

    destroy() {
        this._items.forEach(item => item.destroy());
        this._items = [];
    }
}
