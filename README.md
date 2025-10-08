<h1 align="center">🎓 Mini Learning Application</h1>

<p align="center">
  <img src="https://minilearning.labhouse.cloud/static/images/background_static.jpg" width="600" alt="Mini Learning App Banner"/>
</p>

<p align="center">
  <b>Ứng dụng học trực tuyến phân quyền - Admin | Teacher | Student</b> <br>
  <i>Built with Flask • Dockerized • Secured by JWT Authentication</i>
</p>

<p align="center">
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.13.7-blue?logo=python"></a>
  <a href="https://flask.palletsprojects.com/"><img src="https://img.shields.io/badge/Flask-2.x-green?logo=flask"></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Enabled-blue?logo=docker"></a>
  <a href="#"><img src="https://img.shields.io/badge/JWT-Security-orange?logo=jsonwebtokens"></a>
  <a href="#"><img src="https://img.shields.io/badge/Status-Online-success?logo=googlechrome"></a>
</p>

---

## 🌐 Live Demo

> 🔗 **Website:** [https://minilearning.labhouse.cloud/login](https://minilearning.labhouse.cloud/login)  
> 🐳 Hosted via Docker Compose on Labhouse Cloud

---

## 🧠 Giới thiệu

**Mini Learning Application** là một nền tảng học trực tuyến mini được phát triển bằng **Flask (Python 3.13)**, cho phép quản lý khóa học, tài liệu, bài tập và người dùng theo vai trò:

| Vai trò | Quyền hạn |
|----------|-----------|
| 👑 **Admin** | Quản trị hệ thống, quản lý tài khoản, tạo sub-admin |
| 👨‍🏫 **Teacher** | Tạo khóa học, thêm tài liệu, bài tập, chấm điểm |
| 🧑‍🎓 **Student** | Đăng ký học, xem tài liệu, nộp bài tập, xem điểm |

---

## 🏗️ Kiến trúc hệ thống

```yaml
Frontend (HTML, CSS, JS)
        ↓
Flask Controllers (Blueprints)
        ↓
Service Layer (Business Logic)
        ↓
Repository Layer (Database Access)
        ↓
Model (SQLAlchemy ORM)
        ↓
Database (SQLite / MySQL)
```

**Cấu trúc thư mục:**

```yaml
app/
 ├── __init__.py              # Khởi tạo Flask app, DB, JWT
 ├── api/                     # Controllers (auth, admin, course, ...)
 ├── models/                  # ORM models
 ├── repositories/            # CRUD repository layer
 ├── services/                # Business logic
 ├── static/                  # CSS, JS, images, videos
 └── templates/               # HTML pages
```

---

## ⚙️ Cài đặt & Chạy ứng dụng bằng Docker

### 🧩 Yêu cầu

- [Docker Desktop](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

---

### 🐳 Chạy ứng dụng

```bash
# Build & run container
docker compose up --build
```

Truy cập tại:  
👉 http://localhost:5000

---

### 👑 Tạo tài khoản Admin gốc

```bash
docker exec -it mini_learning_web python create_root_admin.py
```

Đăng nhập với:
```yaml
username: admin
password: 1234
```

---

## 🧱 Cấu hình Docker

### 🐍 Dockerfile

```dockerfile
FROM python:3.13.7-slim

WORKDIR /app

COPY requirements.txt .
RUN apt-get update && apt-get install -y --no-install-recommends         build-essential gcc libpq-dev &&     pip install --upgrade pip &&     pip install --no-cache-dir -r requirements.txt &&     apt-get clean && rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 5000
ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

CMD ["python", "run.py"]
```

### 🧩 docker-compose.yml

```yaml
services:
  web:
    build: .
    container_name: mini_learning_web
    ports:
      - "5000:5000"
    volumes:
      - .:/app
    environment:
      - FLASK_ENV=production
    restart: unless-stopped
```

---

## 💻 Giao diện người dùng

| Màn hình | Đường dẫn | Mô tả |
|-----------|------------|------|
| 🔐 Trang đăng nhập | `/login` | Form đăng nhập có nền video động |
| 👑 Admin Dashboard | `/admin/dashboard` | Quản lý người dùng, sub-admin |
| 👨‍🏫 Teacher Dashboard | `/teacher/dashboard` | Quản lý khóa học, bài tập |
| 🧑‍🎓 Student Dashboard | `/student/dashboard` | Xem khóa học, nộp bài |

---

## 🧾 Phân quyền hệ thống

| Quyền | Mô tả |
|--------|-------|
| `admin` | Truy cập toàn bộ hệ thống |
| `teacher` | CRUD khóa học, tài liệu, bài tập |
| `student` | Enroll, xem bài học, nộp bài |
| `jwt_required` | Xác thực API bằng token (JWT) |

---

## 🔒 Bảo mật

- 🔐 JWT Authentication – Xác thực người dùng  
- 🧩 Flask-Bcrypt – Mã hóa mật khẩu  
- 🧱 SQLAlchemy ORM – Chống SQL Injection  
- 🔒 Role-based Access – Phân quyền rõ ràng  

---

## 🧰 Công nghệ sử dụng

| Thành phần | Công nghệ |
|-------------|------------|
| **Ngôn ngữ** | Python 3.13.7 |
| **Framework** | Flask |
| **ORM** | SQLAlchemy |
| **Bảo mật** | Flask-JWT-Extended, Flask-Bcrypt |
| **Database** | SQLite / MySQL |
| **Containerization** | Docker & Docker Compose |
| **Frontend** | HTML5, CSS3, JavaScript thuần |
| **Deploy** | Labhouse Cloud (HTTPS Enabled) |

---

## 🌍 Triển khai thực tế

| Môi trường | Trạng thái |
|-------------|-------------|
| **Labhouse Cloud** | ✅ Online |
| **Docker Compose** | ✅ Running |
| **SSL (HTTPS)** | ✅ Active |
| **Domain** | [minilearning.labhouse.cloud](https://minilearning.labhouse.cloud) |

---

## 📈 Hướng mở rộng

| Hướng phát triển | Gợi ý |
|------------------|--------|
| 🎨 React/Vue Frontend | Chuyển sang SPA sử dụng API Flask |
| 🧮 Dashboard nâng cao | Thêm Chart.js hiển thị điểm, tiến độ |
| 🧠 AI Gợi ý học tập | Áp dụng mô hình NLP để đề xuất khóa học |
| ☁️ CI/CD | GitHub Actions auto-deploy |
| 🧾 MySQL | Thay SQLite bằng DB mạnh hơn |

---

## 🖼️ Hình ảnh minh họa

<p align="center">
  <img src="https://minilearning.labhouse.cloud/static/images/background_static.jpg" width="80%">
</p>

<p align="center">
  <i>© 2025 Mini Learning Application • All rights reserved</i>
</p>
