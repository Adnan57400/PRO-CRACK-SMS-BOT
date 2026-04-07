FROM node:18-slim

# Install Python, pip, git, and supervisord
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    build-essential \
    curl \
    supervisor \
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

# Create supervisord config
RUN mkdir -p /var/log/supervisor && \
    echo '[supervisord]\n\
nodaemon=true\n\
logfile=/var/log/supervisor/supervisord.log\n\
\n\
[program:whatsapp]\n\
command=node /app/whatsapp_otp.js\n\
autostart=true\n\
autorestart=true\n\
stderr_logfile=/var/log/supervisor/whatsapp.err.log\n\
stdout_logfile=/var/log/supervisor/whatsapp.out.log\n\
\n\
[program:bot]\n\
command=python3 /app/bot.py\n\
autostart=true\n\
autorestart=true\n\
stderr_logfile=/var/log/supervisor/bot.err.log\n\
stdout_logfile=/var/log/supervisor/bot.out.log\n\
' > /etc/supervisor/conf.d/services.conf

# Start supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
