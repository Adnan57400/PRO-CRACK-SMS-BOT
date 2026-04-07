# Crack SMS v20 Deployment Guide

## 🎯 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- pip & npm package managers
- Linux/MacOS/Windows Terminal

---

## 📦 Installation

### 1. Python Bot Setup
```bash
cd /path/to/bot
pip install -r requirements.txt
python bot.py
```

### 2. WhatsApp Bridge Setup (Separate Terminal)
```bash
cd /path/to/whatsapp_bridge
npm install
node whatsapp_otp.js
```

---

## 🔐 WhatsApp Pairing Modes

### Mode 1: QR Code (Default)
```bash
export WA_PAIRING_MODE=qr
node whatsapp_otp.js

# Scan QR from terminal output
# Success: Bridge connects automatically
```

### Mode 2: Pairing Code (Recommended for Multi-device)
```bash
export WA_PAIRING_MODE=code
export WA_LOG_LEVEL=info
node whatsapp_otp.js

# Wait for "Pairing Code Generated" message
# Copy code to WhatsApp: Linked Devices → Link Device → Use Pairing Code
```

### Mode 3: Phone Number (Direct Linking)
```bash
export WA_PAIRING_MODE=phone
export WA_PHONE_NUMBER=+1234567890
node whatsapp_otp.js

# Phone number will be extracted and used for direct linking
# No QR or code needed
```

---

## 🌐 Network Configuration

### Local Testing (Default)
- Python Bot: `localhost:5000` (if using Flask)
- WhatsApp Bridge: `127.0.0.1:7891`
- Both on same machine

### Production Deployment
Edit configuration:

**bot.py:**
```python
WA_HEALTH_URL = "http://127.0.0.1:7891/health"      # Change to bridge IP
WA_BRIDGE_URL = "http://127.0.0.1:7891/control"     # Change to bridge IP
WA_FORWARD_URL = "http://127.0.0.1:7891/forward_otp" # Change to bridge IP
```

**whatsapp_otp.js:**
```bash
export WA_BRIDGE_PORT=7891  # Use stable port (firewall rules)
```

---

## ✅ Verify Installation

### Check Python Bot
```bash
python bot.py
# Should see:
# ✅ Bot ready
# 🚀 Active watcher started
```

### Check WhatsApp Bridge
```bash
node whatsapp_otp.js
# Should see:
# ╭─ Crack SMS v20 WhatsApp OTP Bridge
# ✅ WhatsApp Connected (+1234567890)
```

### Test Commands (Telegram)
```
/admin          → Admin panel
/wastatus       → WhatsApp status
/wapair         → Generate pairing code
/test1          → Test OTP forwarding
```

---

## 🐛 Troubleshooting

### WhatsApp Bridge Not Connecting
```bash
# Check if port 7891 is in use
lsof -i :7891  # macOS/Linux
netstat -ano | findstr :7891  # Windows

# Check logs
tail -f whatsapp_otp.js.log

# Try different pairing mode
export WA_PAIRING_MODE=code
node whatsapp_otp.js
```

### Bot Can't Reach Bridge
```bash
# Test connectivity
curl http://127.0.0.1:7891/health

# Check firewall
sudo ufw allow 7891  # Linux

# Verify secret key matches
# bot.py: WA_OTP_SECRET = "cracksms_wa_secret_2026"
# whatsapp_otp.js: process.env.WA_OTP_SECRET or default
```

### OTP Not Forwarding to WhatsApp
```bash
# 1. Check bridge is running
curl http://127.0.0.1:7891/health

# 2. Verify group JID is set
# Send /otp group 120363XXXXX@g.us from WhatsApp

# 3. Enable forwarding
# Send /otp on from WhatsApp

# 4. Test with /test1 from Telegram
```

---

## 📊 Monitoring

### Real-time Bridge Status
```python
# From Python bot
/wastatus
```

### WhatsApp Bridge Logs
```bash
# Full debug output
export WA_LOG_LEVEL=debug
node whatsapp_otp.js

# Filter logs
tail -f bot.log | grep "WA"
```

### Bot Logs
```bash
tail -f bot.log
```

---

## 🔄 Systemd Service (Production)

### Create service file
```bash
sudo nano /etc/systemd/system/crack-sms-bot.service
```

```ini
[Unit]
Description=Crack SMS Bot v20
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/www-data/crack-sms
ExecStart=/usr/bin/python3 bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Create WhatsApp bridge service
```bash
sudo nano /etc/systemd/system/crack-sms-bridge.service
```

```ini
[Unit]
Description=Crack SMS WhatsApp Bridge v20
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/www-data/crack-sms
Environment="WA_PAIRING_MODE=code"
Environment="WA_LOG_LEVEL=info"
ExecStart=/usr/bin/node whatsapp_otp.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and start
```bash
sudo systemctl enable crack-sms-bot
sudo systemctl enable crack-sms-bridge
sudo systemctl start crack-sms-bot
sudo systemctl start crack-sms-bridge
sudo systemctl status crack-sms-bot
sudo systemctl status crack-sms-bridge
```

---

## 🚀 Docker Deployment (Optional)

### Docker Compose
```yaml
version: '3.8'

services:
  bot:
    build:
      context: .
      dockerfile: Dockerfile.python
    environment:
      - BOT_TOKEN=${BOT_TOKEN}
      - WA_BRIDGE_URL=http://bridge:7891
    ports:
      - "5000:5000"
    depends_on:
      - bridge

  bridge:
    build:
      context: .
      dockerfile: Dockerfile.node
    environment:
      - WA_PAIRING_MODE=code
      - WA_LOG_LEVEL=info
    ports:
      - "7891:7891"
    volumes:
      - wa-session:/app/wa_session

volumes:
  wa-session:
```

---

## 📝 Configuration Checklist

- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed
- [ ] requirements.txt dependencies installed (`pip install -r requirements.txt`)
- [ ] npm packages installed (`npm install`)
- [ ] Telegram bot token configured
- [ ] WhatsApp account ready
- [ ] Port 7891 available/configured
- [ ] Secret key configured (Both files match)
- [ ] First pairing completed
- [ ] `/test1` OTP test passed
- [ ] WhatsApp group JID set (`/otp group`)
- [ ] Forwarding enabled (`/otp on`)

---

## 🎯 Production Checklist

- [ ] SSL certificates obtained
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring/alerting set up
- [ ] Error logs monitored
- [ ] Daily restart scheduled (optional)
- [ ] Rate limiting configured
- [ ] Database backups tested
- [ ] Session cleanup scheduled

---

**Deployment Guide v20**  
**Last Updated:** April 7, 2026  
✅ All systems ready for production
