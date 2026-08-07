import { BALANCE } from './balanceConfig.js';

export class GameState {
    constructor() {
        // ── METERS ──────────────────────────────────────────────────────────
        /** @type {number} 0–100. At 0: FIRED. */
        this.credibility = BALANCE.startCredibility;
        /** @type {number} 0–100. At 100: ARRESTED. */
        this.heat = BALANCE.startHeat;
        /** @type {number} 0–100. At 100: PUBLISH_NOW. */
        this.deadline = BALANCE.startDeadline;

        // ── DECK / CARD STATE ────────────────────────────────────────────────
        /** @type {Array<Object>} Full ordered array of card data objects for this run. */
        this.deck = [];
        /** @type {number} Index of next card to deal from this.deck. */
        this.currentIndex = 0;
        /** @type {Array<{card: Object, direction: string, timestamp: number}>} All swiped cards in order. */
        this.swipedCards = [];

        // ── BOARD STATE ──────────────────────────────────────────────────────
        /** @type {Array<string>} Node IDs unlocked by swiping RIGHT (real evidence). */
        this.boardNodes = [];
        /** @type {Array<string>} Node IDs added by swiping UP (fabricated — shown as dashed on board). */
        this.fabricatedNodes = [];
        /** @type {Array<{fromId: string, toId: string, strength: 'strong'|'weak'|'fabricated'|'dead_end'}>} */
        this.connections = [];

        // ── RUN META ─────────────────────────────────────────────────────────
        /** @type {string|null} Conspiracy ID for this run, e.g. 'trench_coat_kids'. */
        this.conspiracyId = null;

        // ── UI FLAGS ─────────────────────────────────────────────────────────
        /** @type {boolean} True after first BoardScene visit — suppresses mid-run nudge. */
        this.boardVisited = false;
        /** @type {boolean} True after board tutorial overlay is dismissed. */
        this.boardTutorialSeen = false;
        /** @type {boolean} True after contextual board tutorial complete. */
        this.contextualTutorialSeen = false;
        /** @type {boolean} True after meter warning tutorial */
        this.meterTutorialSeen = false;
        /** @type {boolean} True after heat warning seen */
        this.heatWarningSeen = false;
        /** @type {boolean} [v3] True after DANGER badge tooltip has been shown once. */
        this.seenDangerTooltip = false;
        /** @type {boolean} True after police knock event fires (persisted). */
        this.policeKnockInjected = false;

        // ── SAVE META ────────────────────────────────────────────────────────
        /** @type {number} Incremented when new fields are added. Used by migrate(). */
        this.saveVersion = 1;
    }

    applySwipe(direction, cardData) {
        const fx = cardData.swipeEffects?.[direction] || {};

        this.credibility = Math.max(0, Math.min(100, this.credibility + (fx.credibilityChange || 0)));
        this.heat = Math.max(0, Math.min(100, this.heat + (fx.heatChange || 0)));
        this.deadline = Math.max(0, Math.min(100, this.deadline + (BALANCE.deadlineCost[direction] || 5)));

        // Tension escalation: ambient heat after tensionStartRound
        const round = this._getCurrentRound();
        if (round > BALANCE.tensionStartRound) {
            this.heat = Math.min(100, this.heat + BALANCE.tensionHeatPerRound);
        }

        // Unlock node if card adds one (right = real, up = fabricated)
        if (fx.addsNode && direction !== 'left' && direction !== 'down') {
            const isFabricated = direction === 'up';
            this._unlockNode(fx.addsNode, isFabricated);
        }

        this.swipedCards.push({ card: cardData, direction, timestamp: Date.now() });
        this.currentIndex++;

        // [v5] Police knock check
        if (this.heat > BALANCE.policeKnockHeatThreshold && !this.policeKnockInjected) {
            this.policeKnockInjected = true;
            return 'INJECT_POLICE_KNOCK';
        }

        if (this.credibility === 0) return 'FIRED';
        if (this.heat >= 100) return 'ARRESTED';
        if (this.deadline >= 100) return 'PUBLISH_NOW';
        return 'CONTINUE';
    }

