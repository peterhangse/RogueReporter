// ── DECK MANAGER ────────────────────────────────────────────────────────
// Extracted from CardScene: deck building, spread shuffle, beat card tracking.

import { shuffle } from '../utils/shuffle.js';

export class DeckManager {
    /**
     * @param {Phaser.Cache.CacheManager} cache - Phaser cache (scene.cache)
     * @param {string} conspiracyId - e.g. 'trench_coat_kids'
     */
    constructor(cache, conspiracyId) {
        this._cache = cache;
        this._conspiracyId = conspiracyId || 'trench_coat_kids';
        /** @type {Array<Object>} Beat cards loaded from conspiracy data */
        this.beatCards = [];
    }

    /** Build the full deck: tutorial cards + spread-shuffled story cards. */
    buildDeck() {
        const key = 'cards-' + this._conspiracyId.replace(/_/g, '-');
        const tutorial = this._cache.json.get('cards-tutorial');
        const regular = this._spreadShuffle([...this._cache.json.get(key)]);

        // Load beat cards
        const conKey = 'conspiracy-' + this._conspiracyId.replace(/_/g, '-');
        const conspiracy = this._cache.json.get(conKey);
        this.beatCards = conspiracy?.beatCards || [];

        return [...tutorial, ...regular];
    }

    /**
     * Shuffle so cards in the same triple-hand don't target the same board node.
     * Best-effort: 50 attempts, then accepts remaining conflicts.
     */
    _spreadShuffle(cards) {
        const shuffled = shuffle(cards);
        for (let attempt = 0; attempt < 50; attempt++) {
            let conflict = false;
            for (let i = 0; i < shuffled.length - 2; i += 3) {
                const nodes = [];
                for (let j = 0; j < 3 && (i + j) < shuffled.length; j++) {
                    const n = shuffled[i + j].swipeEffects?.right?.addsNode;
                    if (n) nodes.push({ idx: i + j, node: n });
                }
                // Check for duplicates within the triple
                const seen = new Set();
                for (const { idx, node } of nodes) {
                    if (seen.has(node)) {
                        const swapRange = shuffled.length - (i + 3);
                        if (swapRange > 0) {
                            const swapIdx = i + 3 + Math.floor(Math.random() * swapRange);
                            [shuffled[idx], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[idx]];
                        }
                        conflict = true;
                    }
                    seen.add(node);
                }
            }
            if (!conflict) break;
        }
        return shuffled;
    }

    /**
     * Check if a swiped card triggers a narrative beat.
     * Returns the beat card object or null.
     */
    findTriggeredBeat(cardId, deck) {
        if (!this.beatCards.length || !cardId) return null;
        const beat = this.beatCards.find(b => b.triggerAfter === cardId);
        if (beat && !deck.some(c => c.id === beat.id)) return beat;
        return null;
    }
}
