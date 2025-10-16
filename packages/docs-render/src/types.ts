export interface BrandTheme {
  bg: string;
  fg: string;
  accent: string;
  logoText?: string;
  watermark?: string;
  padding?: number;
}

export interface Slide {
  heading: string;
  subheading?: string;
  bullets?: string[];
  imageUrl?: string;
  footnote?: string;
}

export interface CarouselInput {
  title?: string;
  slides: Slide[];
  brand?: BrandTheme;
  output?: {
    dir?: string;
    prefix?: string;
    format?: "png";
    dpi?: number;
  };
  size?: {
    width?: number;
    height?: number;
    deviceScaleFactor?: number;
  };
}

export const DEFAULT_BRAND: BrandTheme = {
  bg: "#F8F7FF",
  fg: "#1A1A2E",
  accent: "#7C3AED",
  logoText: "QuillSocial",
  padding: 72,
};

export const DEFAULT_SIZE = { width: 1080, height: 1350, deviceScaleFactor: 2 };
