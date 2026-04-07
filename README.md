# Crack SMS v20 — Professional Edition

## 🎯 Overview

**Crack SMS v20** is an enterprise-grade Telegram OTP bot with professional WhatsApp bridge integration, supporting multiple pairing modes (QR Code, Pairing Codes, Phone Number Linking) and advanced admin controls.

**Version:** 20.0.0  
**Release Date:** April 7, 2026  
**Status:** ✅ Production Ready  

---

## 🚀 Key Features

### Telegram Bot (Python)
- ✅ **Admin Panel** — Comprehensive admin controls
- ✅ **Multi-Panel Support** — Manage multiple OTP providers
- ✅ **Child Bots** — Spawn and manage secondary bots
- ✅ **OTP Management** — Automatic OTP capture and forwarding
- ✅ **22+ Commands** — Full command suite for all operations
- ✅ **Professional Logging** — Structured, colored console output
- ✅ **Permission System** — Role-based access control
- ✅ **Child Bot Manager** — Create, manage, monitor child bots

### Premium Features (v20+) 💎
- ✅ **Premium Tiers** — Free/Pro/Enterprise with feature gating
- ✅ **Analytics Dashboard** — Real-time OTP and panel statistics
- ✅ **Webhook Integration** — HTTP callbacks for OTP events
- ✅ **Message Scheduling** — Schedule WhatsApp messages for later
- ✅ **Media Support** — Send images, PDFs to WhatsApp
- ✅ **Rate Limiting** — Per-phone device fingerprinting & anti-fraud
- ✅ **Message Templates** — Reusable message templates with variables

### WhatsApp Bridge (Node.js)
- ✅ **Multi-Mode Pairing**
  - QR Code (traditional)
  - 6-digit Pairing Codes (multi-device, 10-minute validity)
  - Phone Number Direct Linking (no QR needed)
- ✅ **10 OTP GUI Styles** — Professional, themed OTP messages
- ✅ **Health Monitoring** — Real-time status endpoint
- ✅ **Auto-Reconnection** — Intelligent retry with exponential backoff
- ✅ **State Persistence** — Survives restarts
- ✅ **Professional Logging** — Chalk-colored, structured levels
- ✅ **HTTP Endpoints** — /forward_otp, /control, /health

### WhatsApp Premium Features 🏆
- ✅ **Group Management** — Create and manage WhatsApp groups
- ✅ **Broadcast Lists** — Send to multiple recipients
- ✅ **Message Scheduling** — Queue messages for future delivery
- ✅ **Media Attachments** — Send images, documents via WhatsApp
- ✅ **Rate Limiting** — Configurable OTP velocity limits
- ✅ **Anti-Fraud Engine** — Device fingerprinting & anomaly detection

### Integration Features
- ✅ **Bidirectional Communication** — HTTP-based Python ↔ Node.js
- ✅ **Health Checks** — Auto-monitoring every 30 seconds
- ✅ **Error Recovery** — Graceful degradation, no service interruption
- ✅ **Admin Commands** — /wastatus, /wapair for WhatsApp control
- ✅ **Premium Commands** — /premium, /analytics, /webhook, /schedule

---

## 📋 System Requirements

### Core
- Python 3.9 or higher
- Node.js 18 or higher
- SQLite3 (included with Python)
- 512MB RAM minimum (1GB recommended)

### Dependencies
- See `requirements.txt` for Python packages
- See `package.json` for Node.js packages

### Deployment Options
- Local machine (development/testing)
- VPS/Dedicated server (production)
- Railway.app (via railway.toml)
- Docker containers (optional)

---

## 🔧 Installation

### 1. Python Bot
```bash
# Clone/download repository
cd /path/to/crack-sms

# Install Python dependencies
pip install -r requirements.txt

# Configure environment (optional)
export BOT_TOKEN="your_telegram_bot_token"
export BOT_USERNAME="your_bot_username"

# Run bot
python bot.py
```

### 2. WhatsApp Bridge (Separate Terminal/Machine)
```bash
# Install Node.js dependencies
npm install

# Configure pairing mode (default: qr)
export WA_PAIRING_MODE=code              # or: phone, qr
export WA_PHONE_NUMBER=+1234567890       # for phone mode
export WA_LOG_LEVEL=info                 # debug, info, warn, error
export WA_BRIDGE_PORT=7891               # default port

# Run bridge
node whatsapp_otp.js
```

---

## 🔐 WhatsApp Pairing Modes

### 1. QR Code (Recommended for Quick Setup)
```bash
node whatsapp_otp.js
# Scan QR code from terminal with WhatsApp on mobile
```

### 2. Pairing Code (Recommended for Production)
```bash
export WA_PAIRING_MODE=code
node whatsapp_otp.js
# Use code in WhatsApp: Linked Devices → Link Device → Use Pairing Code
```

### 3. Phone Number (Direct Linking)
```bash
export WA_PAIRING_MODE=phone
export WA_PHONE_NUMBER=+1234567890
node whatsapp_otp.js
# Phone number automatically used for linking
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────┐
│           TELEGRAM BOT (Python)                     │
│  • Admin Panel                                      │
│  • 22+ Command Handlers                             │
│  • OTP Capture & Processing                         │
│  • Professional Logging                             │
├─────────────────────────────────────────────────────┤
│   HTTP Bridge (JSON over REST/TCP)                  │
│   • POST /forward_otp (OTP → WhatsApp)              │
│   • POST /control (Admin commands)                  │
│   • GET /health (Status monitoring)                 │
├─────────────────────────────────────────────────────┤
│       WHATSAPP BRIDGE (Node.js)                     │
│  • Multi-mode Pairing                               │
│  • 10 GUI Styles                                    │
│  • State Persistence                                │
│  • Professional Logging                             │
├─────────────────────────────────────────────────────┤
│      WHATSAPP (via Baileys)                         │
│  • Real WhatsApp Account                            │
│  • Direct Message Sending                           │
│  • Multi-device Support                             │
└─────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints

### WhatsApp Bridge

#### POST /forward_otp
Forward OTP to configured WhatsApp group
```bash
curl -X POST http://127.0.0.1:7891/forward_otp \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "flag": "🇵🇰",
    "region": "Pakistan",
    "svc": "WhatsApp",
    "number": "923001234567",
    "otp": "491138",
    "msgBody": "Your WhatsApp verification code...",
    "botTag": "@CrackSMSReBot"
  }'
