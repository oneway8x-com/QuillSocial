from openai import OpenAI
client = OpenAI(api_key="YOUR_API_KEY")

script = """
[HOOK - 0:00-0:05]
Let's dive into Object-Oriented Programming, or OOP!

[INTRODUCTION - 0:05-0:15]
OOP is a programming paradigm that uses objects to design applications.
It’s evolved significantly over the years!

[CORE PRINCIPLES - 0:15-0:30]
Key principles include:
Encapsulation — bundle data and methods.
Inheritance — create new classes from existing ones.
Polymorphism — use methods in different ways.
Abstraction — simplify complex realities.

[CALL TO ACTION - 0:30-0:60]
Ready to experiment with OOP in TypeScript?
Hit the like button and comment your thoughts below!
"""

audio = client.audio.speech.create(
    model="gpt-4o-mini-tts",  # OpenAI’s TTS model
    voice="alloy",            # voices: alloy, verse, shimmer, etc.
    input=script
)

with open("voiceover.mp3", "wb") as f:
    f.write(audio.read())
print("✅ Saved voiceover.mp3")
