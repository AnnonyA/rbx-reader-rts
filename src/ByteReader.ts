// src/ByteReader.ts
import assert from 'assert';
import lz4 from 'lz4js'; // usa los métodos compress/decompress de browser/node

function bufferToString(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 0x8000) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + 0x8000)));
  }
  return parts.join('');
}

export default class ByteReader extends Uint8Array {
  public index = 0;
  public chunkBuffer = new Uint8Array();

  constructor(buffer: ArrayBuffer | Uint8Array, byteOffset?: number, length?: number) {
    if (buffer instanceof Uint8Array) {
      length = buffer.byteLength;
      byteOffset = buffer.byteOffset;
      buffer = buffer.buffer;
    }
    assert(buffer instanceof ArrayBuffer, 'buffer debe ser ArrayBuffer');
    super(buffer, byteOffset, length);
  }

  SetIndex(n: number) { this.index = n; }
  GetIndex() { return this.index; }
  GetRemaining() { return this.length - this.index; }
  Jump(n: number) { this.index += n; }

  Array(n: number): Uint8Array {
    const result = new Uint8Array(this.buffer, (this.byteOffset || 0) + this.index, n);
    this.index += n;
    return result;
  }

  Match(signature: number[]): boolean {
    const start = this.index;
    for (let i = 0; i < signature.length; i++) {
      if (this[start + i] !== signature[i]) return false;
    }
    this.index += signature.length;
    return true;
  }

  Byte() { return this[this.index++]; }
  UInt8() { return this.Byte(); }
  UInt16LE() { return this.Byte() | (this.Byte() << 8); }
  UInt32LE() {
    return this.Byte() |
      (this.Byte() << 8) |
      (this.Byte() << 16) |
      (this.Byte() << 24);
  }

  private static parseFloatBits(bits: number): number {
    const exp = (bits >>> 23) & 0xFF;
    const mant = bits & 0x7FFFFF;
    if (exp === 0) return 0;
    const value = 2 ** (exp - 127) * (1 + mant / 0x7FFFFF);
    return (bits & 0x80000000) ? -value : value;
  }

  FloatLE() { return ByteReader.parseFloatBits(this.UInt32LE()); }

  String(len: number): string {
    return bufferToString(this.Array(len));
  }

  /**
   * Descomprime un bloque LZ4 según formato RBX.
   * Usa lz4js (framing LZ4).
   */
  LZ4(bufferOut?: Uint8Array): Uint8Array {
    const comLen = this.UInt32LE();
    const decLen = this.UInt32LE();
    this.Jump(4); // bytes reservados
    const compBlock = this.Array(comLen);
    const out = bufferOut && bufferOut.length >= decLen ? bufferOut : new Uint8Array(decLen);

    // Descomprime usando lz4js.decompress()
    const decoded = lz4.decompress(Array.from(compBlock)) as number[]; 
    const decArr = Uint8Array.from(decoded);
    if (decArr.length !== decLen) throw new Error('LZ4: tamaño inesperado tras descompresión');
    out.set(decArr, 0);
    return out;
  }
}
