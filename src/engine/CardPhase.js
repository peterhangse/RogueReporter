// ── CARD PHASE STATE MACHINE ────────────────────────────────────────────
// Replaces scattered boolean flags with explicit phases and valid transitions.
// Invalid transitions are logged and rejected, preventing desync bugs.

export const CardPhase = Object.freeze({
    IDLE:              'IDLE',
    DEALING_SINGLE:    'DEALING_SINGLE',
    DEALING_PAIR:      'DEALING_PAIR',
    PICK:              'PICK',
    ACTIVE:            'ACTIVE',
    PROCESSING:        'PROCESSING',
    TRANSITION:        'TRANSITION',
    OVERLAY:           'OVERLAY',
});

const VALID = {
    [CardPhase.IDLE]:           [CardPhase.DEALING_SINGLE, CardPhase.DEALING_PAIR, CardPhase.TRANSITION],
    [CardPhase.DEALING_SINGLE]: [CardPhase.ACTIVE],
    [CardPhase.DEALING_PAIR]:   [CardPhase.PICK],
    [CardPhase.PICK]:           [CardPhase.ACTIVE],
    [CardPhase.ACTIVE]:         [CardPhase.PROCESSING],
    [CardPhase.PROCESSING]:     [CardPhase.IDLE, CardPhase.OVERLAY, CardPhase.TRANSITION],
    [CardPhase.TRANSITION]:     [CardPhase.IDLE, CardPhase.DEALING_SINGLE, CardPhase.DEALING_PAIR],
    [CardPhase.OVERLAY]:        [CardPhase.IDLE, CardPhase.TRANSITION],
};

export class CardPhaseManager {
    constructor() {
        this._phase = CardPhase.IDLE;
    }

    get current() { return this._phase; }

    /** Attempt a transition. Returns true if valid, false if rejected. */
    transition(next) {
        const allowed = VALID[this._phase];
        if (!allowed || !allowed.includes(next)) {
            console.warn(`CardPhase: blocked ${this._phase} → ${next}`);
            return false;
        }
        this._phase = next;
        return true;
    }

    /** True when the player can interact with cards or buttons. */
    get isInteractable() {
        return this._phase === CardPhase.ACTIVE || this._phase === CardPhase.PICK;
    }

    /** True when in pick-one-of-two phase. */
    get isPicking() {
        return this._phase === CardPhase.PICK;
    }

    reset() { this._phase = CardPhase.IDLE; }
}
