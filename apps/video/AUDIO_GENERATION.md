# Audio Generation for Go2 Product Launch Video

## Current Status

The video currently has **placeholder audio files** (silent). To add professional voiceover and background music, follow the steps below.

## Voiceover Generation with Gemini TTS

### Prerequisites

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. The key should start with `AIzaSy...`

### Generate Voiceover

```bash
cd app/apps/video

# Set your Gemini API key
export GEMINI_API_KEY="AIzaSy..."

# Run the voiceover generation script
./scripts/generate-voiceover.sh
```

### Voiceover Script (for reference)

The script uses the following text with director's notes for a deep, authoritative male voice:

```
What if your links loaded before your users could blink?

Every millisecond matters. Slow redirects mean lost clicks, frustrated users, 
and missed opportunities.

Introducing Go2 — the edge-native link platform built for speed.

Sub-ten millisecond redirects. Real-time analytics. Custom domains. 
A developer API that actually makes sense.

Built on Cloudflare's edge network. Three hundred ten locations worldwide. 
Ninety-nine point nine nine percent uptime. Zero cold starts.

Your links deserve to be instant. Start free at go2 dot gg.
```

### Available Voices

- **Orus** - Firm, authoritative (default, recommended for product videos)
- **Charon** - Informative
- **Algenib** - Gravelly
- **Gacrux** - Mature
- **Sadaltager** - Knowledgeable

## Background Music Generation with AudioPod AI

### Using AudioPod AI API

```bash
cd app/apps/video

# Set your AudioPod API key
export AUDIOPOD_AI_API_KEY="ap_..."

# Run the BGM generation script
./scripts/generate-bgm.sh
```

### Alternative: Use Royalty-Free Music

If the API isn't working, you can:

1. Download royalty-free music from:
   - [Epidemic Sound](https://www.epidemicsound.com/)
   - [Artlist](https://artlist.io/)
   - [YouTube Audio Library](https://studio.youtube.com/channel/UC/music)

2. Save as `public/launch/background-music.mp3`

3. Recommended style: "Modern tech product launch, inspiring corporate background, 
   subtle electronic elements, 100 BPM, uplifting but not overpowering"

## Rendering with Audio

Once audio files are in place:

```bash
# Full render with audio
pnpm render:launch

# Preview without audio (faster)
pnpm render Go2ProductLaunchSilent out/preview.mp4
```

## Audio File Locations

```
app/apps/video/public/launch/
├── voiceover.mp3       # Professional voiceover (40 seconds)
└── background-music.mp3 # Background music (45 seconds, fades out)
```

## Timing Reference

| Scene | Time | Voiceover Content |
|-------|------|-------------------|
| Hook | 0-3s | "What if your links loaded before your users could blink?" |
| Problem | 3-8s | "Every millisecond matters..." |
| Solution | 8-13s | "Introducing Go2..." |
| Features | 13-28s | "Sub-ten millisecond redirects..." |
| Stats | 28-35s | "Built on Cloudflare's edge network..." |
| CTA | 35-40s | "Your links deserve to be instant..." |

## Tips

1. **Voiceover timing**: Aim for ~150 words per minute for comfortable pacing
2. **BGM volume**: Currently set to 25% to not overpower voiceover
3. **Fade out**: BGM fades out in the last 2 seconds automatically
