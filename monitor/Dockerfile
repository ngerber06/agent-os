FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

COPY monitor.py .
COPY publishers/ publishers/

CMD ["python", "-m", "monitor"]
