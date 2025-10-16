"""
Backup of the original moviepy.py which shadows the moviepy package.
Renamed to avoid import conflicts.
"""

from moviepy.editor import (
    ImageClip, AudioFileClip, CompositeVideoClip, concatenate_videoclips, vfx
)
