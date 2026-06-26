import fs from 'fs';
import path from 'path';
import { renderImagesFromJson, renderPdfFromJson } from '../src/index';
import sample from '../examples/sample.json';
import sharp from 'sharp';

test('render images and pdf (smoke)', async () => {
  // skip if playwright not available in the test environment
  let playwrightAvailable = true;
  try {
    require.resolve('playwright');
  } catch (e) {
    playwrightAvailable = false;
  }
  if (!playwrightAvailable) {
    console.warn('playwright not installed - skipping render tests');
    return;
  }

  const outDir = path.resolve(__dirname, '../out_test');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  (sample as any).output = { dir: outDir, prefix: 'slide' };

  const imgs = await renderImagesFromJson(sample as any);
  expect(imgs.length).toBeGreaterThan(0);
  for (const img of imgs) {
    const buf = fs.readFileSync(img);
    const meta = await sharp(buf).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1350);
  }

  const pdfPath = await renderPdfFromJson(sample as any);
  expect(fs.existsSync(pdfPath)).toBe(true);
});
