FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build application
RUN npm run build

# Expose API port
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start:prod"]
