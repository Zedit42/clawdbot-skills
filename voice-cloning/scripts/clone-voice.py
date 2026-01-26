#!/usr/bin/env python3
"""
Voice Cloning with XTTS v2
Usage: python clone-voice.py --sample voice.wav --text "Hello" --output out.wav
"""

import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description='Clone a voice using XTTS v2')
    parser.add_argument('--sample', required=True, help='Voice sample WAV file (6+ seconds)')
    parser.add_argument('--text', required=True, help='Text to speak in cloned voice')
    parser.add_argument('--output', required=True, help='Output audio file path')
    parser.add_argument('--language', default='en', help='Language code')
    
    args = parser.parse_args()
    
    try:
        from TTS.api import TTS
    except ImportError:
        print("Error: TTS not installed. Run: pip install TTS")
        sys.exit(1)
    
    import os
    if not os.path.exists(args.sample):
        print(f"Error: Sample file not found: {args.sample}")
        sys.exit(1)
    
    print("Loading XTTS v2 model (this may take a while on first run)...")
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
    
    print(f"Cloning voice from: {args.sample}")
    print(f"Generating: {args.text[:50]}...")
    
    tts.tts_to_file(
        text=args.text,
        file_path=args.output,
        speaker_wav=args.sample,
        language=args.language
    )
    
    print(f"✅ Saved to: {args.output}")

if __name__ == "__main__":
    main()
