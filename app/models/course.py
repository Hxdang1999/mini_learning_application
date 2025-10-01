# app/models/course.py
from app import db
from sqlalchemy import DateTime
import datetime
import pytz # <-- CẦN CÓ pytz

# Định nghĩa múi giờ địa phương cho Việt Nam (UTC+7)
VIETNAM_TIMEZONE = pytz.timezone('Asia/Ho_Chi_Minh')

# Hàm lấy thời gian hiện tại theo múi giờ Việt Nam
# Sử dụng .replace(tzinfo=None) để tránh lỗi với SQLite do không hỗ trợ native timezone
def now_in_vietnam():
    return datetime.datetime.now(VIETNAM_TIMEZONE).replace(tzinfo=None)

class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    # CẬP NHẬT: Sử dụng hàm mới để lưu thời gian theo múi giờ Việt Nam
    created_at = db.Column(db.DateTime, default=now_in_vietnam) 
    
    def __repr__(self):
        return f'<Course {self.title}>'