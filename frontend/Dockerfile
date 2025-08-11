FROM node:23.5-alpine AS builder

WORKDIR /app

COPY ./package.json ./package-lock.json* ./
RUN npm install

COPY . /app

FROM node:23.5-alpine

WORKDIR /app

COPY --from=builder /app /app
