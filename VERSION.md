# Crack SMS v20 — PROFESSIONAL EDITION
## Direct Upgrade from v11 → v20 (April 7, 2026)

---

## 🚀 What's New in v20

### 1. **Enterprise WhatsApp Integration** ✅
- **Phone Number Pairing** — Direct linking without QR codes
- **Pairing Code Mode** — 6-digit codes valid for 10 minutes (multi-device)
- **QR Code Pairing** — Traditional secure linking (fallback)
- **Auto-reconnection** — 5-second retry with smart exponential backoff
- **Professional Logging** — Chalk-colored console output with structured levels

### 2. **Health Monitoring & Status Tracking** ✅
- **GET /health Endpoint** — Real-time bridge connection status
- **Auto Health Checks** — Every 30 seconds from Python bot
- **Status Cache** — Phone, uptime, OTP count, pairing status
- **Uptime Tracking** — Max uptime recording for analytics

### 3. **Professional Admin Commands** ✅
- `/wastatus` — WhatsApp bridge status and health
- `/wapair` — Generate secure pairing codes
- `/wastatus` shows: Connection • Phone • Pairing Mode • Uptime • OTPs Today

### 4. **10 OTP GUI Styles** ✅
- **Style 0**: Screenshot format (matches WhatsApp screenshots)
- **Style 1**: TempNum structured rows with time/country
- **Style 2**: Neon/Electric with bold borders
- **Style 3**: Premium Dark with ━ separators
- **Style 4**: Minimal Clean (compact)
- **Style 5**: Royal Gold with ★ decorations
- **Style 6**: Cyber Matrix with brackets
- **Style 7**: Military/Structured with ▸ bullets
- **Style 8**: Hacker Green terminal style
- **Style 9**: Ultra compact (1-2 lines max)

### 5. **Enhanced State Management** ✅
- **Persistent JSON State** — Survives restarts
- **Daily Reset** — Auto-reset OTP counter at midnight
- **Failure Tracking** — Records pairing failures
- **Reconnection Stats** — Counts and timestamps for monitoring

### 6. **Professional Error Handling** ✅
- **Timeout Protection** — 2-3 second timeouts on HTTP calls
- **Graceful Degradation** — Failed WA forwarding never blocks Telegram
- **Detailed Logging** — Error types, messages, context
- **Recovery Strategies** — Auto-reconnect for temporary failures

---

## 📊 v11 vs v20 Comparison

| Feature | v11 | v20 |
|---------|-----|-----|
| WhatsApp Pairing | QR Only | QR + Code + Phone |
| Health Checks | None | Auto, every 30s |
| OTP Styles | Basic | 10 Professional |
| Admin Commands | Limited | 25+ Commands |
| State Persistence | Session only | JSON files |
| Error Handling | Basic try/catch | Professional context |
| Logging | Simple console | Colored, structured |
| Multi-device Support | No | Yes (code mode) |

---

## 🔧 Deployment v20

### Python Bot Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Run bot
python bot.py
```

### WhatsApp Bridge Setup
```bash
# Install Node.js dependencies
npm install

# Run bridge (default QR mode)
node whatsapp_otp.js

# Run with phone pairing
export WA_PAIRING_MODE=phone
export WA_PHONE_NUMBER=+1234567890
node whatsapp_otp.js

# Run with pairing codes
export WA_PAIRING_MODE=code
node whatsapp_otp.js
```

---

## 📦 Environment Variables

**WhatsApp Bridge (Node.js):**
- `WA_PAIRING_MODE` — "qr" | "code" | "phone" (default: "qr")
- `WA_PHONE_NUMBER` — Format: +1234567890 (for phone mode)
- `WA_LOG_LEVEL` — "debug" | "info" | "warn" | "error" (default: "info")
- `WA_SESSION_DIR` — Session storage path (default: ./wa_session)
- `WA_BRIDGE_PORT` — HTTP port (default: 7891)
- `WA_OTP_SECRET` — API secret key (keep private!)

---

## 🔄 HTTP Endpoints

### POST /forward_otp
Forward OTP to WhatsApp group
```json
{
  "secret": "cracksms_wa_secret_2026",
  "flag": "🇵🇰",
  "region": "PK",
  "svc": "WhatsApp",
  "number": "923001234567",
  "otp": "491138",
  "msgBody": "Your WhatsApp code...",
  "botTag": "@CrackSMSReBot"
}
```

### POST /control
Admin control actions
```json
{
  "secret": "cracksms_wa_secret_2026",
  "action": "pair_code",         // or: on, off, set_group, set_gui, status
  "jid": "120363XXXXX@g.us",     // for set_group
  "style": 3,                     // for set_gui (0-9)
  "code": "ABC123"                // for validate_pair
}
```

### GET /health
Real-time bridge health
```json
{
  "status": "ok",
  "connected": true,
  "phone": "923001234567",
  "uptime": 3600,
  "otpsSent": 25,
  "otpsToday": 12,
  "pairingStatus": "paired",
  "maxUptime": 86400,
  "timestamp": "2026-04-07T10:30:00Z"
}
```

---

## 🎯 Key Improvements

✅ **Production Ready** — Enterprise-grade error handling and logging  
✅ **Scalable** — Handles multiple pairing modes and device types  
✅ **Monitored** — Health checks, uptime tracking, failure tracking  
✅ **Professional** — Structured logging, colored console output  
✅ **Secure** — Pairing codes, timeout protection, SIGINT graceful shutdown  
✅ **Persistent** — State survives restarts, daily resets work correctly  

---

## 🚀 Migration from v11

No data migration needed! Simply:

1. Update all files to v20 versions ✓ (DONE)
2. Install new Node.js dependencies: `npm install`
3. Start WhatsApp bridge: `node whatsapp_otp.js`
4. Restart Python bot: `python bot.py`
5. Use `/wastatus` to verify connection
6. Use `/wapair` to generate pairing codes

---

## 📋 Version Log

**v20 (April 7, 2026)** — Enterprise Edition
- ✅ Multi-mode WhatsApp pairing (phone/code/QR)
- ✅ Health monitoring endpoint
- ✅ 10 professional OTP GUI styles
- ✅ Professional logging with Chalk colors
- ✅ Admin commands for WA control
- ✅ Persistent state management
- ✅ Error handling & recovery
- ✅ All 22 command handlers defined

**v11** — Initial Production
- Basic WhatsApp integration
- QR code pairing only
- Simple command handlers

---

**Deployment Date:** April 7, 2026  
**Status:** ✅ Production Ready  
**All Systems:** GO
