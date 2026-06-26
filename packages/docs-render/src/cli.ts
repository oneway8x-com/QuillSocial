#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { renderImagesFromJson, renderPdfFromJson } from "./index";
import { resolveOut, mkdirp } from "./utils/file";
import { CarouselInput, DEFAULT_BRAND, DEFAULT_SIZE } from "./types";

export function normalizeInput(partial: Partial<CarouselInput>): CarouselInput {
  const size = { ...DEFAULT_SIZE, ...(partial.size || {}) };
  const brand = { ...DEFAULT_BRAND, ...(partial.brand || {}) };
  return {
    title: partial.title,
    slides: partial.slides || [],
    brand,
    output: { dir: partial.output?.dir || "./out", prefix: partial.output?.prefix || "linkedin", format: "png", dpi: partial.output?.dpi || 144 },
    size,
  };
}

async function run() {
  const program = new Command();
  program.name("quill-carousel").description("Render carousels to images or pdf");
  program.option("-i, --in <file>", "input json file");
  program.option("-o, --out <path>", "output dir or file");
  program.option("--size <WxH>", "size (e.g. 1080x1350)");
  program.option("--dsf <n>", "deviceScaleFactor", (v) => Number(v), DEFAULT_SIZE.deviceScaleFactor);
  program.option("--logo <text>", "logo text");
  program.option("--accent <hex>", "accent color");
  program.option("--bg <hex>", "background color");
  program.option("--fg <hex>", "foreground color");

  program.command("images").action(async (opts) => {
    const inFile = program.opts().in;
    const outDir = program.opts().out || "./out/ig";
    if (!inFile) {
      console.error("--in required");
      process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(inFile, "utf-8"));
    const normalized = normalizeInput(raw);
    normalized.output = { dir: outDir, prefix: normalized.output?.prefix || "slide", format: "png", dpi: normalized.output?.dpi };
    mkdirp(resolveOut(outDir));
    const files = await renderImagesFromJson(normalized);
    console.log("Wrote images:", files.join(", "));
  });

  program.command("pdf").action(async () => {
    const inFile = program.opts().in;
    const outFile = program.opts().out || "./out/linkedin.pdf";
    if (!inFile) {
      console.error("--in required");
      process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(inFile, "utf-8"));
    const normalized = normalizeInput(raw);
    if (outFile.endsWith(".pdf")) normalized.output = { dir: path.dirname(outFile), prefix: path.basename(outFile, ".pdf"), format: "png" };
    mkdirp(resolveOut(path.dirname(outFile)));
    const pdf = await renderPdfFromJson(normalized);
    console.log("Wrote pdf:", pdf);
  });

  await program.parseAsync(process.argv);
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export default run;
