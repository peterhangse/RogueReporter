/**
 * Deterministic integer hash from string.
 * Used to seed per-card torn-edge variation in CardObject.
 * @param {string} str
 * @returns {number} float in roughly [-10, 10] range
 */
export function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return (h % 100) / 10;
}