```

#### POST /control
Admin control actions
```bash
# Get status
curl -X POST http://127.0.0.1:7891/control \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "action": "status"
  }'

# Enable forwarding
curl -X POST http://127.0.0.1:7891/control \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "action": "on"
  }'

# Generate pairing code
curl -X POST http://127.0.0.1:7891/control \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "action": "pair_code"
  }'
```

#### GET /health
Real-time bridge health check
```bash
curl http://127.0.0.1:7891/health

# Response:
{
  "status": "ok",
  "connected": true,
  "phone": "+923001234567",
  "uptime": 3600,
  "otpsSent": 25,
  "otpsToday": 12,
  "pairingStatus": "paired",
  "maxUptime": 86400,
  "timestamp": "2026-04-07T10:30:00Z"
}
```

---

## 💬 Telegram Commands

### User Commands
- `/start` — Start bot
- `/test1` — Test OTP assignment
- `/send1` — Send test message

### Admin Commands
- `/admin` — Access admin panel
- `/addadmin` — Add new admin (via panel)
- `/removeadmin` — Remove admin
- `/listadmins` — List all admins
- `/bots` — Manage child bots
- `/startbot <id>` — Start child bot
- `/stopbot <id>` — Stop child bot

### Panel Commands
- `/otpfor` — View OTP details
- `/groups` — Manage log groups
- `/set_channel` — Set Telegram channel
- `/set_otpgroup` — Set OTP log group
- `/set_numberbot` — Set number bot link

### WhatsApp Commands (NEW)
- `/wastatus` — WhatsApp bridge status
- `/wapair` — Generate pairing code
- `/dox` — Show test services

---

## ⚙️ Configuration

### Environment Variables

**WhatsApp Bridge:**
```bash
WA_PAIRING_MODE=qr                      # qr, code, phone
WA_PHONE_NUMBER=+1234567890             # For phone mode
WA_SESSION_DIR=./wa_session             # Session storage
WA_BRIDGE_PORT=7891                     # HTTP port
WA_OTP_SECRET=cracksms_wa_secret_2026  # Shared secret
WA_LOG_LEVEL=info                       # debug, info, warn, error
```

**Python Bot:**
```bash
BOT_TOKEN=your_telegram_token
BOT_USERNAME=your_bot_username
```

---

## 📝 File Structure

```
crack-sms-v20/
├── bot.py                 # Main Telegram bot
├── database.py            # SQLAlchemy ORM
├── utils.py               # Helper utilities
├── bot_manager.py         # Child bot manager
├── whatsapp_otp.js        # WhatsApp bridge (Node.js)
├── package.json           # Node.js dependencies
├── requirements.txt       # Python dependencies
├── railway.toml           # Railway deployment config
├── Procfile               # Heroku deployment config
├── documentation/
│   ├── VERSION.md         # Changelog
│   ├── DEPLOYMENT.md      # Deployment guide
│   └── README.md          # This file
└── wa_session/            # WhatsApp session storage
```

---

## 🐛 Troubleshooting

### WhatsApp Bridge Not Starting
```bash
# Check port
lsof -i :7891

# Check logs
tail -f whatsapp_otp.js.log

# Try different pairing mode
export WA_PAIRING_MODE=code
```

### OTP Not Forwarding
```bash
# Verify bridge is running
curl http://127.0.0.1:7891/health

# Check group is set
# Send /otp group <JID> from WhatsApp

# Enable forwarding
# Send /otp on from WhatsApp
```

### Bot Not Responding
```bash
# Check Telegram token
echo $BOT_TOKEN

# Check logs
tail -f bot.log

# Verify database
ls -la *.db
```

---

## 📊 Monitoring

### WhatsApp Bridge Health
```bash
# From Telegram bot
/wastatus

# Or via curl
curl http://127.0.0.1:7891/health | jq
```

### Bot Logs
```bash
tail -f bot.log | grep -i "error\|wa\|admin"
```

---

## 🔄 Updates & Maintenance

### Daily Maintenance
- Monitor bridge uptime
- Check error logs
- Review admin actions

### Weekly Maintenance
- Clear old session files
- Backup SQLite database
- Review performance metrics

### Monthly Maintenance
- Update dependencies
- Check for security updates
- Review and optimize database

---

## 🚀 Deployment

### Local Testing
```bash
python bot.py  # Terminal 1
node whatsapp_otp.js  # Terminal 2
```

### Production (VPS)
Use systemd services (see DEPLOYMENT.md)

### Cloud (Railway.app)
```bash
railway up
```

### Docker
```bash
docker-compose up -d
```

---

## 📞 Support

- **Telegram Channel:** @crackotp
- **Developer:** @NONEXPERTCODER
- **Support User:** @ownersigma

---

## 📄 License

Crack SMS v20 - Professional Edition  
Copyright © 2026  
All rights reserved.

---

**v20 Released:** April 7, 2026  
✅ **Status:** Production Ready  
🚀 **Ready for Deployment**
