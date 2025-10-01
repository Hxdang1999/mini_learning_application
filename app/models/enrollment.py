from app import db
import datetime

class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    course = db.relationship('Course', backref='enrollments', lazy=True) 
    
    # Đảm bảo một sinh viên chỉ có thể đăng ký một khóa học một lần
    __table_args__ = (db.UniqueConstraint('student_id', 'course_id', name='_student_course_uc'),)