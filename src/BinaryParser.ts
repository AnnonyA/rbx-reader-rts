// src/BinaryParser.ts
import ByteReader from './ByteReader';
import { ParserResult } from './types';

export interface Instance {
  id: number;
  className: string;
  properties: Record<string, any>;
  parent?: Instance | null;
}

export interface Group {
  ClassName: string;
  Objects: Instance[];
}

const BinaryParser = {
  HeaderBytes: [
    0x3c, 0x72, 0x6f, 0x62, 0x6c, 0x6f, 0x78, 0x21,
    0x89, 0xff, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00
  ],
  DataTypes: [
    null, 'string', 'bool', 'int', 'float', 'double',
    'UDim', 'UDim2', 'Ray', 'Faces', 'Axes',
    'BrickColor', 'Color3', 'Vector2', 'Vector3',
    'Vector2int16', 'CFrame', 'Quaternion', 'Enum',
    'Instance', 'Vector3int16', 'NumberSequence',
    'ColorSequence', 'NumberRange', 'Rect2D',
    'PhysicalProperties', 'Color3uint8', 'int64',
    'SharedString', 'UnknownScriptFormat', 'Optional', 'UniqueId'
  ],

  parse(buffer: ArrayBuffer | Uint8Array): ParserResult {
    const buf = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer).buffer;
    const reader = new ByteReader(buf);

    if (!reader.Match(this.HeaderBytes)) {
      throw new Error('Formato RBX inválido (header no coincide)');
    }

    const groupsCount = reader.UInt32LE();
    const instancesCount = reader.UInt32LE();
    reader.Jump(8);

    const parser: ParserResult = {
      reader,
      instances: [],
      groups: Array<Group | undefined>(groupsCount),
      sharedStrings: [],
      meta: {}
    };

    const chunkPositions: number[] = [];
    let maxChunkSize = 0;

    // Ubicar todos los chunks
    while (reader.GetRemaining() >= 4) {
      chunkPositions.push(reader.GetIndex());
      reader.String(4);
      const comLen = reader.UInt32LE();
      const decLen = reader.UInt32LE();

      reader.Jump(4 + (comLen || decLen));
      if (decLen > maxChunkSize) maxChunkSize = decLen;
    }

    reader.chunkBuffer = new Uint8Array(maxChunkSize);
    chunkPositions.forEach(pos => this.parseChunk(parser, pos));
    return parser;
  },

  parseChunk(parser: ParserResult, pos: number) {
    const r = parser.reader;
    r.SetIndex(pos);
    const label = r.String(4);
    if (label === 'END\0') return;

    const data = r.LZ4(parser.reader.chunkBuffer);
    const chunk = new ByteReader(data);
    switch (label) {
      case 'META': this.parseMETA(parser, chunk); break;
      case 'SSTR': this.parseSSTR(parser, chunk); break;
      case 'INST': this.parseINST(parser, chunk); break;
      case 'PROP': this.parsePROP(parser, chunk); break;
      case 'PRNT': this.parsePRNT(parser, chunk); break;
      default: break;
    }
  },

  parseMETA(parser: ParserResult, c: ByteReader) {
    const n = c.UInt32LE();
    for (let i = 0; i < n; i++) {
      const key = c.String(c.UInt32LE());
      const val = c.String(c.UInt32LE());
      parser.meta[key] = val;
    }
  },

  parseSSTR(parser: ParserResult, c: ByteReader) {
    c.UInt32LE(); // versión
    const count = c.UInt32LE();
    for (let i = 0; i < count; i++) {
      const md5 = c.Array(16);
      const len = c.UInt32LE();
      const str = c.String(len);
      parser.sharedStrings[i] = { md5, value: str };
    }
  },

  parseINST(parser: ParserResult, c: ByteReader) {
    const gid = c.UInt32LE();
    const cls = c.String(c.UInt32LE());
    c.Byte(); // isService
    const cnt = c.UInt32LE();

    const ids: number[] = [];
    let acc = 0;
    for (let i = 0; i < cnt; i++) {
      acc += c.UInt32LE();
      ids.push(acc);
    }

    const group: Group = { ClassName: cls, Objects: [] };
    parser.groups[gid] = group;

    ids.forEach(id => {
      const inst: Instance = { id, className: cls, properties: {} };
      group.Objects.push(inst);
      parser.instances[id] = inst;
    });
  },

  parsePROP(parser: ParserResult, c: ByteReader) {
    const gid = c.UInt32LE();
    const prop = c.String(c.UInt32LE());
    const group = parser.groups[gid];
    if (!group) return;

    const dt = c.Byte();
    const typeName = this.DataTypes[dt];
    const cnt = group.Objects.length;

    group.Objects.forEach(inst => {
      let val: any = null;
      switch (typeName) {
        case 'bool':
          val = c.Byte() !== 0; break;
        case 'int':
          val = c.UInt32LE(); break;
        case 'float':
          val = c.FloatLE(); break;
        case 'string':
          val = c.String(c.UInt32LE()); break;
        default:
          // más tipos por implementar...
          break;
      }
      inst.properties[prop] = val;
    });
  },

  parsePRNT(parser: ParserResult, c: ByteReader) {
    c.Byte();
    const cnt = c.UInt32LE();
    const childs: number[] = [];
    const parents: number[] = [];

    for (let i = 0; i < cnt; i++) childs.push(c.UInt32LE());
    for (let i = 0; i < cnt; i++) parents.push(c.UInt32LE());

    let idc = 0, idp = 0;
    for (let i = 0; i < cnt; i++) {
      idc += childs[i];
      idp += parents[i];
      const child = parser.instances[idc];
      child.parent = parser.instances[idp] || null;
    }
  }
};

export default BinaryParser;
