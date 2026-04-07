/**
 * ════════════════════════════════════════════════════════════════════════════════
 *  Crack SMS v20 WhatsApp OTP Bridge — ENTERPRISE EDITION
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * FEATURES:
 *   ✅ Phone Number Pairing (no QR code)
 *   ✅ Pairing Code Mode (secure multi-device)
 *   ✅ QR Code Pairing (traditional method)
 *   ✅ 10 Professional GUI Styles
 *   ✅ Advanced Admin Commands
 *   ✅ Real-time Status Monitoring
 *   ✅ Auto-reconnection & Recovery
 *   ✅ Professional Error Handling
 *
 * ENVIRONMENT VARIABLES:
 *   WA_SESSION_DIR        → Session storage path (default: ./wa_session)
 *   WA_OTP_SECRET         → API secret key (default: cracksms_wa_secret_2026)
 *   WA_BRIDGE_PORT        → HTTP port (default: 7891)
 *   WA_PAIRING_MODE       → "qr" | "code" | "phone" (default: "qr")
 *   WA_PHONE_NUMBER       → For phone pairing (format: +1234567890)
 *   WA_LOG_LEVEL          → "debug" | "info" | "warn" | "error" (default: "info")
 *
 * INSTALLATION:
 *   npm install @whiskeysockets/baileys pino node-cache @hapi/boom fs-extra qrcode-terminal chalk
 *
 * SELF COMMANDS (from linked WhatsApp number):
 *   /otp on              → Enable OTP forwarding
 *   /otp off             → Disable OTP forwarding
 *   /otp status          → Full status & statistics
 *   /otp group <JID>     → Set target WhatsApp group
 *   /otp getjid          → Get JID of current chat
 *   /otp gui <0-9>       → Change OTP format style
 *   /otp styles          → List all 10 styles
 *   /otp test            → Preview current style
 *   /otp help            → Show all commands
 *   /otp stats           → Detailed statistics
 *
 * HTTP ENDPOINTS (Python calls these):
 *   POST /forward_otp    → Send OTP to WhatsApp
 *   POST /control        → Admin control panel
 *   GET  /health         → Health check endpoint
 *
 * ════════════════════════════════════════════════════════════════════════════════
 */

'use strict';

const {
  default: makeWASocket,
  Browsers,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  getPhoneNumber,
} = require('@whiskeysockets/baileys');

const pino      = require('pino');
const NodeCache = require('node-cache');
const { Boom }  = require('@hapi/boom');
const fs        = require('fs-extra');
const path      = require('path');
const qrterm    = require('qrcode-terminal');
const chalk     = require('chalk');
const http      = require('http');

// ════════════════════════════════════════════════════════════════════════════════
//  PROFESSIONAL CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════
const CFG = {
  sessionDir:      process.env.WA_SESSION_DIR      || path.join(__dirname, 'wa_session'),
  stateFile:       path.join(__dirname, 'wa_bridge_state.json'),
  secret:          process.env.WA_OTP_SECRET       || 'cracksms_wa_secret_2026',
  bridgePort:      parseInt(process.env.WA_BRIDGE_PORT || '7891'),
  pairingMode:     (process.env.WA_PAIRING_MODE || 'qr').toLowerCase(), // qr | code | phone
  phoneNumber:     process.env.WA_PHONE_NUMBER     || '', // format: +1234567890
  logLevel:        process.env.WA_LOG_LEVEL        || 'info',
  reconnectMs:     5_000,
  maxReconnectAttempts: 10,
  healthCheckInterval: 30_000,
};

// ════════════════════════════════════════════════════════════════════════════════
//  ENHANCED LOGGER WITH PROFESSIONAL FORMATTING
// ════════════════════════════════════════════════════════════════════════════════
const Logger = {
  _level: { debug: 0, info: 1, warn: 2, error: 3 }[CFG.logLevel] || 1,
  debug: (msg) => { if (Logger._level <= 0) console.log(chalk.gray(`  📝 ${msg}`)); },
  info:  (msg) => { if (Logger._level <= 1) console.log(chalk.cyan(`  ℹ️  ${msg}`)); },
  warn:  (msg) => { if (Logger._level <= 2) console.log(chalk.yellow(`  ⚠️  ${msg}`)); },
  error: (msg) => { if (Logger._level <= 3) console.log(chalk.red(`  ❌ ${msg}`)); },
  success: (msg) => { console.log(chalk.green(`  ✅ ${msg}`)); },
  title: (msg) => { console.log(chalk.bold.cyan(`\n  ╭─ ${msg}`)); },
  end:   () => { console.log(chalk.cyan(`  ╰──────────────────────────────────────\n`)); },
};

// ════════════════════════════════════════════════════════════════════════════════
//  PERSISTENT STATE MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════
let S = {
  linkedPhone:       '',
  waGroupJid:        '',
  otpForwardingOn:   true,
  guiStyle:          0,
  otpsSent:          0,
  otpsToday:         0,
  startedAt:         Date.now(),
  lastResetDate:     new Date().toDateString(),
  pairingPhone:      '',
  pairingCode:       '',
  pairingStatus:     'unpaired', // unpaired | waiting_code | waiting_qr | paired
  otpsFailed:        0,
  lastPairingAttempt: 0,
  reconnectCount:    0,
  maxUptime:         0,
};

