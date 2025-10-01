from app import db
from sqlalchemy import DateTime
import datetime
import pytz

VIETNAM_TIMEZONE = pytz.timezone('Asia/Ho_Chi_Minh')

def now_in_vietnam():
    return datetime.datetime.now(VIETNAM_TIMEZONE).replace(tzinfo=None)

class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=now_in_vietnam)
    materials = db.relationship('Material', backref='course', lazy=True)  # Thêm relationship

    def __repr__(self):
        return f'<Course {self.title}>'