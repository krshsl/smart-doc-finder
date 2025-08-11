ARG VITE_NODE_ENV=production
ARG VITE_API_BASE_URL="api"

FROM node:23.5-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . /app

ARG VITE_NODE_ENV
ARG VITE_API_BASE_URL
ENV VITE_NODE_ENV=$VITE_NODE_ENV
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN if [ "$VITE_NODE_ENV" = "production" ]; then npm run build; fi

FROM node:23.5-alpine

WORKDIR /app

COPY --from=builder /app /app
