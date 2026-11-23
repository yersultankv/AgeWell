import * as Crypto from 'expo-crypto';

// TOTP (RFC 6238): Google Authenticator, Microsoft Authenticator, Authy қосымшаларымен үйлесімді.
// SHA-1 мен HMAC таза JS-пен жазылған (қосымша кітапхана қажет емес).

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(bytes) {
  let bits = 0, value = 0, out = '';
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
export function base32Decode(str) {
  const s = str.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase();
  let bits = 0, value = 0; const out = [];
  for (const ch of s) {
    const idx = B32.indexOf(ch);
    if (idx < 0) throw new Error('Base32 қате');
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(out);
}

export function sha1(bytes) {
  const h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
  const bitLen = bytes.length * 8;
  const padLen = ((bytes.length + 1 + 8 + 63) >> 6) << 6;
  const buf = new Uint8Array(padLen);
  buf.set(bytes); buf[bytes.length] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(padLen - 4, bitLen >>> 0);
  dv.setUint32(padLen - 8, Math.floor(bitLen / 4294967296));
  const w = new Uint32Array(80);
  for (let i = 0; i < padLen; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4);
    for (let t = 16; t < 80; t++) { const x = w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16]; w[t] = (x << 1) | (x >>> 31); }
    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4];
    for (let t = 0; t < 80; t++) {
      let f, k;
      if (t < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
      else if (t < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
      else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
      else { f = b ^ c ^ d; k = 0xCA62C1D6; }
      const tmp = ((((a << 5) | (a >>> 27)) + f + e + k + w[t]) >>> 0);
      e = d; d = c; c = (((b << 30) | (b >>> 2)) >>> 0); b = a; a = tmp;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0; h[4] = (h[4] + e) >>> 0;
  }
  const out = new Uint8Array(20); const odv = new DataView(out.buffer);
  h.forEach((v, i) => odv.setUint32(i * 4, v));
  return out;
}

export function hmacSha1(key, msg) {
  let k = key.length > 64 ? sha1(key) : key;
  const block = new Uint8Array(64); block.set(k);
  const ipad = block.map((x) => x ^ 0x36), opad = block.map((x) => x ^ 0x5c);
  const inner = new Uint8Array(64 + msg.length); inner.set(ipad); inner.set(msg, 64);
  const ih = sha1(inner);
  const outer = new Uint8Array(64 + 20); outer.set(opad); outer.set(ih, 64);
  return sha1(outer);
}

export function hotp(secretBytes, counter, digits = 6) {
  const msg = new Uint8Array(8); const dv = new DataView(msg.buffer);
  dv.setUint32(0, Math.floor(counter / 4294967296)); dv.setUint32(4, counter >>> 0);
  const h = hmacSha1(secretBytes, msg);
  const off = h[19] & 0xf;
  const bin = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(bin % Math.pow(10, digits)).padStart(digits, '0');
}

export const totp = (secretB32, timeMs = Date.now(), step = 30, digits = 6) =>
  hotp(base32Decode(secretB32), Math.floor(timeMs / 1000 / step), digits);

// ±1 қадам (30 сек) уақыт ауытқуына рұқсат
export function verifyTotp(secretB32, code, window = 1, timeMs = Date.now()) {
  if (!/^\d{6}$/.test(code || '')) return false;
  const key = base32Decode(secretB32);
  const counter = Math.floor(timeMs / 1000 / 30);
  for (let i = -window; i <= window; i++) if (hotp(key, counter + i) === code) return true;
  return false;
}

export const generateSecret = () => base32Encode(Crypto.getRandomBytes(20));
export const otpauthUri = (secret, email) =>
  `otpauth://totp/AgeWell:${encodeURIComponent(email)}?secret=${secret}&issuer=AgeWell&algorithm=SHA1&digits=6&period=30`;
export const secondsLeft = () => 30 - (Math.floor(Date.now() / 1000) % 30);

// Резервтік кодтар (8 таңбалы сандар)
export function generateBackupCodes(n = 8) {
  const codes = [];
  while (codes.length < n) {
    const b = Crypto.getRandomBytes(4);
    const v = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
    codes.push(String(v % 100000000).padStart(8, '0'));
  }
  return codes;
}
export const sha256 = (s) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s);
