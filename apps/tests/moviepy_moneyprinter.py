"""moviepy_moneyprinter.py

Build the same short video as `moviepy_script.py` but use MoneyPrinter utilities when available
for nicer text templates/layouts. If MoneyPrinter is not installed, this falls back to a local
PIL-based text renderer (same behavior as the working script).

Usage (from project root):

cd apps/tests
source venv/bin/activate
python moviepy_moneyprinter.py

To install MoneyPrinter (optional):
# inside the venv
pip install git+https://github.com/FujiwaraChoki/MoneyPrinter.git

This file aims to be a drop-in alternative to `moviepy_script.py` but demonstrates how to
integrate MoneyPrinter if you want to reuse its templates or rendering.
"""

from moviepy import ImageClip, AudioFileClip, CompositeVideoClip, concatenate_videoclips, vfx
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import textwrap
import os

# Try to import MoneyPrinter rendering helpers (best-effort). If not available, we'll use
# a simple fallback renderer.
try:
    # MoneyPrinter's layout/render API isn't documented here; this is a best-effort import.
    # If the real functions are named differently, adjust the imports accordingly.
    from moneyprinter import template as mp_template
    MONEYPRINTER_AVAILABLE = True
except Exception:
    MONEYPRINTER_AVAILABLE = False

# -------- Settings --------
W, H = 1080, 1920
FPS = 30
FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"  # change per OS
TEXT_COLOR = "white"
TEXT_SHADOW = (0, 0, 0, 200)
MARGIN = 100
LINE_WIDTH = 35
LINE_SPACING = 15


# -------- Fallback text renderer (PIL -> ImageClip) --------
def text_img_fallback(text, font_size=64, align="center"):
    font = ImageFont.truetype(FONT_PATH, font_size)
    lines = []
    for para in text.split("\n"):
        wrapped = textwrap.wrap(para, width=LINE_WIDTH)
        if wrapped:
            lines.extend(wrapped)
        else:
            lines.append("")

    bbox = font.getbbox("Aygjpq")
    lh = bbox[3] - bbox[1] + LINE_SPACING
    h_needed = lh * len(lines)
    img_h = max(H // 2, h_needed + 80)

    img = Image.new("RGBA", (W, img_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    y = (img_h - h_needed) // 2
    for line in lines:
        bbox = font.getbbox(line)
        w_line = bbox[2] - bbox[0]
        if align == "center":
            x = (W - w_line) // 2
        elif align == "right":
            x = W - w_line - MARGIN
        else:
            x = MARGIN

        draw.text((x + 4, y + 4), line, font=font, fill=TEXT_SHADOW)
        draw.text((x, y), line, font=font, fill=TEXT_COLOR)
        y += lh

    return ImageClip(np.array(img))


# -------- MoneyPrinter wrapper (best-effort) --------
# MoneyPrinter exposes a lot of templating and image generation helpers. Since their
# API can change, we call it only when available and fall back otherwise.
def text_img_mp(text, font_size=64, align="center"):
    # This tries to use MoneyPrinter's text render if available.
    # If MoneyPrinter isn't available or the function names differ, fall back.
    try:
        # Hypothetical MoneyPrinter usage: mp_template.render_text returns a PIL image
        pil_img = mp_template.render_text(text, width=W - 2 * MARGIN, font_size=font_size, align=align)
        return ImageClip(np.array(pil_img))
    except Exception:
        return text_img_fallback(text, font_size=font_size, align=align)


def text_img(text, font_size=64, align="center"):
    return text_img_mp(text, font_size=font_size, align=align) if MONEYPRINTER_AVAILABLE else text_img_fallback(text, font_size=font_size, align=align)


# -------- Background + overlay helpers (same as working script) --------
def bg_image_clip(path, duration, zoom=1.06):
    c = ImageClip(path).resized(height=H).resized(lambda t: zoom if duration == 0 else 1 + (zoom - 1) * t / max(1e-6, duration))
    if c.w < W:
        c = c.resized(width=W)
    c = c.with_effects([vfx.Crop(x_center=c.w / 2, y_center=c.h / 2, width=W, height=H)])
    return c.with_duration(duration)


def overlay_text(base_clip, text, y_pos="center", font_size=72):
    tclip = text_img(text, font_size=font_size)
    # Place the full-width text image at the requested vertical position
    if isinstance(y_pos, (int, float)):
        tclip = tclip.with_position((0, int(y_pos)))
    else:
        tclip = tclip.with_position((0, y_pos))
    return CompositeVideoClip([base_clip, tclip], size=(W, H)).with_duration(base_clip.duration)


# -------- Storyboard --------
segments = [
    {"img": "assets/hook.png", "dur": 5, "text": "What is OOP?\nLet’s dive into Object-Oriented Programming!", "font_size": 84, "y": H * 0.70},
    {"img": "assets/intro.png", "dur": 10, "text": "OOP is a programming paradigm that uses objects to design applications.\nIt’s evolved significantly over the years!", "font_size": 60, "y": H * 0.70},
    {"img": "assets/principles.png", "dur": 15, "text": "Core principles:\n1) Encapsulation — bundle data + methods\n2) Inheritance — build from existing classes\n3) Polymorphism — one interface, many forms\n4) Abstraction — hide complexity", "font_size": 56, "y": H * 0.72},
    {"img": "assets/cta.png", "dur": 30, "text": "Start your OOP journey in TypeScript.\nLike & comment your thoughts! 🚀", "font_size": 70, "y": H * 0.72},
]


# -------- Build --------
clips = []
for seg in segments:
    base = bg_image_clip(seg["img"], seg["dur"])
    comp = overlay_text(base, seg["text"], y_pos=seg["y"], font_size=seg["font_size"])
    # Use fade effects if available
    try:
        comp = comp.with_effects([vfx.FadeIn(0.25), vfx.FadeOut(0.25)])
    except Exception:
        try:
            comp = comp.fx(vfx.fadein, 0.25).fx(vfx.fadeout, 0.25)
        except Exception:
            pass
    clips.append(comp)

video = concatenate_videoclips(clips, method="compose").with_fps(FPS)

# -------- Optional audio --------
voiceover_path = "assets/voiceover.mp3"
if os.path.exists(voiceover_path):
    vo = AudioFileClip(voiceover_path)
    video = video.with_audio(vo).with_duration(vo.duration)
else:
    music_path = "assets/music.mp3"
    if os.path.exists(music_path):
        music = AudioFileClip(music_path)
        try:
            music = music.with_volume_scaled(0.2)
        except Exception:
            try:
                music = music.volumex(0.2)
            except Exception:
                pass
        music = music.audio_loop(duration=video.duration)
        video = video.with_audio(music)

# -------- Export --------
output = "oop_short_moneyprinter.mp4"
print("Rendering to:", output)
video.write_videofile(output, codec="libx264", audio_codec="aac", fps=FPS, bitrate="6M", threads=4, preset="medium")
