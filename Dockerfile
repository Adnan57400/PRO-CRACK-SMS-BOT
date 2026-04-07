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

# Start both services
CMD node whatsapp_otp.js & python3 bot.py
