# Crack SMS v20 — Premium & Professional Features

## 🎯 Overview

**Crack SMS v20** now includes comprehensive premium tier system and enterprise-grade features for both Telegram and WhatsApp platforms.

---

## 💎 Premium Tier System

### Three Tier Levels

| Feature | Free | Pro 💎 | Enterprise 🏆 |
|---------|------|--------|----------------|
| Daily OTP Limit | 50 | 500 | 5,000 |
| Max Panels | 2 | 10 | 50 |
| Analytics | ❌ | ✅ | ✅ |
| Webhooks | ❌ | ✅ | ✅ |
| Message Scheduling | ❌ | ✅ | ✅ |
| WhatsApp Groups | ❌ | ❌ | ✅ |
| Media Support | ❌ | ✅ | ✅ |
| Rate Limiting Config | ❌ | ❌ | ✅ |
| Price/Month | $0 | $2.99 | $9.99 |

---

## 📊 Telegram Premium Features

### 1. Premium Tier Management

**Command:** `/premium`

Shows your current tier, daily limit, and available features.

```
━━━━━━━━━━━━━━━━━━━━━
💎 Professional Plan
━━━━━━━━━━━━━━━━━━━━━

📊 Daily Limit: 120/500 OTPs
📈 Remaining: 380
🔌 Max Panels: 10

✨ Features:
  ✅ admin_panel
  ✅ analytics
  ✅ webhooks
  ✅ priority_support
```

### 2. Analytics Dashboard

**Command:** `/analytics`

Real-time analytics for Pro+ users showing:
- OTPs sent today
- Active panels
- Failed panels
- Success rate percentage

```
━━━━━━━━━━━━━━━━━━━━━
📊 Analytics Dashboard
━━━━━━━━━━━━━━━━━━━━━

📅 Date: 2026-04-07
📤 OTPs Sent: 142
🏃 Panels Active: 8
❌ Failed: 1
✅ Success Rate: 99.2%
```

### 3. Webhook Integration

**Command:** `/webhook`

Setup HTTP callbacks for OTP events.

#### Register Webhook

```bash
/webhook add https://your-server.com/webhook
```

#### Webhook Events

- `otp_received` — OTP received from panel
- `otp_forwarded` — OTP forwarded to WhatsApp
- `error` — Forwarding failed

#### Webhook Payload

```json
{
  "event": "otp_received",
  "timestamp": "2026-04-07T10:30:00Z",
  "data": {
    "number": "+1234567890",
    "otp": "123456",
    "service": "WhatsApp",
    "region": "US"
  }
}
```

#### List Webhooks

```bash
/webhook
```

### 4. Message Scheduling

**Command:** `/schedule <delay_seconds> <target> <message>`

Schedule WhatsApp messages for later delivery (Pro+ only).

```bash
/schedule 300 +1234567890 "Your code: 123456"
```

Will send the message in 5 minutes (300 seconds).

### 5. WhatsApp Media Support

**Command:** `/wamedia <WhatsApp_target>`

Send images, documents, PDFs to WhatsApp (Pro+ only).

Reply to a media file and use:
```bash
/wamedia +1234567890
```

### 6. Rate Limiting & Anti-Fraud

**Command:** `/ratelimit`

Enterprise-only feature to configure rate limiting.

```
━━━━━━━━━━━━━━━━━━━━━
⚙️ Rate Limiting Config
━━━━━━━━━━━━━━━━━━━━━

Max OTP/min: 60
Current scheme: Per-phone-number
Anti-fraud: Device fingerprinting enabled
```

---

## 🤖 WhatsApp Premium Features

### 1. Group Management

### Create WhatsApp Group

```bash
curl -X POST http://127.0.0.1:7891/control \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "action": "create_group",
    "group_name": "OTP Alerts",
    "members": ["+1234567890", "+9876543210"]
  }'
```

Response:
```json
{
  "ok": true,
  "groupId": "120363xxxxx@g.us"
}
```

### Get All Groups

```bash
curl -X POST http://127.0.0.1:7891/control \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "action": "get_groups"
  }'
```

Response:
```json
{
  "ok": true,
  "groups": [
    {
      "jid": "120363xxxxx@g.us",
      "name": "OTP Alerts",
      "members": [...],
      "created": "2026-04-07T10:00:00Z"
    }
  ],
  "count": 1
}
```

### 2. Message Scheduling

### Schedule Message

```bash
curl -X POST http://127.0.0.1:7891/control \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "action": "schedule_message",
    "target": "+1234567890",
    "text": "Your OTP: 123456",
    "delay_ms": 60000
  }'
```

