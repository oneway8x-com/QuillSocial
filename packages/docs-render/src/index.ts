import { CarouselInput } from "./types";
import { renderImages as ri, renderPdf as rp } from "./renderer/render";
import fs from "fs";
import path from "path";
import { z } from "zod";

export async function renderImagesFromJson(input: CarouselInput): Promise<string[]> {
  validateInput(input);
  return ri(input);
}

export async function renderPdfFromJson(input: CarouselInput): Promise<string> {
  validateInput(input);
  return rp(input);
}

export { toHTML } from "./renderer/htmlTemplate";
export { normalizeInput } from "./cli";

function validateInput(input: CarouselInput) {
  if (!input.slides || input.slides.length < 1) throw new Error("Input must contain at least one slide");
  for (const s of input.slides) {
    if (!s.heading || typeof s.heading !== "string") throw new Error("Each slide must have a heading string");
  }

  const colorRegex = /^#([0-9A-Fa-f]{6})$/;
  const b = input.brand;
  if (b) {
    if (!colorRegex.test(b.bg)) throw new Error("brand.bg must be a hex color like #RRGGBB");
    if (!colorRegex.test(b.fg)) throw new Error("brand.fg must be a hex color like #RRGGBB");
    if (!colorRegex.test(b.accent)) throw new Error("brand.accent must be a hex color like #RRGGBB");
  }
}
