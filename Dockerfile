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

# Create startup script - START BOT.PY FIRST
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -x

echo "🚀 Starting Crack SMS v20 - Professional Edition"

# Start Python bot FIRST
echo "🤖 Starting Telegram Bot..."
python3 /app/bot.py &
BOT_PID=$!
echo "Bot PID: $BOT_PID"

# Wait 5 seconds for bot to initialize
sleep 5

# Then start WhatsApp bridge
echo "📱 Starting WhatsApp OTP Bridge..."
node /app/whatsapp_otp.js &
WA_PID=$!
echo "WhatsApp bridge PID: $WA_PID"

# Handle signals
trap "echo 'Shutting down...'; kill $BOT_PID $WA_PID 2>/dev/null; exit 0" SIGTERM SIGINT

# Keep container alive
while kill -0 $BOT_PID 2>/dev/null || kill -0 $WA_PID 2>/dev/null; do
    sleep 1
done

echo "Both services stopped"
exit 0
EOF

RUN chmod +x /app/start.sh

# Use ENTRYPOINT instead of CMD
ENTRYPOINT ["/app/start.sh"]
