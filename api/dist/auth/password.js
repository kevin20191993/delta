"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.hashResetToken = hashResetToken;
const crypto_1 = require("crypto");
const KEY_LENGTH = 64;
function hashPassword(password) {
    const salt = (0, crypto_1.randomBytes)(16).toString('hex');
    const derivedKey = (0, crypto_1.scryptSync)(password, salt, KEY_LENGTH).toString('hex');
    return `scrypt:${salt}:${derivedKey}`;
}
function verifyPassword(password, storedHash) {
    const [scheme, salt, expectedHash] = storedHash.split(':');
    if (scheme !== 'scrypt' || !salt || !expectedHash) {
        return false;
    }
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const actualBuffer = (0, crypto_1.scryptSync)(password, salt, KEY_LENGTH);
    if (expectedBuffer.length !== actualBuffer.length) {
        return false;
    }
    return (0, crypto_1.timingSafeEqual)(expectedBuffer, actualBuffer);
}
function hashResetToken(token) {
    return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
}
//# sourceMappingURL=password.js.map