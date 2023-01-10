FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy both package*.json files
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]