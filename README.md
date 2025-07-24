# rbx-reader-rts

A modern TypeScript library for **parsing Roblox binary files** (`.rbxm`, `.rbxl`) in Node.js or the browser. Extracts all instances, properties, and makes it easy to retrieve **Animation IDs**, **Sound IDs**, and other asset references.

---

## Features

- ⚡ Fast binary parsing of Roblox `.rbxm`/`.rbxl` files
- 🏷️ Access all instances, class names, and properties
- 🎬 Extract all Animation IDs (finds numeric IDs in any format)
- 🔊 Extract Sound IDs the same way
- 🛠️ Written in TypeScript, ESM & CommonJS compatible
- 🧩 Extendable: add your own property or asset extractors

---

## Installation

```bash
npm install rbx-reader-rts
```

---

## Basic Usage

```ts
import { parseRBX, extractAnimsAndSounds } from 'rbx-reader-rts';
import fs from 'fs';

// Read a binary Roblox file
const buf = fs.readFileSync('your-model.rbxm');

// Parse all instances and properties
const { instances } = parseRBX(buf);

// Extract Animation and Sound asset IDs
const assets = extractAnimsAndSounds(instances);
console.log(assets);
/*
[
  { id: 13, className: "Animation", animationId: "6318908775" },
  { id: 28, className: "Sound", soundId: "1840932831" }
]
*/
```

---

## API

### `parseRBX(buffer: ArrayBuffer | Uint8Array): ParserResult`
- Parses the binary `.rbxm`/`.rbxl` buffer.
- Returns all parsed instances, groups, meta, etc.

### `extractAnimsAndSounds(instances: Instance[]): AssetInfo[]`
- Scans all parsed instances.
- Returns an array of detected `Animation` and `Sound` asset IDs.

#### `AssetInfo` type:

```ts
interface AssetInfo {
  id: number;
  className: string;         // "Animation" or "Sound"
  animationId?: string;      // Numeric ID if className === "Animation"
  soundId?: string;          // Numeric ID if className === "Sound"
}
```

---

## Why use this?

- **Automation**: Quickly scan hundreds of Roblox files for asset references (animations, sounds, etc).
- **Asset tracking**: Build tools for asset auditing, dependency trees, or asset replacement.
- **Research**: Analyze how assets are referenced inside Roblox binary files.

---

## Project structure

```
rbx-reader-rts/
├─ src/
│  ├─ ByteReader.ts
│  ├─ BinaryParser.ts
│  ├─ extractors/
│  │  └─ AnimSound.ts
│  └─ index.ts
├─ README.md
├─ package.json
└─ tsconfig.json
```

---

## License

MIT © RTSpoofer Team

---

**Pull requests and issues are welcome!**
