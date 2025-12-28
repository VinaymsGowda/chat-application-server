# Use an official Node.js runtime as the base image
FROM node:alpine
# Set the working directory inside the container
WORKDIR /usr/src/app
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy application code to the container
COPY . .

EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]