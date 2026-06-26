import fs from "fs";
import path from "path";

export function mkdirp(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function safeFilename(input: string) {
  return input.replace(/[^a-z0-9-_\.]/gi, "-").toLowerCase();
}

export function resolveOut(dirOrFile: string) {
  if (path.isAbsolute(dirOrFile)) return dirOrFile;
  return path.resolve(process.cwd(), dirOrFile);
}

export function writeFileSyncEnsure(filePath: string, buffer: Buffer | Uint8Array | string) {
  mkdirp(path.dirname(filePath));
  fs.writeFileSync(filePath, buffer as any);
}
