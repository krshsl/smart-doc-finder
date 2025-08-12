FROM python:3.13-slim AS builder

WORKDIR /app

RUN apt-get update && \
  apt-get install -y gcc build-essential python3-dev && \
  rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt ./
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

RUN apt-get remove -y gcc build-essential && \
  apt-get autoremove -y && \
  rm -rf /var/lib/apt/lists/*

COPY . /app


FROM python:3.13-slim

WORKDIR /app

RUN useradd --create-home appuser

COPY --from=builder /install /usr/local
COPY --from=builder /app /app

RUN chown -R appuser:appuser /app
USER appuser

ENV PYTHONUNBUFFERED=1
