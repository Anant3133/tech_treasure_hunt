const crypto = require('crypto');

const DEFAULT_TTL_SECONDS = 60; // token rotates every 60s

function getSecret() {
  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) {
    throw new Error('QR_TOKEN_SECRET not set');
  }
  return secret;
}

function getTimeSlot(date = new Date(), ttlSeconds = DEFAULT_TTL_SECONDS) {
  const epochSeconds = Math.floor(date.getTime() / 1000);
  return Math.floor(epochSeconds / ttlSeconds);
}

function base64UrlEncode(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function sign(payload) {
  const secret = getSecret();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return base64UrlEncode(hmac.digest());
}

function generateToken(questionNumber, options = {}) {
  const ttlSeconds = options.ttlSeconds || DEFAULT_TTL_SECONDS;
  const now = options.now instanceof Date ? options.now : new Date();
  const slot = getTimeSlot(now, ttlSeconds);
  const payload = `${Number(questionNumber)}.${slot}.${ttlSeconds}`;
  const sig = sign(payload);
  return `${payload}.${sig}`; // q.slot.ttl.sig
}

function verifyToken(token, options = {}) {
  if (!token || typeof token !== 'string') return { valid: false, reason: 'invalid_token' };
  const parts = token.split('.');
  if (parts.length !== 4) return { valid: false, reason: 'malformed' };
  const [qStr, slotStr, ttlStr, sig] = parts;
  const q = Number(qStr);
  const slot = Number(slotStr);
  const ttlSeconds = Number(ttlStr);
  if (!Number.isFinite(q) || !Number.isFinite(slot) || !Number.isFinite(ttlSeconds)) {
    return { valid: false, reason: 'invalid_parts' };
  }
  const expectedSig = sign(`${q}.${slot}.${ttlSeconds}`);
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
  if (!ok) return { valid: false, reason: 'bad_sig' };
  const now = options.now instanceof Date ? options.now : new Date();
  const currentSlot = getTimeSlot(now, ttlSeconds);
  // allow small clock skew of +/- 1 slot
  if (Math.abs(currentSlot - slot) > 1) {
    return { valid: false, reason: 'expired' };
  }
  const expiresAt = new Date((slot + 1) * ttlSeconds * 1000);
  return { valid: true, questionNumber: q, ttlSeconds, expiresAt };
}

module.exports = {
  generateToken,
  verifyToken,
  DEFAULT_TTL_SECONDS,
};


