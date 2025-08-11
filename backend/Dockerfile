FROM python:3.13-slim AS builder

WORKDIR /app

RUN apt-get update && \
  apt-get install -y gcc build-essential python3-dev && \
  rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt ./
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

COPY . /app

FROM python:3.13-slim

WORKDIR /app

COPY --from=builder /install /usr/local
COPY --from=builder /app /app

ENV PYTHONUNBUFFERED=1
