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
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

# Copy application files
COPY . .

# Set Python path
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    NODE_ENV=production

# Create startup script - NO health check, just start both services
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting Crack SMS v20 - Professional Edition"

# Start WhatsApp bridge in background
echo "📱 Starting WhatsApp OTP Bridge..."
node /app/whatsapp_otp.js > /tmp/wa_bridge.log 2>&1 &
WA_PID=$!

# Give bridge 5 seconds to start
sleep 5

# Start Python bot immediately (don't wait for bridge health)
echo "🤖 Starting Telegram Bot..."
python3 /app/bot.py > /tmp/bot.log 2>&1 &
BOT_PID=$!

# Handle signals
trap "kill $WA_PID $BOT_PID 2>/dev/null || true" SIGTERM SIGINT

# Wait for both processes
wait $WA_PID $BOT_PID
EOF

RUN chmod +x /app/start.sh

# Health check - just check if container is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD ps aux | grep -E "(node|python3)" | grep -v grep > /dev/null || exit 1

# Start both services
CMD ["/app/start.sh"]
