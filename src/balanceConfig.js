// ── BALANCE CONFIG ──────────────────────────────────────────────────────
// Single source of truth for all tunable game numbers.
// Edit here to rebalance — no hunting across GameState, scoreCalculator, or card JSON.

export const BALANCE = {
    // ── STARTING METERS ─────────────────────────────────────────────────
    startCredibility: 50,
    startHeat: 0,
    startDeadline: 0,

    // ── DEADLINE COSTS PER ACTION ───────────────────────────────────────
    deadlineCost: {
        right: 8,   // investigate (was 10 — too punishing, limited to ~7 actions)
        left: 5,    // ignore (was 7)
        up: 4,      // fake (was 5)
        down: 6,    // leak (was 8)
    },

    // ── TABLOID MODE ────────────────────────────────────────────────────
    tabloidThreshold: 20,  // credibility below this triggers tabloid mode
    tabloidHeatMultiplier: 2,

    // ── SCORE FORMULA WEIGHTS ───────────────────────────────────────────
    score: {
        credibilityWeight: 10,
        nodeWeight: 50,
        strongWeight: 25,
        weakWeight: 10,
        fabricatedPenalty: 15,
        deadEndPenalty: 5,
    },

    // ── GRADE THRESHOLDS ────────────────────────────────────────────────
    // Adjusted so PULITZER is achievable with near-perfect play (~1100 max realistic)
    grades: [
        { label: 'PULITZER', threshold: 1000, color: '#F5C518' },
        { label: 'SCOOP',    threshold: 650,  color: '#4A8A6A' },
        { label: 'BYLINE',   threshold: 350,  color: '#4A8ACA' },
        { label: 'FILLER',   threshold: 100,  color: '#C8AA40' },
        // below 100 = FIRED
    ],
    firedGrade: { label: 'FIRED', color: '#CC2222' },

    // ── TENSION ESCALATION ──────────────────────────────────────────────
    // Heat added per round after this round (makes late game harder)
    tensionStartRound: 8,       // ambient heat starts after round 8
    tensionHeatPerRound: 3,     // +3 heat per round after tensionStartRound

    // ── POLICE KNOCK ────────────────────────────────────────────────────
    policeKnockHeatThreshold: 80,

    // ── METER WARNINGS ──────────────────────────────────────────────────
    heatWarningThreshold: 85,
    meterSpikeThreshold: 15,
};
