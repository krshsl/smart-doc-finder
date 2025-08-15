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

COPY ./src /app/src
COPY ./scripts /app/scripts
COPY ./start.sh /app/start.sh


FROM python:3.13-slim

WORKDIR /app

RUN useradd --create-home appuser

COPY --from=builder /install /usr/local
COPY --from=builder /app /app
COPY ./start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

RUN chown -R appuser:appuser /app
USER appuser

ENV PYTHONUNBUFFERED=1 \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONOPTIMIZE=1 \
  PIP_NO_CACHE_DIR=1 \
  PIP_DISABLE_PIP_VERSION_CHECK=1

ENTRYPOINT ["start.sh"]
