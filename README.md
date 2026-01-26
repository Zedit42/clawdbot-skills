# 🛠️ Clawdbot Skills Collection

A collection of free, open-source skills for [Clawdbot](https://github.com/clawdbot/clawdbot) - the AI agent framework.

These skills extend Clawdbot's capabilities without requiring paid APIs.

## 📦 Included Skills

| Skill | Description | Dependencies |
|-------|-------------|--------------|
| [browser-automation-pro](#-browser-automation-pro) | Cloudflare bypass, stealth scraping | Node.js, Puppeteer |
| [voice-cloning](#-voice-cloning) | Local TTS & voice cloning | Python, Coqui TTS |
| [n8n-automation](#-n8n-automation) | Workflow automation via n8n | Node.js, n8n |
| [web-scraping-pro](#-web-scraping-pro) | Advanced scraping with fallbacks | Node.js, Python |

---

## 🌐 Browser Automation Pro

Advanced browser automation that bypasses Cloudflare and other bot protections.

### Features
- ✅ Cloudflare bypass with stealth mode
- ✅ Puppeteer-extra with stealth plugin
- ✅ Batch fetching with rate limiting
- ✅ Random user agents and viewports

### Installation

```bash
cd browser-automation-pro
npm install puppeteer-extra puppeteer-extra-plugin-stealth puppeteer
```

### Usage

```bash
# Basic stealth fetch
node scripts/stealth-fetch.js "https://example.com"

# With screenshot
node scripts/stealth-fetch.js "https://example.com" --screenshot page.png

# Get HTML instead of text
node scripts/stealth-fetch.js "https://example.com" --html

# Batch fetch multiple URLs
echo "https://site1.com
https://site2.com" > urls.txt
node scripts/batch-fetch.js urls.txt --delay 3000 --output ./results
```

### Scripts

| Script | Description |
|--------|-------------|
| `stealth-fetch.js` | Single URL fetch with stealth mode |
| `real-browser.js` | Maximum stealth using real Chrome |
| `batch-fetch.js` | Batch fetch with delays and rotation |

---

## 🎙️ Voice Cloning

Local text-to-speech and voice cloning - no API costs!

### Features
- ✅ Multiple TTS engines (Coqui, Bark, Piper)
- ✅ Voice cloning from 6-second samples
- ✅ Batch generation
- ✅ 16+ languages supported

### Installation

```bash
# Coqui TTS (recommended)
pip install TTS

# Bark (most natural)
pip install git+https://github.com/suno-ai/bark.git

# Piper (fastest)
pip install piper-tts
```

### Usage

```bash
# Basic TTS with Coqui
python scripts/coqui-generate.py "Hello world" output.wav

# Natural speech with Bark
python scripts/bark-generate.py "Hello world" output.wav --voice v2/en_speaker_6

# Clone a voice (needs 6+ second sample)
python scripts/clone-voice.py \
  --sample my_voice.wav \
  --text "Text in cloned voice" \
  --output cloned.wav

# Batch generate from text file
python scripts/batch-tts.py lines.txt output_dir/
```

### Model Comparison

| Model | Quality | Speed | Clone Voice | GPU Needed |
|-------|---------|-------|-------------|------------|
| XTTS v2 | ★★★★★ | Slow | ✅ Yes | Recommended |
| Bark | ★★★★★ | Very Slow | ❌ No | Recommended |
| Piper | ★★★☆☆ | Very Fast | ❌ No | No |

### Scripts

| Script | Description |
|--------|-------------|
| `coqui-generate.py` | Basic TTS with Coqui |
| `bark-generate.py` | Natural speech with Bark |
| `clone-voice.py` | Voice cloning with XTTS v2 |
| `batch-tts.py` | Batch generate multiple files |

---

## ⚡ n8n Automation

Trigger and manage n8n workflows programmatically.

### Features
- ✅ Webhook triggering
- ✅ Workflow management via API
- ✅ Works with self-hosted (free) or cloud

### Prerequisites

```bash
# Self-hosted n8n with Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n

# Or via npm
npm install n8n -g && n8n start
```

### Usage

```bash
# Trigger a webhook
node scripts/trigger-webhook.js \
  --url "http://localhost:5678/webhook/your-id" \
  --data '{"message": "Hello from agent"}'

# List all workflows
N8N_API_KEY=your_key node scripts/n8n-api.js list

# Execute a workflow
N8N_API_KEY=your_key node scripts/n8n-api.js execute workflow_id

# Activate/deactivate
N8N_API_KEY=your_key node scripts/n8n-api.js activate workflow_id
```

### Scripts

| Script | Description |
|--------|-------------|
| `trigger-webhook.js` | Trigger any n8n webhook |
| `n8n-api.js` | Full API client for workflow management |

---

## 🕷️ Web Scraping Pro

Advanced scraping with multiple fallback methods.

### Features
- ✅ Jina Reader (free, easy)
- ✅ Crawl4AI (powerful, local)
- ✅ Firecrawl (reliable, freemium)
- ✅ Auto-fallback between methods

### Installation

```bash
# Jina - no install needed (API)

# Crawl4AI
pip install crawl4ai
playwright install

# Firecrawl - just need API key from https://firecrawl.dev
```

### Usage

```bash
# Jina Reader (easiest)
node scripts/jina-fetch.js "https://example.com"
node scripts/jina-fetch.js "https://example.com" --format text
node scripts/jina-fetch.js "https://example.com" --selector "main"

# Crawl4AI (most powerful)
python scripts/crawl4ai-fetch.py "https://example.com"
python scripts/crawl4ai-fetch.py "https://example.com" --stealth --wait 5000

# Firecrawl (needs API key)
FIRECRAWL_API_KEY=xxx node scripts/firecrawl-fetch.js "https://example.com"

# Auto-fallback (tries all methods)
node scripts/multi-fetch.js "https://example.com"
```

### Tool Comparison

| Tool | Cloudflare | JS Render | Speed | Cost |
|------|------------|-----------|-------|------|
| Jina Reader | ⭕ Some | ✅ Yes | Fast | Free |
| Crawl4AI | ✅ Yes | ✅ Yes | Slow | Free |
| Firecrawl | ✅ Yes | ✅ Yes | Fast | Freemium |

### Scripts

| Script | Description |
|--------|-------------|
| `jina-fetch.js` | Fetch via Jina Reader API |
| `crawl4ai-fetch.py` | Full browser scraping |
| `firecrawl-fetch.js` | Firecrawl API client |
| `multi-fetch.js` | Auto-fallback between methods |

---

## 🚀 Installation

### Install All Skills

```bash
git clone https://github.com/zedit42/clawdbot-skills.git
cd clawdbot-skills

# Node.js dependencies
npm install

# Python dependencies
pip install -r requirements.txt
```

### Install for Clawdbot

Copy skills to your Clawdbot skills directory:

```bash
cp -r browser-automation-pro ~/.clawdbot/skills/
cp -r voice-cloning ~/.clawdbot/skills/
cp -r n8n-automation ~/.clawdbot/skills/
cp -r web-scraping-pro ~/.clawdbot/skills/
```

Or symlink:

```bash
ln -s $(pwd)/browser-automation-pro ~/.clawdbot/skills/
# ... etc
```

---

## 📋 Requirements

### System
- Node.js 18+
- Python 3.9+
- Chrome/Chromium (for browser automation)

### Node.js Packages
```
puppeteer
puppeteer-extra
puppeteer-extra-plugin-stealth
```

### Python Packages
```
TTS
crawl4ai
playwright
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a skill following the [skill-creator guide](https://docs.clawd.bot/skills)
3. Test thoroughly
4. Submit a PR

---

## 📄 License

MIT License - Use freely, attribution appreciated.

---

## 🔗 Links

- [Clawdbot](https://github.com/clawdbot/clawdbot) - The AI agent framework
- [Clawdbot Docs](https://docs.clawd.bot) - Documentation
- [ClawdHub](https://clawdhub.com) - Find more skills

---

Made with ⚡ by [@zedit42](https://github.com/zedit42)
