from moviepy.editor import (
    ImageClip, AudioFileClip, CompositeVideoClip, concatenate_videoclips, vfx
)
from PIL import Image, ImageDraw, ImageFont
import textwrap
import os

# -------- Settings --------
W, H = 1080, 1920
FPS = 30
FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"  # change per OS
TEXT_COLOR = "white"
TEXT_SHADOW = (0, 0, 0, 180)  # RGBA
MARGIN = 80
LINE_WIDTH = 22  # characters per line for wrapping

# -------- Helpers --------
def text_img(text, box_w=W - 2*MARGIN, box_h=None, font_size=64, align="center"):
    """Render multiline text to a transparent PIL image, then return as a MoviePy ImageClip."""
    if box_h is None:
        box_h = H // 2
    font = ImageFont.truetype(FONT_PATH, font_size)
    lines = []
    for para in text.split("\n"):
        lines.extend(textwrap.wrap(para, width=LINE_WIDTH) or [" "])

    # rough height calc
    lh = font.getbbox("Ay")[3] + 10
    h_needed = lh * len(lines)
    img = Image.new("RGBA", (box_w, max(box_h, h_needed + 40)), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # shadow first, then text
    def draw_line(s, y):
        # shadow
        draw.text((3, y+3), s, font=font, fill=TEXT_SHADOW, anchor="la")
        draw.text((0, y), s, font=font, fill=TEXT_COLOR, anchor="la")

    y = (img.size[1] - h_needed) // 2
    for line in lines:
        w_line = draw.textlength(line, font=font)
        if align == "center":
            x = (box_w - w_line) // 2
        elif align == "right":
            x = box_w - w_line
        else:
            x = 0
        draw_line(line, y)
        y += lh
    return ImageClip(img)

def bg_image_clip(path, duration, zoom=1.06):
    """Image full-screen, slight Ken Burns zoom-in."""
    c = ImageClip(path).resize(height=H).resize(lambda t: zoom if duration==0 else 1 + (zoom-1)*t/duration)
    # crop if needed to fill 1080x1920
    if c.w < W:
        c = c.resize(width=W)
    c = c.crop(x_center=c.w/2, y_center=c.h/2, width=W, height=H)
    return c.set_duration(duration)

def overlay_text(base_clip, text, y_pos="center", font_size=72):
    tclip = text_img(text, font_size=font_size)
    # position text box within margins
    x = MARGIN
    w = W - 2*MARGIN
    tclip = tclip.set_position(("center", y_pos)).resize(width=w)
    return CompositeVideoClip([base_clip, tclip], size=(W, H)).set_duration(base_clip.duration)

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
    comp = comp.fx(vfx.fadein, 0.25).fx(vfx.fadeout, 0.25)
    clips.append(comp)

video = concatenate_videoclips(clips, method="compose").set_fps(FPS)

# -------- Optional: voiceover (auto-trim video to VO length) --------
voiceover_path = "assets/voiceover.mp3"
if os.path.exists(voiceover_path):
    vo = AudioFileClip(voiceover_path)
    video = video.set_audio(vo).set_duration(vo.duration)
else:
    # Optional: background music under  -18 dB
    music_path = "assets/music.mp3"
    if os.path.exists(music_path):
        music = AudioFileClip(music_path).volumex(0.2)
        # loop bg to full length
        music = music.audio_loop(duration=video.duration)
        video = video.set_audio(music)

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
