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

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Crack SMS v20 - Professional Edition"

# Start WhatsApp bridge in background
echo "📱 Starting WhatsApp OTP Bridge..."
node /app/whatsapp_otp.js &
WA_PID=$!
echo "WhatsApp bridge PID: $WA_PID"

# Wait 3 seconds for bridge to initialize
sleep 3

# Start Python bot in background
echo "🤖 Starting Telegram Bot..."
python3 /app/bot.py &
BOT_PID=$!
echo "Bot PID: $BOT_PID"

# Handle signals
trap "echo 'Shutting down...'; kill $WA_PID $BOT_PID 2>/dev/null; exit 0" SIGTERM SIGINT

# Keep container alive - wait for both processes
while kill -0 $WA_PID 2>/dev/null || kill -0 $BOT_PID 2>/dev/null; do
    sleep 1
done

echo "Both services stopped"
exit 0
EOF

RUN chmod +x /app/start.sh

# Start both services - use exec to replace shell with script
CMD exec /app/start.sh
