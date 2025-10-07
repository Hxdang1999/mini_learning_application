# app/repositories/course_repository.py
from app.models.course import Course
from app.models.enrollment import Enrollment
from app import db
from sqlalchemy.exc import IntegrityError

class CourseRepository:
    def create(self, title, description, is_public, teacher_id):
        new_course = Course(title=title, description=description, is_public=is_public, teacher_id=teacher_id)
        db.session.add(new_course)
        db.session.commit()
        return new_course

    def get_by_id(self, course_id):
        return Course.query.get(course_id)

    def get_all_by_teacher(self, teacher_id):
        return Course.query.filter_by(teacher_id=teacher_id).all()

    def get_all_public_courses(self):
        return Course.query.filter_by(is_public=True).all()

    def update(self, course_id, data):
        course = self.get_by_id(course_id)
        if course:
            for key, value in data.items():
                setattr(course, key, value)
            db.session.commit()
            return course
        return None

    def delete(self, course_id):
        course = self.get_by_id(course_id)
        if course:
            db.session.delete(course)
            db.session.commit()
            return True
        return False

    def is_student_enrolled(self, student_id, course_id):
        return Enrollment.query.filter_by(student_id=student_id, course_id=course_id).first() is not None

    def enroll_student_in_course(self, student_id, course_id, is_public=True):
        status = "active" if is_public else "pending"
        enrollment = Enrollment(student_id=student_id, course_id=course_id, status=status)
        try:
            db.session.add(enrollment)
            db.session.commit()
            return enrollment
        except IntegrityError:
            db.session.rollback()
            return None

    def get_student_enrolled_courses(self, student_id):
        return db.session.query(Course)\
            .join(Enrollment, Course.id == Enrollment.course_id)\
            .filter(Enrollment.student_id == student_id)\
            .all()

    def get_enrollment(self, student_id, course_id):
        return Enrollment.query.filter_by(student_id=student_id, course_id=course_id).first()

    def unenroll_student_from_course(self, enrollment):
        db.session.delete(enrollment)
        db.session.commit()

    # Phương thức mới: Lấy danh sách yêu cầu đăng ký (pending enrollments)
    def get_pending_enrollments(self, course_id):
        return Enrollment.query.filter_by(course_id=course_id, status='pending').all()

    # Phương thức mới: Duyệt/từ chối yêu cầu đăng ký
    def update_enrollment_status(self, enrollment_id, status):
        enrollment = Enrollment.query.get(enrollment_id)
        if enrollment:
            enrollment.status = status
            db.session.commit()
            return enrollment
        return None
    
    # Phương thức mới: Lấy danh sách sinh viên active cho khóa học
    def get_enrolled_students(self, course_id):
        return Enrollment.query.filter_by(course_id=course_id, status='active').all()
    
    def get_enrollment_by_id(self, enrollment_id):
        return Enrollment.query.get(enrollment_id)
    
    def enroll_student(self, student_id, course_id):
        course = self.course_repo.get_by_id(course_id)
        if not course:
            return {"message": "Course not found."}, 404

        existing = self.course_repo.get_enrollment(student_id, course_id)
        if existing:
            # Nếu đã bị buộc rời khỏi khóa công khai, cấm đăng ký lại
            if course.is_public and existing.status == 'removed':
                return {"message": "You cannot rejoin this public course."}, 403
            return {"message": "Already enrolled or requested."}, 409

        enrollment = self.course_repo.enroll_student_in_course(student_id, course_id, is_public=course.is_public)
        if not enrollment:
            return {"message": "Failed to enroll. Possibly already requested."}, 409

        if course.is_public:
            return {"message": "Enrolled successfully."}, 200
        return {"message": "Enrollment request submitted. Waiting for approval."}, 202
