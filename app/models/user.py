# app/models/user.py
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
import random
import string
from datetime import datetime
from zoneinfo import ZoneInfo 

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='student')  # admin, teacher, student
    is_root = db.Column(db.Boolean, default=False)  # Chỉ true cho admin gốc
    registration_code = db.Column(db.String(6), unique=True)  # Mã đăng ký cho admin
    max_users = db.Column(db.Integer, default=0)  # Số user tối đa cho admin phụ
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # ID admin quản lý (cho student/teacher)
    is_locked = db.Column(db.Boolean, default=False)  # Khóa user
    status = db.Column(db.String(20), default='active')  # Trạng thái: active, pending (mới)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))


    courses_enrolled = db.relationship('Enrollment', backref='enrollment_student', lazy=True)
    courses_taught = db.relationship('Course', backref='teacher', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_registration_code(self):
        self.registration_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    def __repr__(self):
        return f'<User {self.username}>'