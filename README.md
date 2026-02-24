# Saphira AI

**Pan-African Professional Communication Platform**

Practice interviews, presentations, and meetings with AI that understands African professional contexts.

![Saphira](https://img.shields.io/badge/Saphira-AI%20Interview%20Platform-8B5A2B)

## Features

- 🎤 **Voice-First AI** - Natural conversations with realistic African accents
- 👥 **Multi-Persona Panels** - Practice with CEOs, HR, Technical Leads
- 🌍 **Pan-African Context** - Nigeria, Kenya, South Africa cultural adaptation
- ⚡ **Real-time Feedback** - Instant scoring and improvement tips
- 🎯 **Multiple Scenarios** - Job interviews, pitches, board meetings, embassy interviews

## Supported Countries

- 🇳🇬 **Nigeria** - Full support with Nigerian voices and cultural context
- 🇰🇪 **Kenya** - Kenyan professional communication patterns
- 🇿🇦 **South Africa** - South African business context

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **AI**: OpenAI GPT-4o
- **Voice**: ElevenLabs API
- **Database**: Supabase (PostgreSQL + Auth)
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/runcor-io/Saphira.git
cd Saphira/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open http://localhost:3000 to view the app.

## Environment Variables

See `.env.example` for required environment variables.

### Required APIs

1. **OpenAI** - For AI interview generation (https://platform.openai.com)
2. **ElevenLabs** - For voice synthesis (https://elevenlabs.io)
3. **Supabase** - For database and authentication (https://supabase.com)

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/runcor-io/Saphira)

Or manually:

```bash
npm i -g vercel
vercel
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Project Structure

```
saphire/
├── frontend/           # Next.js application
│   ├── app/           # App router pages
│   ├── components/    # React components
│   ├── lib/           # Utility functions
│   │   └── saphira/   # Core interview engine
│   └── public/        # Static assets
└── DEPLOYMENT.md      # Deployment guide
```

## Core Modules

- `panelEngine.ts` - Interview session management
- `questionGenerator.ts` - AI question generation
- `datasetService.ts` - Pan-African dataset integration
- `voiceService.ts` - Voice synthesis management
- `culturalDetector.ts` - Cultural context detection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)

## Support

For support, email hello@saphira.ai or join our community.

---

Built with ❤️ for African professionals
