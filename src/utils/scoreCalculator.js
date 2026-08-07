import { BALANCE } from '../balanceConfig.js';

export function getScore(gameState) {
    // Count ALL investigated nodes (not just ones with drawn connections)
    const nodeCount = gameState.boardNodes.length;
    const valid = gameState.connections.filter(c => c.strength !== 'dead_end');
    const strong = valid.filter(c => c.strength === 'strong').length;
    const weak = valid.filter(c => c.strength === 'weak').length;
    const fabricated = gameState.connections.filter(c => c.strength === 'fabricated').length;
    const deadEnds = gameState.connections.filter(c => c.strength === 'dead_end').length;

    const s = BALANCE.score;
    return Math.round(
        (gameState.credibility * s.credibilityWeight) +
        (nodeCount * s.nodeWeight) +
        (strong * s.strongWeight) +
        (weak * s.weakWeight) -
        (fabricated * s.fabricatedPenalty) -
        (deadEnds * s.deadEndPenalty)
    );
}

export function getGrade(score) {
    for (const g of BALANCE.grades) {
        if (score >= g.threshold) return { label: g.label, color: g.color };
    }
    return { label: BALANCE.firedGrade.label, color: BALANCE.firedGrade.color };
}

export function getNarrative(grade) {
    const narratives = {
        PULITZER: 'Your exposé changed the city. The mayor resigned before dawn. Every paper in the country ran your name.',
        SCOOP: 'Front page, above the fold. The mayor called a press conference. The city is paying attention.',
        BYLINE: 'A solid story — front page, below the fold. Your editor nods. "Not bad, kid."',
        FILLER: 'A 200-word brief, buried in the Metro section. Nobody will remember it by Thursday.',
        FIRED: 'The article was killed. Your editor didn\'t even look up. "Clean out your desk."',
    };
    return narratives[grade] || '';
}
