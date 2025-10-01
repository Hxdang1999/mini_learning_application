# app/api/frontend_controller.py
from flask import Blueprint, render_template, redirect, url_for

frontend_bp = Blueprint('frontend', __name__)

@frontend_bp.route('/')
def home():
    return redirect(url_for('frontend.login'))

@frontend_bp.route('/login')
def login():
    return render_template('login.html')

@frontend_bp.route('/register')
def register():
    return render_template('register.html')

@frontend_bp.route('/teacher/dashboard')
def teacher_dashboard():
    return render_template('teacher_dashboard.html')

# THÊM ROUTE NÀY VÀO ĐỂ HIỂN THỊ TRANG CHỈNH SỬA
@frontend_bp.route('/teacher/courses/<int:course_id>') 
def edit_course_page(course_id):
    # Flask sẽ render template và truyền course_id vào
    return render_template('edit_course.html', course_id=course_id)

@frontend_bp.route('/student/dashboard')
def student_dashboard():
    return render_template('student_dashboard.html')