FROM node:18-alpine

WORKDIR /app

# Copy frontend code
COPY frontend/ .

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

# Serve with a simple HTTP server
RUN npm install -g serve

EXPOSE 3000

# Run the application
CMD ["serve", "-s", "dist", "-l", "3000"]
