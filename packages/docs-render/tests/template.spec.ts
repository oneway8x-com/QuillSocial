import { toHTML } from '../src/renderer/htmlTemplate';
import { DEFAULT_BRAND } from '../src/types';

test('toHTML includes brand and escaped text', () => {
  const slide = { heading: '<Test & One>' } as any;
  const html = toHTML(slide, DEFAULT_BRAND);
  expect(html).toContain(DEFAULT_BRAND.bg);
  expect(html).toContain('&lt;Test &amp; One&gt;');
  expect(html).not.toMatch(/https?:\/\//);
});
