#!/usr/bin/env python3
"""
Batch TTS Generator
Usage: python batch-tts.py input.txt output_dir/ [--model MODEL]

input.txt should have one line per audio file to generate.
"""

import argparse
import sys
import os

def main():
    parser = argparse.ArgumentParser(description='Batch generate TTS from text file')
    parser.add_argument('input', help='Input text file (one line per audio)')
    parser.add_argument('output_dir', help='Output directory for audio files')
    parser.add_argument('--model', default='tts_models/en/ljspeech/tacotron2-DDC',
                        help='TTS model to use')
    parser.add_argument('--format', default='wav', choices=['wav', 'mp3'],
                        help='Output format')
    
    args = parser.parse_args()
    
    try:
        from TTS.api import TTS
    except ImportError:
        print("Error: TTS not installed. Run: pip install TTS")
        sys.exit(1)
    
    if not os.path.exists(args.input):
        print(f"Error: Input file not found: {args.input}")
        sys.exit(1)
    
    os.makedirs(args.output_dir, exist_ok=True)
    
    with open(args.input, 'r') as f:
        lines = [l.strip() for l in f if l.strip()]
    
    print(f"Loading model: {args.model}")
    tts = TTS(model_name=args.model, progress_bar=False)
    
    print(f"Generating {len(lines)} audio files...")
    
    for i, text in enumerate(lines, 1):
        output_path = os.path.join(args.output_dir, f"{i:04d}.{args.format}")
        tts.tts_to_file(text=text, file_path=output_path)
        print(f"[{i}/{len(lines)}] {output_path}")
    
    print(f"\n✅ Done! Generated {len(lines)} files in {args.output_dir}/")

if __name__ == "__main__":
    main()
