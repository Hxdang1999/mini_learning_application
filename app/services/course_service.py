# app/services/course_service.py
from app.repositories.course_repository import CourseRepository
from app.repositories.auth_repository import AuthRepository
from app import db

class CourseService:
    def __init__(self):
        self.course_repo = CourseRepository()
        self.auth_repo = AuthRepository()

    def create_course(self, user_id, title, description, is_public=False):
        teacher = self.auth_repo.get_user_by_id(user_id)
        if not teacher or teacher.role != 'teacher':
            return {"message": "Forbidden. Only teachers can create courses."}, 403
        if not title:
            return {"message": "Title is required"}, 400
        new_course = self.course_repo.create(title, description, is_public, user_id)
        return {"message": "Course created successfully", "course_id": new_course.id}, 201

    def get_teacher_courses(self, user_id):
        return self.course_repo.get_all_by_teacher(user_id)

    def get_course_details(self, course_id, user_id):
        course = self.course_repo.get_by_id(course_id)
        if not course:
            return None, 404
        if course.teacher_id != user_id:
            return None, 403
        return course, 200

    def update_course(self, course_id, user_id, data):
        course, status_code = self.get_course_details(course_id, user_id)
        if status_code != 200:
            return {"message": course.get("message", "Error")}, status_code
        if 'title' in data and not data['title']:
            return {"message": "Title cannot be empty."}, 400
        updated_course = self.course_repo.update(course_id, data)
        return {"message": "Course updated successfully"}, 200

    def delete_course(self, course_id, user_id):
        course, status_code = self.get_course_details(course_id, user_id)
        if status_code != 200:
            return {"message": course.get("message", "Error")}, status_code
        self.course_repo.delete(course_id)
        return {"message": "Course deleted successfully"}, 200

    def get_available_courses(self, student_id):
        all_courses = self.course_repo.get_all_public_courses()
        enrolled_courses = self.course_repo.get_student_enrolled_courses(student_id)
        enrolled_ids = {c.id for c in enrolled_courses}
        return [c for c in all_courses if c.id not in enrolled_ids]

    def get_enrolled_courses(self, student_id):
        return self.course_repo.get_student_enrolled_courses(student_id)

    def enroll_student(self, student_id, course_id):
        course = self.course_repo.get_by_id(course_id)
        if not course:
            return {"message": "Course not found."}, 404
        if self.course_repo.is_student_enrolled(student_id, course_id):
            return {"message": "Already enrolled or requested."}, 409
        enrollment = self.course_repo.enroll_student_in_course(student_id, course_id, is_public=course.is_public)
        if not enrollment:
            return {"message": "Failed to enroll. Possibly already requested."}, 409
        if course.is_public:
            return {"message": "Enrolled successfully."}, 200
        return {"message": "Enrollment request submitted. Waiting for approval."}, 202

    def unenroll_student(self, student_id, course_id):
        enrollment = self.course_repo.get_enrollment(student_id, course_id)
        if not enrollment:
            return {"message": "You are not enrolled in this course."}, 404
        self.course_repo.unenroll_student_from_course(enrollment)
        return {"message": "You have left the course successfully."}, 200

    # Phương thức mới: Lấy danh sách yêu cầu đăng ký pending
    def get_pending_enrollments(self, teacher_id, course_id):
        course = self.course_repo.get_by_id(course_id)
        if not course or course.teacher_id != teacher_id:
            return {"message": "Forbidden or course not found"}, 403
        enrollments = self.course_repo.get_pending_enrollments(course_id)
        return [{
            "id": e.id,
            "student_id": e.student_id,
            "status": e.status,
            "created_at": e.enrolled_at.strftime("%Y-%m-%d %H:%M:%S")
        } for e in enrollments], 200

    # Phương thức mới: Duyệt/từ chối yêu cầu đăng ký
    def handle_enrollment(self, teacher_id, enrollment_id, approve=True):
        enrollment = self.course_repo.update_enrollment_status(enrollment_id, "active" if approve else "rejected")
        if not enrollment:
            return {"message": "Enrollment not found"}, 404
        course = self.course_repo.get_by_id(enrollment.course_id)
        if course.teacher_id != teacher_id:
            return {"message": "Forbidden"}, 403
        return {"message": f"Enrollment {'approved' if approve else 'rejected'}"}, 200