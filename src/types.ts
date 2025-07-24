// src/types.ts

import ByteReader from './ByteReader.ts';

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

export interface ParserResult {
  reader: ByteReader;
  instances: Instance[];
  groups: Array<Group | undefined>;
  sharedStrings: Array<{ md5: Uint8Array; value: string }>;
  meta: Record<string, string>;
}
