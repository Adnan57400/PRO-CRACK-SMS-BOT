FROM node:18-slim

# Install Python, pip, git, and other build essentials
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm install

# Install Python dependencies with --break-system-packages
RUN pip3 install --break-system-packages -r requirements.txt

# Copy application files
COPY . .

# Create startup script
RUN echo '#!/bin/sh\n\
echo "🚀 Starting WhatsApp bridge..."\n\
node whatsapp_otp.js > /tmp/wa.log 2>&1 &\n\
sleep 2\n\
echo "🚀 Starting Telegram bot..."\n\
python3 bot.py > /tmp/bot.log 2>&1 &\n\
wait\n\
' > /app/start.sh && chmod +x /app/start.sh

# Start both services
CMD ["/bin/sh", "/app/start.sh"]
