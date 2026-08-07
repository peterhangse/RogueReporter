export function evaluateConnection(fromId, toId, gameState, boardData) {
    const isValid = boardData.validConnections.some(
        ([a, b]) => (a === fromId && b === toId) || (a === toId && b === fromId)
    );
    if (!isValid) return 'dead_end';
    if (gameState.isNodeFabricated(fromId) || gameState.isNodeFabricated(toId)) return 'fabricated';
    const count = gameState.getEvidenceCountForPair(fromId, toId);
    if (count >= 2) return 'strong';
    if (count === 1) return 'weak';
    return 'dead_end';
}

export function checkWin(gameState) {
    const valid = gameState.connections.filter(c => c.strength !== 'dead_end');
    const covered = new Set(valid.flatMap(c => [c.fromId, c.toId])).size;
    const strong = valid.filter(c => c.strength === 'strong').length;
    return covered >= 5 && strong >= 3;
}
