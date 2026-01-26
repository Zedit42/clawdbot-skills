---
name: voice-cloning
description: Local text-to-speech and voice cloning using free, open-source tools. Use when you need to generate speech audio, clone voices, or create voiceovers without paid APIs. Supports Coqui TTS, Bark, and Piper for high-quality local synthesis.
---

# Voice Cloning

Generate speech and clone voices locally without API costs.

## When to Use

- Need text-to-speech without paying for ElevenLabs/OpenAI
- Want to clone a voice from a sample
- Creating podcasts, voiceovers, or audio content
- Privacy-sensitive applications (no data leaves your machine)

## Quick Start

### Option 1: Coqui TTS (Best Quality)

```bash
# Install
pip install TTS

# List available models
tts --list_models

# Generate speech
tts --text "Hello, this is a test." --out_path output.wav

# Use specific model (recommended: XTTS v2)
tts --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
    --text "Hello world" \
    --out_path output.wav
```

### Option 2: Bark (Most Natural)

```bash
# Install
pip install git+https://github.com/suno-ai/bark.git

# Use via Python
python skills/voice-cloning/scripts/bark-generate.py "Your text here" output.wav
```

### Option 3: Piper (Fastest)

```bash
# Install
pip install piper-tts

# Generate (very fast, good for bulk)
echo "Hello world" | piper --model en_US-lessac-medium --output_file output.wav
```

## Voice Cloning (XTTS v2)

Clone any voice from a 6+ second audio sample:

```bash
python skills/voice-cloning/scripts/clone-voice.py \
    --sample voice_sample.wav \
    --text "Text to speak in cloned voice" \
    --output cloned_output.wav
```

## Available Scripts

### `scripts/coqui-generate.py`
Basic TTS generation with Coqui.

### `scripts/bark-generate.py`
Natural-sounding speech with Bark (slower but more expressive).

### `scripts/clone-voice.py`
Clone a voice from an audio sample using XTTS v2.

### `scripts/batch-tts.py`
Generate multiple audio files from a text file (one line = one file).

## Model Comparison

| Model | Quality | Speed | Voice Clone | Languages |
|-------|---------|-------|-------------|-----------|
| XTTS v2 | ★★★★★ | Slow | ✅ Yes | 16 |
| Bark | ★★★★★ | Very Slow | ❌ No | EN mainly |
| Piper | ★★★☆☆ | Very Fast | ❌ No | 30+ |

## Tips

1. **For quality**: Use XTTS v2 or Bark
2. **For speed**: Use Piper
3. **For cloning**: XTTS v2 is your only free option
4. **GPU recommended**: Bark and XTTS are slow on CPU

## Limitations

- First run downloads models (1-4 GB)
- GPU recommended for reasonable speed
- Voice cloning needs clean 6+ second sample
- Bark can hallucinate on long texts
