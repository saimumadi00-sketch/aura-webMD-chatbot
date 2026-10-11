// Validate decoded size, format headers, and dimensions before sending image data upstream.
// This is not a full image decoder; do not use this check to authorize executable uploads.
export function validImageDataURL(value) {
  if (typeof value !== 'string' || value.length > 700000) return false;
  const match = value.match(/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return false;
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 512 * 1024 || bytes.toString('base64') !== match[2]) return false;
  const dimensions = (w, h) => w > 0 && h > 0 && w <= 8192 && h <= 8192 && w * h <= 16000000;
  if (match[1] === 'png') {
    return bytes.length >= 45 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) &&
      bytes.readUInt32BE(8) === 13 && bytes.toString('latin1', 12, 16) === 'IHDR' &&
      dimensions(bytes.readUInt32BE(16), bytes.readUInt32BE(20)) &&
      bytes.readUInt32BE(bytes.length - 12) === 0 && bytes.toString('latin1', bytes.length - 8, bytes.length - 4) === 'IEND';
  }
  if (match[1] === 'gif') {
    return bytes.length >= 14 && ['GIF87a', 'GIF89a'].includes(bytes.toString('latin1', 0, 6)) &&
      dimensions(bytes.readUInt16LE(6), bytes.readUInt16LE(8)) && bytes.at(-1) === 0x3b;
  }
  if (match[1] === 'jpeg') {
    if (bytes.length < 4 || bytes.readUInt16BE(0) !== 0xffd8 || bytes.readUInt16BE(bytes.length - 2) !== 0xffd9) return false;
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 0xff) return false;
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) return false;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) return false;
      const length = bytes.readUInt16BE(offset);
      if (length < 2 || offset + length > bytes.length) return false;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return length >= 8 && dimensions(bytes.readUInt16BE(offset + 5), bytes.readUInt16BE(offset + 3));
      }
      offset += length;
    }
    return false;
  }
  if (bytes.length < 30 || bytes.toString('latin1', 0, 4) !== 'RIFF' || bytes.readUInt32LE(4) !== bytes.length - 8 || bytes.toString('latin1', 8, 12) !== 'WEBP') return false;
  const type = bytes.toString('latin1', 12, 16);
  const length = bytes.readUInt32LE(16);
  if (20 + length > bytes.length) return false;
  if (type === 'VP8X') return length === 10 && dimensions(1 + bytes.readUIntLE(24, 3), 1 + bytes.readUIntLE(27, 3));
  if (type === 'VP8 ') return length >= 10 && bytes.subarray(23, 26).equals(Buffer.from([0x9d, 0x01, 0x2a])) && dimensions(bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff);
  if (type === 'VP8L') {
    if (length < 5 || bytes[20] !== 0x2f) return false;
    const bits = bytes.readUInt32LE(21);
    return (bits >>> 29) === 0 && dimensions(1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff));
  }
  return false;
}