    _unlockNode(nodeId, isFabricated = false) {
        if (!this.boardNodes.includes(nodeId)) {
            this.boardNodes.push(nodeId);
        }
        if (isFabricated && !this.fabricatedNodes.includes(nodeId)) {
            this.fabricatedNodes.push(nodeId);
        }
    }

    isNodeFabricated(nodeId) {
        return this.fabricatedNodes.includes(nodeId);
    }

    getEvidenceCountForPair(nodeIdA, nodeIdB) {
        return this.swipedCards.filter(s =>
            s.direction === 'right' &&
            (s.card.swipeEffects?.right?.addsNode === nodeIdA ||
                s.card.swipeEffects?.right?.addsNode === nodeIdB)
        ).length;
    }

    addConnection(fromId, toId, strength) {
        const exists = this.connections.find(
            c => (c.fromId === fromId && c.toId === toId) ||
                (c.fromId === toId && c.toId === fromId)
        );
        if (!exists) this.connections.push({ fromId, toId, strength });
    }

    /** Safe beat card injection with index guard */
    injectBeatCard(beatCard) {
        const insertAt = Math.min(this.currentIndex + 1, this.deck.length);
        this.deck.splice(insertAt, 0, beatCard);
    }

    /** Current round number (for tension escalation) — 3 cards per regular round */
    _getCurrentRound() {
        const idx = this.currentIndex;
        if (idx < 4) return idx + 1;
        return 5 + Math.floor((idx - 4) / 3);
    }

    getScore() {
        const nodeCount = this.boardNodes.length;
        const valid = this.connections.filter(c => c.strength !== 'dead_end');
        const strong = valid.filter(c => c.strength === 'strong').length;
        const weak = valid.filter(c => c.strength === 'weak').length;
        const fabricated = this.connections.filter(c => c.strength === 'fabricated').length;
        const deadEnds = this.connections.filter(c => c.strength === 'dead_end').length;
        const s = BALANCE.score;
        return Math.round(
            (this.credibility * s.credibilityWeight) +
            (nodeCount * s.nodeWeight) +
            (strong * s.strongWeight) +
            (weak * s.weakWeight) -
            (fabricated * s.fabricatedPenalty) -
            (deadEnds * s.deadEndPenalty)
        );
    }

    reset() {
        this.credibility = BALANCE.startCredibility;
        this.heat = BALANCE.startHeat;
        this.deadline = BALANCE.startDeadline;
        this.deck = [];
        this.currentIndex = 0;
        this.swipedCards = [];
        this.boardNodes = [];
        this.fabricatedNodes = [];
        this.connections = [];
        this.conspiracyId = null;
        this.boardVisited = false;
        this.boardTutorialSeen = false;
        this.policeKnockInjected = false;
    }

    save() {
        try { localStorage.setItem('rr_gamestate', JSON.stringify(this)); } catch (e) { }
    }

    static load() {
        try {
            const raw = localStorage.getItem('rr_gamestate');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            const version = parsed.saveVersion || 0;
            const migrated = GameState.migrate(parsed, version);
            return Object.assign(new GameState(), migrated);
        } catch (e) { return null; }
    }

    static migrate(raw, fromVersion) {
        if (fromVersion < 1) {
            raw.boardTutorialSeen = raw.boardTutorialSeen ?? false;
            raw.boardVisited = raw._boardVisited ?? false;
            delete raw._boardVisited;
        }
        if (fromVersion < 2) {
            raw.seenDangerTooltip = raw.seenDangerTooltip ?? false;
        }
        raw.saveVersion = 2;
        return raw;
    }

    static fresh() {
        try { localStorage.removeItem('rr_gamestate'); } catch (e) { }
        return new GameState();
    }
}
