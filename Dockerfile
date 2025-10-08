# ===== Base image: Python 3.13.7 slim =====
FROM python:3.13.7-slim

# Tạo thư mục làm việc
WORKDIR /app

# Copy file yêu cầu và cài đặt gói
COPY requirements.txt .

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential gcc libpq-dev && \
    pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy toàn bộ mã nguồn dự án
COPY . .

# Expose Flask port
EXPOSE 5000

# Biến môi trường
ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Command chạy Flask
CMD ["python", "run.py"]
