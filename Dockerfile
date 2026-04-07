FROM node:18-slim

# Install Python, git, and other dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3-pip \
    curl \
    ca-certificates \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Configure git to use HTTPS instead of SSH
RUN git config --global url."https://github.com/".insteadOf git://github.com/ && \
    git config --global url."https://".insteadOf git://

# Copy and install Node.js dependencies
COPY package*.json ./
RUN npm install --omit=dev --no-optional

# Copy and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy application files
COPY . .

# Set Python path
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    NODE_ENV=production

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting Crack SMS v20 - Professional Edition"

# Start WhatsApp bridge in background
echo "📱 Starting WhatsApp OTP Bridge..."
node /app/whatsapp_otp.js &
WA_PID=$!

# Wait for bridge to be healthy (max 30 seconds)
echo "⏳ Waiting for WhatsApp bridge to be ready..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:7891/health > /dev/null 2>&1; then
        echo "✅ WhatsApp bridge is healthy"
        break
    fi
    echo "  Attempt $i/30..."
    sleep 1
done

# Start Python bot
echo "🤖 Starting Telegram Bot..."
python3 /app/bot.py &
BOT_PID=$!

# Handle signals
trap "kill $WA_PID $BOT_PID 2>/dev/null || true" SIGTERM SIGINT

# Wait for both processes
wait $WA_PID $BOT_PID
EOF

RUN chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://127.0.0.1:7891/health || exit 1

# Start both services
CMD ["/app/start.sh"]
