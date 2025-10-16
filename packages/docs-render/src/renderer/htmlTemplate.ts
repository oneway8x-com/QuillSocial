import { Slide, BrandTheme } from "../types";
import { escapeHtml, normalizeBullet } from "../utils/text";

export function toHTML(slide: Slide, brand?: BrandTheme, size?: { width: number; height: number }) {
  const b = brand || { bg: "#F8F7FF", fg: "#1A1A2E", accent: "#7C3AED", logoText: "QuillSocial", padding: 72 };
  const padding = b.padding ?? 72;
  const heading = escapeHtml(slide.heading);
  const sub = slide.subheading ? `<div class="sub">${escapeHtml(slide.subheading)}</div>` : "";
  const bullets = (slide.bullets || [])
    .map((t) => `<li><span class="dot"></span><span class="btext">${escapeHtml(normalizeBullet(t))}</span></li>`)
    .join("");
  const bulletsHtml = bullets ? `<ul class="bullets">${bullets}</ul>` : "";
  const foot = slide.footnote ? `<div class="foot">${escapeHtml(slide.footnote)}</div>` : "";

  // Create gradient background with accent color
  const gradientBg = `linear-gradient(135deg, ${b.bg} 0%, ${adjustColorBrightness(b.bg, -8)} 100%)`;

  // Detect if background is light or dark for adaptive styling
  const isLightBg = isLightColor(b.bg);
  const decorOpacity = isLightBg ? '08' : '15';
  const cardBg = isLightBg ? `${b.fg}04` : `${b.fg}06`;
  const borderOpacity = isLightBg ? '12' : '15';
  const shadowColor = isLightBg ? '00000015' : `${b.accent}20`;

  // Dynamic font sizing based on character count
  const headingLength = slide.heading.length;
  const subheadingLength = slide.subheading?.length || 0;
  const bulletTextLength = (slide.bullets || []).reduce((sum, b) => sum + b.length, 0);
  const avgBulletLength = slide.bullets?.length ? bulletTextLength / slide.bullets.length : 0;

  // Heading: scale down for longer text
  const headingSize = headingLength < 30 ? 90 :
                      headingLength < 50 ? 82 :
                      headingLength < 70 ? 74 : 68;

  // Subheading: scale based on length
  const subheadingSize = subheadingLength < 40 ? 44 :
                         subheadingLength < 60 ? 40 : 36;

  // Bullets: scale based on average length
  const bulletSize = avgBulletLength < 40 ? 48 :
                     avgBulletLength < 60 ? 44 :
                     avgBulletLength < 80 ? 40 : 38;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    html,body { margin: 0; padding: 0; height: 100%; }
    body {
      background: ${gradientBg};
      color: ${b.fg};
      font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Inter', 'SF Pro Display', Arial, sans-serif;
      position: relative;
      overflow: hidden;
    }

    /* Subtle decorative elements */
    body::before {
      content: '';
      position: absolute;
      top: -20%;
      right: -10%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, ${b.accent}${decorOpacity} 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    body::after {
      content: '';
      position: absolute;
      bottom: -25%;
      left: -15%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, ${b.accent}${decorOpacity} 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .frame {
      padding: ${padding}px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      z-index: 1;
    }

    .hero {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 32px;
      justify-content: center;
    }

    h1 {
      font-size: ${headingSize}px;
      font-weight: 800;
      letter-spacing: -2px;
      line-height: 1.05;
      margin: 0;
      color: ${b.fg};
      text-shadow: 0 2px 12px ${shadowColor};
    }

    .sub {
      font-size: ${subheadingSize}px;
      font-weight: 500;
      margin-top: 12px;
      opacity: 0.75;
      letter-spacing: -0.5px;
      line-height: 1.3;
      color: ${b.fg};
    }

    .bullets {
      list-style: none;
      padding: 0;
      margin: 32px 0;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .bullets li {
      font-size: ${bulletSize}px;
      font-weight: 500;
      line-height: 1.25;
      display: flex;
      align-items: flex-start;
      padding: 16px 24px;
      background: ${cardBg};
      border-radius: 16px;
      border-left: 4px solid ${b.accent};
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px ${shadowColor};
    }

    .dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${b.accent} 0%, ${adjustColorBrightness(b.accent, 30)} 100%);
      box-shadow: 0 4px 12px ${b.accent}40, 0 0 0 4px ${b.accent}20;
      display: inline-block;
      margin-right: 22px;
      margin-top: 16px;
      flex-shrink: 0;
    }

    .btext {
      flex: 1;
      letter-spacing: -0.3px;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      opacity: 0.6;
      padding-top: 24px;
      border-top: 2px solid ${b.fg}${borderOpacity};
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .foot {
      font-size: 14px;
      opacity: 0.8;
      margin-top: 12px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="frame">
    <div class="hero">
      <div>
        <h1>${heading}</h1>
        ${sub}
      </div>
      ${bulletsHtml}
    </div>
    <div class="footer">
      <div>${escapeHtml(b.logoText || "")}</div>
      <div>${new Date().getFullYear()}</div>
    </div>
    ${foot}
  </div>
</body>
</html>`;
}

// Helper to adjust color brightness for gradient effects
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

// Helper to detect if a color is light or dark
function isLightColor(hex: string): boolean {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export default toHTML;

