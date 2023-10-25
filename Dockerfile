FROM node:18-alpine AS build

# Create app directory
WORKDIR /usr/src/app

# install git to clone dependency from github
RUN apk add --no-cache git

# Copy both package*.json files
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]