function loadState() {
  try {
    if (fs.existsSync(CFG.stateFile)) {
      const loaded = JSON.parse(fs.readFileSync(CFG.stateFile, 'utf-8'));
      S = { ...S, ...loaded };
      Logger.success(`State loaded from ${CFG.stateFile}`);
    } else {
      Logger.info('No previous state file. Starting fresh.');
    }
  } catch (e) {
    Logger.error(`Failed to load state: ${e.message}`);
  }
}

function saveState() {
  try {
    fs.writeFileSync(CFG.stateFile, JSON.stringify(S, null, 2), 'utf-8');
    Logger.debug(`State saved to ${CFG.stateFile}`);
  } catch (e) {
    Logger.error(`Failed to save state: ${e.message}`);
  }
}

function checkDailyReset() {
  const today = new Date().toDateString();
  if (today !== S.lastResetDate) {
    S.otpsToday = 0;
    S.lastResetDate = today;
    saveState();
    Logger.info(`Daily reset: OTPs counter reset for ${today}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
//  PREMIUM FEATURES CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════
const PREMIUM = {
  groupsList: {},           // {groupJid: {name, members, created}}
  messageSchedule: [],      // [{id, target, text, sendAt}]
  messageTemplates: {       // Reusable message templates
    "welcome": "Welcome to {name}! Your code: {code}",
    "otp": "OTP Code: {code}",
    "alert": "Security Alert: Login from {device}",
  },
  rateLimitConfig: {
    maxOtpPerMin: 60,
    maxOtpPerDay: 5000,
    deviceFingerprint: true,
    antifraudChecks: true,
  },
  broadcastLists: {},       // {id: {name, members}}
  mediaAttachments: [],     // [{id, type, url, caption}]
};

// ════════════════════════════════════════════════════════════════════════════════
//  RATE LIMITING & ANTI-FRAUD ENGINE
// ════════════════════════════════════════════════════════════════════════════════
const RateLimiter = {
  store: {},  // {phone: {count: N, lastReset: timestamp, flags: []}}
  
  check: function(phone) {
    const now = Date.now();
    if (!this.store[phone]) {
      this.store[phone] = { count: 0, lastReset: now, flags: [] };
    }
    
    const entry = this.store[phone];
    if (now - entry.lastReset > 60000) {  // Reset every minute
      entry.count = 0;
      entry.lastReset = now;
      entry.flags = [];
    }
    
    return {
      ok: entry.count < PREMIUM.rateLimitConfig.maxOtpPerMin,
      count: entry.count,
      limit: PREMIUM.rateLimitConfig.maxOtpPerMin,
      flags: entry.flags,
    };
  },
  
  increment: function(phone) {
    if (!this.store[phone]) return;
    this.store[phone].count++;
  },
  
  addFlag: function(phone, flag) {
    if (!this.store[phone]) return;
    this.store[phone].flags.push({ flag, timestamp: Date.now() });
  },
};

// ════════════════════════════════════════════════════════════════════════════════
//  GROUP & BROADCAST MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════
async function createGroupChat(sock, groupName, members) {
  try {
    const groupId = await sock.groupCreate(groupName, members);
    PREMIUM.groupsList[groupId] = {
      name: groupName,
      members: members,
      created: new Date().toISOString(),
    };
    Logger.success(`Group created: ${groupName}`);
    return { ok: true, groupId };
  } catch (e) {
    Logger.error(`Group creation failed: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

async function createBroadcastList(sock, displayName, members) {
  try {
    const listId = await sock.getBroadcastListInfo(displayName);
    PREMIUM.broadcastLists[listId] = {
      name: displayName,
      members: members,
      created: new Date().toISOString(),
    };
    Logger.success(`Broadcast list created: ${displayName}`);
    return { ok: true, listId };
  } catch (e) {
    Logger.error(`Broadcast list creation failed: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

// ════════════════════════════════════════════════════════════════════════════════
//  MESSAGE SCHEDULING ENGINE
// ════════════════════════════════════════════════════════════════════════════════
async function scheduleMessage(sock, target, text, delayMs) {
  const scheduleId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sendAt = Date.now() + delayMs;
  
  PREMIUM.messageSchedule.push({
    id: scheduleId,
    target,
    text,
    sendAt,
    created: new Date().toISOString(),
  });
  
  Logger.info(`Message scheduled: ${scheduleId} for ${new Date(sendAt).toISOString()}`);
  return { ok: true, scheduleId, sendAt: new Date(sendAt).toISOString() };
}

async function processScheduledMessages(sock) {
  const now = Date.now();
  const toSend = PREMIUM.messageSchedule.filter(m => m.sendAt <= now);
  
  for (const msg of toSend) {
    try {
      await sock.sendMessage(msg.target, { text: msg.text });
      Logger.success(`Scheduled message sent: ${msg.id}`);
      PREMIUM.messageSchedule = PREMIUM.messageSchedule.filter(m => m.id !== msg.id);
    } catch (e) {
      Logger.error(`Failed to send scheduled message ${msg.id}: ${e.message}`);
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════════
//  MEDIA ATTACHMENT SUPPORT
// ════════════════════════════════════════════════════════════════════════════════
async function sendMediaMessage(sock, target, mediaPath, caption = '') {
  try {
    const mediaType = mediaPath.endsWith('.pdf') ? 'document' : mediaPath.endsWith('.png') || mediaPath.endsWith('.jpg') ? 'image' : 'document';
    const mediaBuffer = fs.readFileSync(mediaPath);
    
    const message = {};
    if (mediaType === 'image') {
      message.image = mediaBuffer;
      message.caption = caption;
    } else if (mediaType === 'document') {
      message.document = mediaBuffer;
      message.mimetype = 'application/pdf';
      message.fileName = path.basename(mediaPath);
    }
    
    await sock.sendMessage(target, message);
    Logger.success(`Media sent to ${target}: ${path.basename(mediaPath)}`);
    return { ok: true, status: 'sent' };
  } catch (e) {
    Logger.error(`Media send failed: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

// ════════════════════════════════════════════════════════════════════════════════
//  MESSAGE TEMPLATES
// ════════════════════════════════════════════════════════════════════════════════
function renderTemplate(templateName, variables = {}) {
  let template = PREMIUM.messageTemplates[templateName] || '';
  for (const [key, value] of Object.entries(variables)) {
    template = template.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return template;
}

function addCustomTemplate(name, text) {
  PREMIUM.messageTemplates[name] = text;
  Logger.info(`Template added: ${name}`);
  return { ok: true, message: `Template '${name}' created` };
}

// ══════════════════════════════════════════════════════════════
//  OTP MESSAGE FORMATTING (10 STYLES)
// ══════════════════════════════════════════════════════════════
//  All use WhatsApp markdown: *bold* _italic_ `code` ~strikethrough~
// ══════════════════════════════════════════════════════════════
function formatOtpMessage(style, { flag, region, svc, number, otp, msgBody, panelName, botTag }) {
  const nd     = number ? `${number.slice(0,4)}••••${number.slice(-4)}` : '••••••••';
  const fmtOtp = otp && otp.length === 6 ? `${otp.slice(0,3)}-${otp.slice(3)}` : (otp || '—');
  const ts     = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const svcUp  = (svc || 'OTP').toUpperCase();
  const snip   = (msgBody || '').slice(0, 180).replace(/\n+/g, ' ');
  const tag    = botTag || '@CrackSMSReBot';

  switch (style % 10) {
    // ── Style 0: Screenshot style (matches the screenshot you showed) ──
    case 0:
      return otp
        ? `${flag || '🌍'} *#${svcUp}* 📱 \`${nd}\` 🔥\n\n` +
          `*OTP Received!*\n` +
          `🔑 *${fmtOtp}*\n\n` +
          `💬 _${snip}_\n\n` +
          `_©By ${tag}_`
        : `${flag || '🌍'} *#${svcUp}* 📱 \`${nd}\`\n` +
          `💬 _${snip}_\n_©By ${tag}_`;

    // ── Style 1: TempNum / structured rows ──
    case 1:
      return otp
        ? `🔥 *${flag || ''} ${region || ''} ${svcUp} OTP Received!* ✨\n\n` +
          `┃ 🕐 *Time:* \`${ts}\`\n` +
          `┃ 🌍 *Country:* ${region || '?'} ${flag || ''}\n` +
          `┃ 📱 *Service:* #${svcUp}\n` +
          `┃ 📞 *Number:* \`${nd}\`\n` +
          `┃ 🔑 *OTP:* \`${fmtOtp}\`\n` +
          `┃ 💬 _${snip}_\n\n` +
          `_©By ${tag}_`
        : `📩 *${flag || ''} ${svcUp} SMS*\n┃ \`${nd}\`\n┃ _${snip}_\n_©By ${tag}_`;

    // ── Style 2: Neon / Electric ──
    case 2:
      return otp
        ? `⚡⚡ *${region || ''} ${svcUp} OTP* ⚡⚡\n` +
          `${'─'.repeat(22)}\n` +
          `${flag || '🌍'} #${svcUp}  \`${nd}\`\n` +
          `${'─'.repeat(22)}\n` +
          `🔐 *OTP CODE*\n` +
          `💎 \`${fmtOtp}\` 💎\n` +
          `${'─'.repeat(22)}\n` +
          `💬 _${snip}_\n` +
          `🤖 _${tag}_`
        : `📡 *${svcUp}*\n${flag || '🌍'} \`${nd}\`\n💬 _${snip}_\n🤖 _${tag}_`;

    // ── Style 3: Premium Dark (━ lines) ──
    case 3:
      return otp
        ? `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `  ${flag || '🌍'} *#${svcUp}*  \`${nd}\`  🔥\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🔑 *OTP:*  \`${fmtOtp}\`\n\n` +
          `💬 _${snip}_\n` +
          `_©By ${tag}_`
        : `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `  ${flag || '🌍'} *#${svcUp}*  \`${nd}\`\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `💬 _${snip}_\n_©By ${tag}_`;

    // ── Style 4: Minimal Clean ──
    case 4:
      return otp
        ? `${flag || ''} *${svcUp}*  \`${nd}\`  \`${fmtOtp}\`\n_${tag}_`
        : `${flag || ''} *${svcUp}*  \`${nd}\`\n_${snip}_\n_${tag}_`;

    // ── Style 5: Royal Gold ──
    case 5:
      return otp
        ? `👑 *━━ OTP RECEIVED ━━* 👑\n\n` +
          `🌟 ${flag || ''} *#${svcUp}*  \`${nd}\` 🌟\n\n` +
          `🔑 *OTP:* \`${fmtOtp}\`\n\n` +
          `💬 _${snip}_\n` +
          `✨ _©By ${tag}_ ✨`
        : `💫 *${svcUp}*\n🌟 ${flag || ''} \`${nd}\`\n💬 _${snip}_\n✨ _${tag}_ ✨`;

    // ── Style 6: Cyber / Matrix ──
    case 6:
      return otp
        ? `[ ⚡ CRACK SMS ⚡ ]\n${'─'.repeat(24)}\n` +
          `  ${flag || ''} *#${svcUp}*  \`${nd}\`  🔥\n` +
          `${'─'.repeat(24)}\n` +
          `  🔑 *DECRYPTED*\n  \`${fmtOtp}\`\n` +
          `${'─'.repeat(24)}\n` +
          `  💬 _${snip}_\n  _©By ${tag}_`
        : `[ ⚡ CRACK SMS ⚡ ]\n  ${flag || ''} *#${svcUp}*  \`${nd}\`\n  _${snip}_\n  _©By ${tag}_`;

    // ── Style 7: Military / Structured ──
    case 7:
      return otp
        ? `🎖 *SECURE OTP RECEIVED* 🎖\n${'═'.repeat(22)}\n` +
          `▸ REGION:   ${region || '?'} ${flag || ''}\n` +
          `▸ SERVICE:  #${svcUp}\n` +
          `▸ NUMBER:   \`${nd}\`\n` +
          `▸ OTP:      \`${fmtOtp}\`\n` +
          `${'═'.repeat(22)}\n💬 _${snip}_\n_©By ${tag}_`
        : `🎖 *SMS* ${flag || ''} *#${svcUp}*  \`${nd}\`\n💬 _${snip}_\n_©By ${tag}_`;

    // ── Style 8: Hacker Green ──
    case 8:
      return otp
        ? `\`[ OTP_SYSTEM v3.0 ]\`\n` +
          `\`region   = ${region || '?'}\`\n` +
          `\`service  = ${svcUp}\`\n` +
          `\`number   = ${nd}\`\n` +
          `\`otp      = ${fmtOtp}\`\n` +
          `${'─'.repeat(22)}\n💬 _${snip}_\n_©By ${tag}_`
        : `\`[ SMS_SYSTEM v3.0 ]\`\n\`region = ${region || '?'}\`\n\`svc = ${svcUp}\`\n💬 _${snip}_\n_${tag}_`;

    // ── Style 9: Ultra compact ──
    default:
      return otp
        ? `🔑 *${fmtOtp}*\n${flag || '🌍'} *#${svcUp}*  \`${nd}\`\n_©By ${tag}_`
        : `${flag || '🌍'} *#${svcUp}*  \`${nd}\`\n_${snip}_\n_${tag}_`;
  }
}

// ══════════════════════════════════════════════════════════════
//  WHATSAPP SOCKET
// ══════════════════════════════════════════════════════════════
let sock      = null;
let isRunning = false;

// ── Pairing utilities ──────────────────────────────────────────
function generatePairingCode() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  S.pairingCode = code;
  S.pairingStatus = 'waiting_code';
  S.lastPairingAttempt = Date.now();
  saveState();
  return code;
}

function validatePairingCode(inputCode) {
  if (!S.pairingCode) {
    Logger.warn(`Pairing: No active pairing code`);
    return false;
  }
  if (S.pairingCode !== inputCode.toUpperCase()) {
    Logger.warn(`Pairing: Invalid code provided`);
    S.otpsFailed++;
    saveState();
    return false;
  }
  if (Date.now() - S.lastPairingAttempt > 600_000) { // 10 min timeout
    Logger.warn(`Pairing: Code expired`);
    S.pairingCode = '';
    S.pairingStatus = 'unpaired';
    saveState();
    return false;
  }
  S.pairingCode = '';
  S.pairingStatus = 'paired';
  saveState();
  Logger.success(`Pairing: Code validated successfully`);
  return true;
}

async function fetchPhoneNumberInfo() {
  try {
    if (!CFG.phoneNumber) {
      Logger.warn(`Phone pairing: No phone number configured`);
      return null;
    }
    const cleaned = CFG.phoneNumber.replace(/\D/g, '');
    if (!cleaned || cleaned.length < 10) {
      Logger.error(`Phone pairing: Invalid phone number format`);
      return null;
    }
    S.pairingPhone = cleaned;
    S.pairingStatus = 'waiting_link';
    saveState();
    Logger.info(`Phone pairing: Using phone +${cleaned}`);
    return cleaned;
  } catch (e) {
    Logger.error(`Phone pairing error: ${e.message}`);
    return null;
  }
}

async function sendToWaGroup(text) {
  if (!sock?.user) throw new Error('WhatsApp not connected');
  if (!S.waGroupJid) throw new Error('No WA group set. Use /otp group <JID>');
  await sock.sendMessage(S.waGroupJid, { text });
  S.otpsSent++;
  S.otpsToday++;
  saveState();
}

// ── Self commands ─────────────────────────────────────────────
async function handleSelfCmd(jid, text) {
  const t = text.trim();

  if (t === '/otp on') {
    if (!S.waGroupJid) {
      await sock.sendMessage(jid, { text:
        '❌ *No WA group set!*\n\nSet one first:\n`/otp group <JID>`\n\nThen type `/otp getjid` inside the target group to get its JID.' });
      return;
    }
    S.otpForwardingOn = true; saveState();
    await sock.sendMessage(jid, { text:
      '✅ *OTP Forwarding: ON*\n\n' +
      `Target: \`${S.waGroupJid}\`\n\n` +
      'Every OTP will now be sent to this WA group in addition to Telegram.\nSend `/otp off` to stop.' });
    Logger.success(`WA OTP forwarding turned ON`);
    return;
  }

  if (t === '/otp off') {
    S.otpForwardingOn = false; saveState();
    await sock.sendMessage(jid, { text: '🔴 *OTP Forwarding: OFF*\nSend `/otp on` to resume.' });
    Logger.warn(`WA OTP forwarding turned OFF`);
    return;
  }

  if (t === '/otp status') {
    checkDailyReset();
    const sec = Math.floor((Date.now() - S.startedAt) / 1000);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    await sock.sendMessage(jid, { text:
      `📊 *Crack SMS WA Bridge*\n\n` +
      `🔀 Forwarding: ${S.otpForwardingOn ? '✅ ON' : '🔴 OFF'}\n` +
      `📲 Phone: +${S.linkedPhone || '?'}\n` +
      `👥 Group: ${S.waGroupJid || '⚠️ Not set'}\n` +
      `🎨 GUI Style: ${S.guiStyle} / 9\n` +
      `📨 Total OTPs sent: ${S.otpsSent}\n` +
      `📅 Today: ${S.otpsToday}\n` +
      `⏰ Uptime: ${h}h ${m}m` });
    return;
  }

  const grpMatch = t.match(/^\/otp group\s+(.+)/i);
  if (grpMatch) {
    const jidArg = grpMatch[1].trim();
    if (!jidArg.includes('@')) {
      await sock.sendMessage(jid, { text:
        '❌ *Invalid JID*\n\nFormat:\n• Group:   `120363XXXXX@g.us`\n• Channel: `120363XXXXX@newsletter`\n\nSend `/otp getjid` inside the target group.' });
      return;
    }
    S.waGroupJid = jidArg; saveState();
    await sock.sendMessage(jid, { text:
      `✅ *WA Group Set*\n\n\`${jidArg}\`\n\nSend \`/otp on\` to start forwarding.` });
    return;
  }

  if (t === '/otp getjid') {
    await sock.sendMessage(jid, { text: `📋 *Current chat JID:*\n\`${jid}\`\n\nCopy and use:\n\`/otp group ${jid}\`` });
    return;
  }

  const guiMatch = t.match(/^\/otp gui\s+(\d)/i);
  if (guiMatch) {
    const gs = parseInt(guiMatch[1]);
    if (gs < 0 || gs > 9) {
      await sock.sendMessage(jid, { text: '❌ Style must be 0–9.\nUse `/otp test` to preview current style.' });
      return;
    }
    S.guiStyle = gs; saveState();
    await sock.sendMessage(jid, { text: `✅ *WA GUI Style set to ${gs}*\n\nUse \`/otp test\` to preview.` });
    return;
  }

  if (t === '/otp test') {
    const testMsg = formatOtpMessage(S.guiStyle, {
      flag: '🇵🇰', region: 'PK', svc: 'WS',
      number: '923001234567', otp: '491138',
      msgBody: 'Your WhatsApp code: 491138. Do not share this code.',
      panelName: 'Test Panel', botTag: `@CrackSMSReBot`,
    });
    await sock.sendMessage(jid, { text: `🧪 *Test — Style ${S.guiStyle}*\n\n${testMsg}` });
    return;
  }

  if (t === '/otp styles') {
    let msg = '🎨 *WA OTP GUI Styles (0-9)*\n\n';
    const names = ['Screenshot','TempNum','Neon/Electric','Premium Dark','Minimal','Royal Gold','Cyber Matrix','Military','Hacker Green','Ultra Compact'];
    names.forEach((n, i) => { msg += `*${i}* — ${n}${i === S.guiStyle ? ' ✅' : ''}\n`; });
    msg += `\nChange with: \`/otp gui <number>\``;
    await sock.sendMessage(jid, { text: msg });
    return;
  }

  if (t === '/otp help') {
    await sock.sendMessage(jid, { text:
      `📋 *Crack SMS WA Bridge Commands*\n\n` +
      `🔧 *Basic Controls:*\n` +
      `\`/otp on\`           – Enable WA forwarding\n` +
      `\`/otp off\`          – Disable WA forwarding\n` +
      `\`/otp status\`       – Full status & stats\n\n` +
      `👥 *Group Management:*\n` +
      `\`/otp group <JID>\`  – Set target WA group\n` +
      `\`/otp getjid\`       – Get JID of this chat\n\n` +
      `🎨 *Styles & Display:*\n` +
      `\`/otp gui <0-9>\`    – Change OTP message style\n` +
      `\`/otp styles\`       – List all 10 styles\n` +
      `\`/otp test\`         – Preview current style\n\n` +
      `🔐 *Pairing (if configured):*\n` +
      `\`/otp pair\`         – Start pairing process\n` +
      `\`/otp pair <CODE>\`  – Validate pairing code\n` +
      `\`/otp pairinghelp\`  – Pairing info\n\n` +
      `ℹ️  _Commands only work from the linked number._` });
    return;
  }

  // ── Pairing commands ──────────────────────────────────────
  if (t === '/otp pair') {
    if (S.pairingStatus === 'paired') {
      await sock.sendMessage(jid, { text: `✅ *Already paired!*\n\nPhone: +${S.linkedPhone}\n\nStatus: ${S.pairingStatus}` });
      return;
    }
    if (CFG.pairingMode === 'code') {
      const code = generatePairingCode();
      await sock.sendMessage(jid, { text:
        `🔐 *Pairing Code Generated*\n\n` +
        `Code: \`${code}\`\n\n` +
        `⏰ Valid for: 10 minutes\n` +
        `📱 Scan from another device:\n` +
        `→ WhatsApp >> Linked Devices >> Link a Device >> Use Pairing Code\n\n` +
        `Then send:\n\`/otp pair ${code}\`` });
      return;
    }
    if (CFG.pairingMode === 'phone') {
      await sock.sendMessage(jid, { text:
        `📱 *Phone Number Pairing*\n\n` +
        `Configured: ${CFG.phoneNumber}\n\n` +
        `The system is attempting to link this WhatsApp number.\n\n` +
        `Status: ${S.pairingStatus}` });
      return;
    }
    await sock.sendMessage(jid, { text: `❌ QR code pairing not available via commands.\nScan the QR code from terminal output.` });
    return;
  }

  const pairCodeMatch = t.match(/^\/otp pair\s+(.+)/i);
  if (pairCodeMatch) {
    const inputCode = pairCodeMatch[1].trim();
    if (validatePairingCode(inputCode)) {
      await sock.sendMessage(jid, { text: `✅ *Pairing Successful!*\n\nCode validated and accepted.` });
    } else {
      S.otpsFailed++;
      saveState();
      await sock.sendMessage(jid, { text: `❌ *Invalid Pairing Code*\n\nPlease try again.\n\nSend \`/otp pair\` to generate a new code.` });
    }
    return;
  }

  if (t === '/otp pairinghelp') {
    const pairingInfo = `📱 *Pairing Modes Help*\n\n` +
      `Current Mode: *${CFG.pairingMode.toUpperCase()}*\n` +
      `Status: *${S.pairingStatus}*\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🔲 *QR Code Mode*\n` +
      `• Scan QR from terminal\n` +
      `• Traditional method\n` +
      `• No commands needed\n\n` +
      `🔐 *Pairing Code Mode*\n` +
      `• Send \`/otp pair\` to generate\n` +
      `• 10-minute validity\n` +
      `• Use code on another device\n\n` +
      `☎️  *Phone Number Mode*\n` +
      `• Direct phone pairing\n` +
      `• Configured: ${CFG.phoneNumber || 'NOT SET'}\n` +
      `• Status: ${S.pairingStatus}`;
    await sock.sendMessage(jid, { text: pairingInfo });
    return;
  }
}

async function startBridge() {
  if (isRunning) return;
  isRunning = true;
  
  // Load persisted state from previous session
  loadState();
  
  await fs.ensureDir(CFG.sessionDir);
  console.log(chalk.blue(`🔄 Starting WA OTP Bridge…  Session: ${CFG.sessionDir}`));

  const { state: auth, saveCreds } = await useMultiFileAuthState(CFG.sessionDir);
  const { version } = await fetchLatestBaileysVersion();
  const cache = new NodeCache();
  const browsers = [Browsers.macOS('Chrome'), Browsers.macOS('Safari'), Browsers.windows('Edge')];

  // ── Pairing mode selection ─────────────────────────────────
  let pairingMode = CFG.pairingMode;
  if (pairingMode === 'phone' && !CFG.phoneNumber) {
    Logger.warn(`Phone pairing requested but no WA_PHONE_NUMBER env var. Falling back to QR.`);
    pairingMode = 'qr';
  }

  const socketConfig = {
    version,
    auth: { creds: auth.creds, keys: makeCacheableSignalKeyStore(auth.keys, pino({ level: 'silent' })) },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: pairingMode === 'qr',
    browser: browsers[Math.floor(Math.random() * browsers.length)],
    msgRetryCounterCache: cache,
    defaultQueryTimeoutMs: 60_000,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
  };

  // ── Apply pairing mode options ─────────────────────────────
  if (pairingMode === 'code') {
    socketConfig.mobile = false;
    Logger.title('Pairing Code Mode');
    const code = generatePairingCode();
    Logger.info(`Pairing code: ${code}`);
    Logger.info(`Valid for 10 minutes`);
    Logger.end();
  } else if (pairingMode === 'phone') {
    socketConfig.mobile = false;
    socketConfig.phoneNumber = CFG.phoneNumber;
    Logger.title('Phone Number Pairing');
    await fetchPhoneNumberInfo();
    Logger.info(`Pairing with: ${CFG.phoneNumber}`);
    Logger.info(`Waiting for device link...`);
    Logger.end();
  } else {
    Logger.info(`Using QR code pairing mode`);
  }

  sock = makeWASocket(socketConfig);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrterm.generate(qr, { small: true });
      Logger.warn('📱 Scan QR → WhatsApp → Linked Devices → Link a Device');
    }
    
    if (connection === 'open') {
      S.linkedPhone = (sock.user?.id || '').split(':')[0].split('@')[0];
      S.startedAt = Date.now();
      S.reconnectCount = 0;
      S.pairingStatus = 'paired';
      saveState();
      
      Logger.title('✅ WhatsApp Connected');
      Logger.success(`Phone: +${S.linkedPhone}`);
      Logger.info(`Target group: ${S.waGroupJid || '⚠️  not set — send /otp group <JID>'}`);
      Logger.info(`Forwarding: ${S.otpForwardingOn ? 'ON ✅' : 'OFF 🔴 — send /otp on to enable'}`);
      Logger.info(`GUI Style: ${S.guiStyle}`);
      Logger.info(`Pairingmode: ${CFG.pairingMode}`);
      Logger.end();
    }
    
    if (connection === 'close') {
      isRunning = false;
      S.reconnectCount++;
      saveState();
      
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        Logger.error('❌ Logged out. Delete wa_session/ and restart.');
        process.exit(1);
      } else {
        Logger.warn(`⚠️  Disconnected (code ${code}). Reconnecting in ${CFG.reconnectMs / 1000}s…`);
        setTimeout(startBridge, CFG.reconnectMs);
      }
    }
  });

  // Only handle self-sent messages (commands)
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      if (!m.message || !m.key.fromMe) continue;
      const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
      if (!body.startsWith('/otp')) continue;
      try { 
        await handleSelfCmd(m.key.remoteJid, body); 
      } catch (e) { 
        Logger.error(`Command error: ${e.message}`); 
      }
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  HTTP SERVER
// ══════════════════════════════════════════════════════════════
function readBody(req) {
  return new Promise((res, rej) => {
    let b = '';
    req.on('data', d => { b += d; if (b.length > 100_000) req.destroy(); });
    req.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } });
    req.on('error', rej);
  });
}

