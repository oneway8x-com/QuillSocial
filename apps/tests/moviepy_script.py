from moviepy import ImageClip, AudioFileClip, CompositeVideoClip, concatenate_videoclips, vfx
from PIL import Image, ImageDraw, ImageFont
import textwrap
import os
import numpy as np

# -------- Settings --------
W, H = 1080, 1920
FPS = 30
FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"  # change per OS
TEXT_COLOR = "white"
TEXT_SHADOW = (0, 0, 0, 200)  # RGBA
MARGIN = 100
LINE_WIDTH = 35  # characters per line for wrapping
LINE_SPACING = 15  # extra spacing between lines

# -------- Helpers --------
def text_img(text, box_w=W - 2*MARGIN, box_h=None, font_size=64, align="center"):
    """Render multiline text to a transparent PIL image, then return as a MoviePy ImageClip."""
    if box_h is None:
        box_h = H // 2
    font = ImageFont.truetype(FONT_PATH, font_size)
    lines = []
    for para in text.split("\n"):
        wrapped = textwrap.wrap(para, width=LINE_WIDTH)
        if wrapped:
            lines.extend(wrapped)
        else:
            lines.append("")  # preserve empty lines

    # Calculate line height with better spacing
    bbox = font.getbbox("Aygjpq")  # Use characters with ascenders and descenders
    lh = bbox[3] - bbox[1] + LINE_SPACING
    h_needed = lh * len(lines)

    # Create image with FULL video width and appropriate height
    img = Image.new("RGBA", (W, max(box_h, h_needed + 80)), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Start y position (centered vertically in the image)
    y = (img.size[1] - h_needed) // 2

    for line in lines:
        # Calculate text width for this line
        bbox = font.getbbox(line)
        w_line = bbox[2] - bbox[0]

        # Center text horizontally on the full width
        if align == "center":
            x = (W - w_line) // 2
        elif align == "right":
            x = W - w_line - MARGIN
        else:
            x = MARGIN

        # Draw shadow (offset by 4 pixels for better visibility)
        draw.text((x + 4, y + 4), line, font=font, fill=TEXT_SHADOW)
        # Draw main text
        draw.text((x, y), line, font=font, fill=TEXT_COLOR)

        y += lh

    return ImageClip(np.array(img))

def bg_image_clip(path, duration, zoom=1.06):
    """Image full-screen, slight Ken Burns zoom-in."""
    # ImageClip API in this moviepy distribution uses 'resized' for resizing
    c = ImageClip(path).resized(height=H).resized(lambda t: zoom if duration==0 else 1 + (zoom-1)*t/duration)
    # crop if needed to fill 1080x1920
    if c.w < W:
        c = c.resized(width=W)
    # Use the Crop effect available in this moviepy distribution
    c = c.with_effects([vfx.Crop(x_center=c.w/2, y_center=c.h/2, width=W, height=H)])
    return c.with_duration(duration)

def overlay_text(base_clip, text, y_pos="center", font_size=72):
    tclip = text_img(text, font_size=font_size)
    # Position text at specified y position, x is already centered in the image
    if isinstance(y_pos, (int, float)):
        # If y_pos is a number, use it as absolute position
        tclip = tclip.with_position((0, int(y_pos)))
    else:
        # If y_pos is a string like "center", "top", "bottom"
        tclip = tclip.with_position((0, y_pos))
    return CompositeVideoClip([base_clip, tclip], size=(W, H)).with_duration(base_clip.duration)

# -------- Your storyboard (images + text + durations) --------
segments = [
    # HOOK (0:00–0:05)
    {
        "img": "assets/hook.png",
        "dur": 5,
        "text": "What is OOP?\nLet’s dive into Object-Oriented Programming!",
        "font_size": 84,
        "y": H*0.70
    },
    # INTRO (0:05–0:15)
    {
        "img": "assets/intro.png",
        "dur": 10,
        "text": "OOP is a programming paradigm that uses objects to design applications.\nIt’s evolved significantly over the years!",
        "font_size": 60,
        "y": H*0.70
    },
    # CORE PRINCIPLES (0:15–0:30)
    {
        "img": "assets/principles.png",
        "dur": 15,
        "text": "Core principles:\n1) Encapsulation — bundle data + methods\n2) Inheritance — build from existing classes\n3) Polymorphism — one interface, many forms\n4) Abstraction — hide complexity",
        "font_size": 56,
        "y": H*0.72
    },
    # CTA (0:30–0:60)
    {
        "img": "assets/cta.png",
        "dur": 30,
        "text": "Start your OOP journey in TypeScript.\nLike & comment your thoughts! 🚀",
        "font_size": 70,
        "y": H*0.72
    },
]

# -------- Build video --------
clips = []
for seg in segments:
    base = bg_image_clip(seg["img"], seg["dur"])
    comp = overlay_text(base, seg["text"], y_pos=seg["y"], font_size=seg["font_size"])
    comp = comp.with_effects([vfx.FadeIn(0.25), vfx.FadeOut(0.25)])
    clips.append(comp)

video = concatenate_videoclips(clips, method="compose").with_fps(FPS)

# -------- Optional: voiceover (auto-trim video to VO length) --------
voiceover_path = "assets/voiceover.mp3"
if os.path.exists(voiceover_path):
    vo = AudioFileClip(voiceover_path)
    video = video.with_audio(vo).with_duration(vo.duration)
else:
    # Optional: background music under  -18 dB
    music_path = "assets/music.mp3"
    if os.path.exists(music_path):
        music = AudioFileClip(music_path).with_volume_scaled(0.2)
        # loop bg to full length
        music = music.audio_loop(duration=video.duration)
        video = video.with_audio(music)

# -------- Export (YouTube Shorts / Reels / TikTok ready) --------
video.write_videofile(
    "oop_short.mp4",
    codec="libx264",
    audio_codec="aac",
    fps=FPS,
    bitrate="6M",
    threads=4,
    preset="medium"
)
