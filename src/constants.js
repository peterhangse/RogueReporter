export const COLORS = {
    BG: 0x0D0B08,
    PAPER: 0xF5F0E8,
    PANEL: 0x1A1208,
    YELLOW: 0xF5C518,
    RED: 0xCC2222,
    GREEN: 0x4A8A6A,
    BLUE: 0x4A8ACA,
    PURPLE: 0x9A4ACA,
    GREY: 0x666666,
    MONEY: 0xC8AA40,
};

export const CARD_COLORS = {
    witness: 0x2C3E50,
    document: 0x2D4A2D,
    photo: 0x4A3728,
    event: 0x5C2D2D,
};

export const NODE_COLORS = {
    person: { fill: 0x3D1515, border: 0xCC2222 },
    event: { fill: 0x152030, border: 0x4A8ACA },
    motive: { fill: 0x2D2810, border: 0xC8AA40 },
    evidence: { fill: 0x152515, border: 0x4A8A6A },
    supernatural: { fill: 0x251530, border: 0x9A4ACA },
};

export const SIZES = {
    W: 960,
    H: 600,
    CARD_W: 340,
    CARD_H: 380,
    METER_H: 40,
    BOTTOM_NAV_H: 50,
    BOARD_H: 440,
    NODE_RADIUS: 28,
    // ── Investigation Desk layout ──
    DESK_BOARD_H: 310,       // conspiracy board area height
    DESK_TRAY_H: 190,        // card tray area height
    DESK_STATUS_H: 60,       // status bar height
    HAND_CARD_W: 220,        // card width in the tray
    HAND_CARD_H: 145,        // card height in the tray
    HAND_GAP: 20,            // gap between cards in tray
};

export const ROTATIONS = {
    witness: -1.5,
    document: 0.8,
    photo: -0.5,
    event: 0,
};

export const SWIPE_THRESHOLD = 80;

export const FONTS = {
    HEADLINE: { fontFamily: 'Playfair Display', fontSize: '20px', color: '#F5F0E8', fontStyle: 'bold' },
    BODY: { fontFamily: 'Lora', fontSize: '14px', color: '#E0D8C0' },
    STAMP: { fontFamily: 'Share Tech Mono', fontSize: '11px', color: '#F5C518' },
    METER: { fontFamily: 'Share Tech Mono', fontSize: '12px', color: '#F5F0E8' },
    NPC: { fontFamily: 'Special Elite', fontSize: '12px', color: '#C0B898' },
    BUTTON: { fontFamily: 'Share Tech Mono', fontSize: '14px', color: '#F5F0E8' },
    SCORE: { fontFamily: 'Playfair Display', fontSize: '40px', color: '#F5C518', fontStyle: 'bold' },
    HINT: { fontFamily: 'Playfair Display', fontSize: '17px', color: '#F5C518', align: 'center' },
};
