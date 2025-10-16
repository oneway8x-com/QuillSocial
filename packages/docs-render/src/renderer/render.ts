import path from "path";
import os from "os";
import fs from "fs";
import { PDFDocument } from "pdf-lib";
import { launchBrowser, closeBrowser } from "./browser";
import toHTML from "./htmlTemplate";
import { writeFileSyncEnsure, resolveOut, safeFilename } from "../utils/file";
import { CarouselInput, DEFAULT_BRAND, DEFAULT_SIZE } from "../types";

async function renderImages(input: CarouselInput): Promise<string[]> {
  const outDir = resolveOut(input.output?.dir || "./out/ig");
  writeFileSyncEnsure(path.join(outDir, ".keep"), "");
  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: input.size?.width || DEFAULT_SIZE.width, height: input.size?.height || DEFAULT_SIZE.height },
    deviceScaleFactor: input.size?.deviceScaleFactor || DEFAULT_SIZE.deviceScaleFactor,
  });

  const pngPaths: string[] = [];
  let i = 1;
  for (const slide of input.slides) {
    const page = await context.newPage();
    const html = toHTML(slide, input.brand || DEFAULT_BRAND, { width: input.size?.width || DEFAULT_SIZE.width, height: input.size?.height || DEFAULT_SIZE.height });
    await page.setContent(html, { waitUntil: "load" });
    const fname = `${(input.output?.prefix || "slide")}\_${String(i).padStart(2, "0")}.png`;
    const outPath = path.join(outDir, safeFilename(fname));
    await page.screenshot({ path: outPath, type: "png", fullPage: false });
    pngPaths.push(outPath);
    await page.close();
    i++;
  }

  await context.close();
  await closeBrowser();
  return pngPaths;
}

async function renderPdf(input: CarouselInput): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "qs-pdf-"));
  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: input.size?.width || DEFAULT_SIZE.width, height: input.size?.height || DEFAULT_SIZE.height },
    deviceScaleFactor: input.size?.deviceScaleFactor || DEFAULT_SIZE.deviceScaleFactor,
  });

  const pagePaths: string[] = [];
  let i = 1;
  for (const slide of input.slides) {
    const page = await context.newPage();
    const html = toHTML(slide, input.brand || DEFAULT_BRAND, { width: input.size?.width || DEFAULT_SIZE.width, height: input.size?.height || DEFAULT_SIZE.height });
    await page.setContent(html, { waitUntil: "load" });
    const outPath = path.join(tmpDir, `page-${i}.pdf`);
    await page.pdf({
      path: outPath,
      width: `${input.size?.width || DEFAULT_SIZE.width}px`,
      height: `${input.size?.height || DEFAULT_SIZE.height}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      pageRanges: '1'  // Only take the first page to avoid blank pages
    });
    pagePaths.push(outPath);
    await page.close();
    i++;
  }

  // merge - take only first page from each PDF to avoid duplicates
  const mergedPdf = await PDFDocument.create();
  for (const p of pagePaths) {
    const bytes = fs.readFileSync(p);
    const doc = await PDFDocument.load(bytes);
    // Only copy the first page (index 0)
    const [firstPage] = await mergedPdf.copyPages(doc, [0]);
    mergedPdf.addPage(firstPage);
  }

  const outFile = resolveOut(input.output?.dir || "./out") ;
  const finalPath = path.join(outFile, input.output?.prefix ? `${input.output.prefix}.pdf` : `linkedin.pdf`);
  writeFileSyncEnsure(finalPath, await mergedPdf.save());

  // cleanup
  for (const p of pagePaths) fs.unlinkSync(p);
  try {
    fs.rmdirSync(tmpDir);
  } catch (e) {}

  await context.close();
  await closeBrowser();
  return finalPath;
}

export { renderImages, renderPdf };
