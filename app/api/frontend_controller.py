from flask import Blueprint, render_template, redirect, url_for

# Blueprint cho các route hiển thị giao diện người dùng
frontend_bp = Blueprint('frontend', __name__)

@frontend_bp.route('/')
def home():
    # Chuyển hướng đến trang đăng nhập mặc định
    return redirect(url_for('frontend.login'))

@frontend_bp.route('/login')
def login():
    return render_template('login.html')

@frontend_bp.route('/register')
def register():
    return render_template('register.html')

# Thêm các route khác cho dashboard
@frontend_bp.route('/teacher/dashboard')
def teacher_dashboard():
    return render_template('teacher_dashboard.html')

@frontend_bp.route('/student/dashboard')
def student_dashboard():
    return render_template('student_dashboard.html')