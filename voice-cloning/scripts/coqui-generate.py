#!/usr/bin/env python3
"""
Coqui TTS Generator
Usage: python coqui-generate.py "Text to speak" output.wav [--model MODEL_NAME]
"""

import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description='Generate speech with Coqui TTS')
    parser.add_argument('text', help='Text to convert to speech')
    parser.add_argument('output', help='Output audio file path')
    parser.add_argument('--model', default='tts_models/en/ljspeech/tacotron2-DDC',
                        help='TTS model to use')
    parser.add_argument('--language', default='en', help='Language code')
    
    args = parser.parse_args()
    
    try:
        from TTS.api import TTS
    except ImportError:
        print("Error: TTS not installed. Run: pip install TTS")
        sys.exit(1)
    
    print(f"Loading model: {args.model}")
    tts = TTS(model_name=args.model, progress_bar=True)
    
    print(f"Generating speech...")
    tts.tts_to_file(text=args.text, file_path=args.output)
    
    print(f"✅ Saved to: {args.output}")

if __name__ == "__main__":
    main()
