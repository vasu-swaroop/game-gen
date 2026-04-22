FROM python:3.12-slim as base

FROM base as deps
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM deps as backend
WORKDIR /app
COPY . .

FROM backend as development
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--reload"]
