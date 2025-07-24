import BinaryParser, { ParserResult } from './BinaryParser';
import { extractAnimsAndSounds, AssetInfo } from './extractors/AnimSound';

/**
 * Parsea buffer RBX y devuelve instancias.
 */
export function parseRBX(buf: ArrayBuffer | Uint8Array): ParserResult {
  return BinaryParser.parse(buf);
}

export { extractAnimsAndSounds, AssetInfo };