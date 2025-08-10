FROM node:23.5-alpine

WORKDIR /app

COPY ./package.json ./package-lock.json* ./
RUN npm install

COPY . /app
