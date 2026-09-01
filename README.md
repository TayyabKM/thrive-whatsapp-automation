# Thrive WhatsApp Automation Dashboard

A WhatsApp message monitoring and analytics dashboard built for Thrive — by MMT Consulting.

## Overview

This dashboard connects to the WhatsApp Business API (or any compatible adapter) and gives the client a single-view interface to:

- View all incoming/outgoing WhatsApp messages
- See conversation summaries and highlights
- Track message statistics and response times
- Flag and filter important messages
- Never miss critical communications

## Project Structure

```
thrive-whatsapp/
├── frontend/          # Next.js dashboard (port 3000)
│   ├── src/
│   │   ├── app/       # Next.js App Router pages
│   │   ├── components/  # UI components
│   │   └── lib/       # API client, utilities
│   └── ...
├── backend/           # Node.js/Express API (port 4000)
│   ├── src/
│   │   ├── adapters/  # WhatsApp API adapter (plug-in point)
│   │   ├── routes/    # API routes
│   │   └── index.js   # Entry point
│   └── ...
└── README.md
```

## Getting Started

### 1. Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Set up environment variables
```bash
# backend/.env
PORT=4000
WHATSAPP_API_TOKEN=your_token_here     # plug in when ready
WHATSAPP_PHONE_NUMBER_ID=your_id_here  # plug in when ready
```

### 3. Run development servers
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## WhatsApp API Integration

The backend uses an **adapter pattern** — all WhatsApp API logic lives in `backend/src/adapters/whatsapp.js`. To switch from mock data to a real API:

1. Open `backend/src/adapters/whatsapp.js`
2. Replace the mock functions with real API calls (Meta, Twilio, etc.)
3. Add your credentials to `backend/.env`
4. The rest of the app requires zero changes

## Built With

- **Frontend:** Next.js 14, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express
- **Planned Integration:** Meta WhatsApp Business API / Twilio

---
*Built by MMT Consulting*