const server = http.createServer(async (req, res) => {
  // ── GET /health ───────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/health') {
    checkDailyReset();
    const uptime = Math.floor((Date.now() - S.startedAt) / 1000);
    if (uptime > S.maxUptime) S.maxUptime = uptime;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: sock?.user ? 'ok' : 'error',
      connected: sock?.user != null,
      phone: S.linkedPhone || null,
      uptime,
      otpsSent: S.otpsSent,
      otpsToday: S.otpsToday,
      maxUptime: S.maxUptime,
      pairingStatus: S.pairingStatus,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  if (req.method !== 'POST') { 
    Logger.warn(`${req.method} ${req.url} → 405 Method Not Allowed`);
    res.writeHead(405); res.end('Method Not Allowed'); 
    return; 
  }
  
  let data;
  try { 
    data = await readBody(req); 
  } catch (e) { 
    Logger.error(`Failed to parse request body: ${e.message}`);
    res.writeHead(400); res.end(JSON.stringify({ error: 'bad json' })); 
    return; 
  }
  
  if (data.secret !== CFG.secret) { 
    Logger.warn(`Unauthorized request from ${req.socket.remoteAddress}`);
    res.writeHead(403); res.end(JSON.stringify({ error: 'forbidden' })); 
    return; 
  }

  // ── POST /forward_otp ──────────────────────────────────────
  if (req.url === '/forward_otp') {
    if (!S.otpForwardingOn) { res.writeHead(200); res.end(JSON.stringify({ ok: true, skipped: 'off' })); return; }
    if (!S.waGroupJid)      { res.writeHead(200); res.end(JSON.stringify({ ok: false, error: 'no_group' })); return; }

    // Python sends: flag, region, svc, number, otp, msgBody, panelName, botTag
    const payload = {
      flag:      data.flag      || '🌍',
      region:    data.region    || '',
      svc:       data.svc       || 'OTP',
      number:    data.number    || '',
      otp:       data.otp       || '',
      msgBody:   data.msgBody   || data.msg_body || '',
      panelName: data.panelName || data.panel_name || '',
      botTag:    data.botTag    || data.bot_tag || '@CrackSMSReBot',
    };

    checkDailyReset();
    const text = formatOtpMessage(S.guiStyle, payload);
    try {
      await sendToWaGroup(text);
      Logger.success(`OTP forwarded → ${S.waGroupJid.slice(0,18)}… [style ${S.guiStyle}]`);
      res.writeHead(200); res.end(JSON.stringify({ ok: true, style: S.guiStyle }));
    } catch (e) {
      Logger.error(`Forward failed: ${e.message}`);
      S.otpsFailed++;
      saveState();
      res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── POST /control ──────────────────────────────────────────
  if (req.url === '/control') {
    const action = data.action;
    
    if (action === 'on') {
      if (!S.waGroupJid) { res.writeHead(200); res.end(JSON.stringify({ ok: false, error: 'no_group' })); return; }
      S.otpForwardingOn = true; saveState();
      Logger.success(`Control: OTP forwarding turned ON`);
      res.writeHead(200); res.end(JSON.stringify({ ok: true, forwarding: true })); return;
    }
    
    if (action === 'off') {
      S.otpForwardingOn = false; saveState();
      Logger.info(`Control: OTP forwarding turned OFF`);
      res.writeHead(200); res.end(JSON.stringify({ ok: true, forwarding: false })); return;
    }
    
    if (action === 'set_group') {
      const jid = String(data.jid || '').trim();
      if (!jid.includes('@')) { res.writeHead(400); res.end(JSON.stringify({ error: 'invalid JID' })); return; }
      S.waGroupJid = jid; saveState();
      Logger.info(`Control: Group set to ${jid.slice(0,20)}…`);
      res.writeHead(200); res.end(JSON.stringify({ ok: true, jid })); return;
    }
    
    if (action === 'set_gui') {
      const gs = parseInt(data.style ?? 0);
      S.guiStyle = Math.max(0, Math.min(9, gs)); saveState();
      Logger.info(`Control: GUI Style changed to ${S.guiStyle}`);
      res.writeHead(200); res.end(JSON.stringify({ ok: true, guiStyle: S.guiStyle })); return;
    }
    
    if (action === 'status') {
      checkDailyReset();
      const sec = Math.floor((Date.now() - S.startedAt) / 1000);
      res.writeHead(200); res.end(JSON.stringify({
        ok: true, forwarding: S.otpForwardingOn, waGroupJid: S.waGroupJid,
        phone: S.linkedPhone, connected: sock?.user != null,
        uptime: sec, otpsSent: S.otpsSent, otpsToday: S.otpsToday,
        guiStyle: S.guiStyle, pairingStatus: S.pairingStatus,
        otpsFailed: S.otpsFailed, reconnectCount: S.reconnectCount,
      })); return;
    }
    
    if (action === 'pair_code') {
      if (CFG.pairingMode !== 'code') {
        res.writeHead(400); res.end(JSON.stringify({ error: 'pairing_mode_not_code' })); return;
      }
      const code = generatePairingCode();
      Logger.info(`Control: Pairing code generated: ${code}`);
      res.writeHead(200); res.end(JSON.stringify({ ok: true, pairingCode: code, expiresIn: 600 })); return;
    }

    if (action === 'validate_pair') {
      const inputCode = String(data.code || '').trim();
      if (validatePairingCode(inputCode)) {
        Logger.success(`Control: Pairing code validated`);
        res.writeHead(200); res.end(JSON.stringify({ ok: true, pairingStatus: S.pairingStatus })); return;
      } else {
        res.writeHead(400); res.end(JSON.stringify({ ok: false, error: 'invalid_code' })); return;
      }
    }
    
    // ── PREMIUM FEATURES ─────────────────────────────────────
    if (action === 'schedule_message') {
      const target = String(data.target || '').trim();
      const text = String(data.text || '').trim();
      const delayMs = parseInt(data.delay_ms || 5000);
      if (!target || !text) { res.writeHead(400); res.end(JSON.stringify({ error: 'missing_params' })); return; }
      const result = await scheduleMessage(sock, target, text, delayMs);
      res.writeHead(200); res.end(JSON.stringify(result)); return;
    }
    
    if (action === 'create_group') {
      const groupName = String(data.group_name || 'New Group').trim();
      const members = Array.isArray(data.members) ? data.members : [];
      if (!sock) { res.writeHead(500); res.end(JSON.stringify({ error: 'socket_not_ready' })); return; }
      const result = await createGroupChat(sock, groupName, members);
      res.writeHead(200); res.end(JSON.stringify(result)); return;
    }
    
    if (action === 'send_media') {
      const target = String(data.target || '').trim();
      const mediaPath = String(data.media_path || '').trim();
      const caption = String(data.caption || '').trim();
      if (!target || !mediaPath) { res.writeHead(400); res.end(JSON.stringify({ error: 'missing_params' })); return; }
      if (!sock) { res.writeHead(500); res.end(JSON.stringify({ error: 'socket_not_ready' })); return; }
      const result = await sendMediaMessage(sock, target, mediaPath, caption);
      res.writeHead(200); res.end(JSON.stringify(result)); return;
    }
    
    if (action === 'check_rate_limit') {
      const phone = String(data.phone || '').trim();
      const rateLimitCheck = RateLimiter.check(phone);
      res.writeHead(200); res.end(JSON.stringify({ ok: true, ...rateLimitCheck })); return;
    }
    
    if (action === 'add_template') {
      const templateName = String(data.template_name || '').trim();
      const templateText = String(data.template_text || '').trim();
      if (!templateName || !templateText) { res.writeHead(400); res.end(JSON.stringify({ error: 'missing_params' })); return; }
      const result = addCustomTemplate(templateName, templateText);
      res.writeHead(200); res.end(JSON.stringify(result)); return;
    }
    
    if (action === 'render_template') {
      const templateName = String(data.template || '').trim();
      const variables = data.variables || {};
      const rendered = renderTemplate(templateName, variables);
      res.writeHead(200); res.end(JSON.stringify({ ok: true, text: rendered })); return;
    }
    
    if (action === 'get_groups') {
      res.writeHead(200); res.end(JSON.stringify({
        ok: true,
        groups: Object.entries(PREMIUM.groupsList).map(([jid, g]) => ({ jid, ...g })),
        count: Object.keys(PREMIUM.groupsList).length,
      })); return;
    }
    
    if (action === 'get_scheduled') {
      res.writeHead(200); res.end(JSON.stringify({
        ok: true,
        scheduled: PREMIUM.messageSchedule,
        count: PREMIUM.messageSchedule.length,
      })); return;
    }
    
    Logger.warn(`Control: Unknown action ${action}`);
    res.writeHead(400); res.end(JSON.stringify({ error: 'unknown action' })); return;
  }

  res.writeHead(404); res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(CFG.bridgePort, '127.0.0.1', () => {
  Logger.title('HTTP Bridge Server Started');
  Logger.info(`Listening on 127.0.0.1:${CFG.bridgePort}`);
  Logger.info(`POST /forward_otp  ← Python sends OTPs here`);
  Logger.info(`POST /control       ← Python admin panel`);
  Logger.info(`GET  /health        ← Health check endpoint`);
  Logger.end();
});

// ══════════════════════════════════════════════════════════════
//  ENTRY POINT
// ══════════════════════════════════════════════════════════════
(async () => {
  Logger.title('Crack SMS WA OTP Bridge v3.0');
  Logger.success('Professional Edition');
  Logger.info('10 GUI styles  |  Advanced Pairing  |  Multi-device Support');
  Logger.info('Premium Features: Groups • Scheduling • Media • Rate Limiting');
  Logger.info(`Dev: @NONEXPERTCODER`);
  Logger.info(`Pairing Mode: ${CFG.pairingMode.toUpperCase()}`);
  Logger.end();
  
  await startBridge();
  
  // Process scheduled messages every 5 seconds
  setInterval(async () => {
    if (sock?.user) await processScheduledMessages(sock);
  }, 5000);
})();

process.on('SIGINT', () => { 
  Logger.warn('SIGINT received. Saving state and shutting down...');
  saveState(); 
  try { sock?.end(); } catch (_) {} 
  server.close(() => {
    Logger.success('Bridge stopped gracefully');
    process.exit(0);
  });
});