Response:
```json
{
  "ok": true,
  "scheduleId": "sched_1712486400000_abc123",
  "sendAt": "2026-04-07T10:01:00Z"
}
```

### Get Scheduled Messages

```bash
curl -X POST http://127.0.0.1:7891/control \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "action": "get_scheduled"
  }'
```

### 3. Media Attachments

### Send Media to WhatsApp

```bash
curl -X POST http://127.0.0.1:7891/control \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "action": "send_media",
    "target": "+1234567890",
    "media_path": "/path/to/image.jpg",
    "caption": "Important document"
  }'
```

Supported formats:
- Images: `.jpg`, `.png`, `.webp`
- Documents: `.pdf`, `.docx`

### 4. Message Templates

### Add Custom Template

```bash
curl -X POST http://127.0.0.1:7891/control \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "action": "add_template",
    "template_name": "twofactor_alert",
    "template_text": "2FA Alert! Code: {code} for {service} | Device: {device}"
  }'
```

### Render Template

```bash
curl -X POST http://127.0.0.1:7891/control \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "action": "render_template",
    "template": "twofactor_alert",
    "variables": {
      "code": "123456",
      "service": "Facebook",
      "device": "iPhone 15"
    }
  }'
```

Response:
```json
{
  "ok": true,
  "text": "2FA Alert! Code: 123456 for Facebook | Device: iPhone 15"
}
```

### Pre-built Templates

- `welcome` — Welcome message template
- `otp` — Simple OTP message
- `alert` — Security alert template

### 5. Rate Limiting & Anti-Fraud

### Check Rate Limit

```bash
curl -X POST http://127.0.0.1:7891/control \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "action": "check_rate_limit",
    "phone": "+1234567890"
  }'
```

Response:
```json
{
  "ok": true,
  "ok": true,
  "count": 15,
  "limit": 60,
  "flags": [
    {
      "flag": "suspicious_velocity",
      "timestamp": 1712486400000
    }
  ]
}
```

### Rate Limiting Config

- **Max OtPs per minute:** 60
- **Max OTPs per day:** 5,000
- **Device fingerprinting:** Enabled
- **Anti-fraud checks:** Enabled
- **Suspicious velocity detection:** Active

---

## 🔐 Authentication

All premium API endpoints require:
- `secret`: API secret key (default: `cracksms_wa_secret_2026`)
- `action`: Specific action to perform

---

## 📈 Usage Examples

### Python Bot - Check OTP Limit

```python
from bot import check_otp_limit, increment_otp_count

user_id = 12345
limit_check = check_otp_limit(user_id)
if limit_check['ok']:
    increment_otp_count(user_id)
else:
    print(f"OTP limit reached: {limit_check['sent']}/{limit_check['limit']}")
```

### Python Bot - Trigger Webhook

```python
await trigger_webhook(user_id, "otp_forwarded", {
    "number": "+1234567890",
    "otp": "123456",
    "service": "WhatsApp"
})
```

### WhatsApp Bridge - Deploy Scheduled Message

```bash
# Schedule message in 10 minutes
curl -X POST http://127.0.0.1:7891/control \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "cracksms_wa_secret_2026",
    "action": "schedule_message",
    "target": "+1234567890",
    "text": "Scheduled alert",
    "delay_ms": 600000
  }'
```

---

## 🎓 Tier Upgrade Guide

### Upgrade from Free to Pro

```bash
# Admin command
/admin → Manage Users → Select User → Set Tier → Pro
```

### Upgrade from Pro to Enterprise

1. Contact support: `@ownersigma`
2. Verify account
3. Tier upgraded automatically

---

## 📝 Premium Feature Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Daily OTP Quota | 50 | 500 | 5,000 |
| Scheduled Messages/day | 0 | 100 | 1,000 |
| Webhooks | 0 | 5 | Unlimited |
| Broadcast Lists | 0 | 1 | 10 |
| Message Templates | 0 | 5 | Unlimited |
| Storage (messages) | None | 7 days | 90 days |

---

## 🚀 Deployment

### Enable Premium Features

Features are automatically enabled in v20. No additional configuration needed.

### Configuration File

If using `config.json`, premium tier data is stored automatically:

```json
{
  "user_tiers": {
    "12345": "pro",
    "67890": "enterprise"
  }
}
```

---

## 📞 Support

**Issue?** Contact `@ownersigma` on Telegram

**Feature Request?** Discuss with `@NONEXPERTCODER`

---

**Version:** 20.0.0  
**Release:** April 7, 2026  
**Edition:** Professional + Enterprise
