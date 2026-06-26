import path from "path";
import fs from "fs";
import data from "./sample.json";
import { renderImagesFromJson, renderPdfFromJson } from "../src/index";

async function main() {
  const out = path.resolve(process.cwd(), "out");
  (data as any).output = { dir: out, prefix: "slide" };
  await renderImagesFromJson(data as any);
  await renderPdfFromJson(data as any);
}

if (require.main === module) main().catch(console.error);
