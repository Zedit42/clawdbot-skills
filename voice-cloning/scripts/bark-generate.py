#!/usr/bin/env python3
"""
Bark TTS Generator - Natural sounding speech
Usage: python bark-generate.py "Text to speak" output.wav [--voice v2/en_speaker_6]
"""

import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description='Generate natural speech with Bark')
    parser.add_argument('text', help='Text to convert to speech')
    parser.add_argument('output', help='Output audio file path')
    parser.add_argument('--voice', default='v2/en_speaker_6',
                        help='Voice preset (e.g., v2/en_speaker_0 to v2/en_speaker_9)')
    
    args = parser.parse_args()
    
    try:
        from bark import SAMPLE_RATE, generate_audio, preload_models
        from scipy.io.wavfile import write as write_wav
        import numpy as np
    except ImportError:
        print("Error: Bark not installed. Run: pip install git+https://github.com/suno-ai/bark.git")
        sys.exit(1)
    
    print("Loading Bark models (this may take a while on first run)...")
    preload_models()
    
    print(f"Generating speech with voice: {args.voice}")
    audio_array = generate_audio(args.text, history_prompt=args.voice)
    
    # Normalize and save
    audio_array = np.int16(audio_array * 32767)
    write_wav(args.output, SAMPLE_RATE, audio_array)
    
    print(f"✅ Saved to: {args.output}")

if __name__ == "__main__":
    main()
