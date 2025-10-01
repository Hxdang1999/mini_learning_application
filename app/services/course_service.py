# app/services/course_service.py
from app.repositories.course_repository import CourseRepository
from app.repositories.auth_repository import AuthRepository

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
    
    # THÊM MỚI/CẬP NHẬT: Chi tiết khóa học
    def get_course_details(self, course_id, user_id):
        course = self.course_repo.get_by_id(course_id)
        if not course:
            return None, 404
        # Kiểm tra quyền sở hữu
        if course.teacher_id != user_id:
            return None, 403
        return course, 200

    # THÊM MỚI/CẬP NHẬT: Cập nhật khóa học
    def update_course(self, course_id, user_id, data):
        course, status_code = self.get_course_details(course_id, user_id)
        
        if status_code == 404:
            return {"message": "Course not found."}, 404
        if status_code == 403:
            return {"message": "Forbidden. You do not own this course."}, 403
        
        # Đảm bảo title không rỗng
        if 'title' in data and not data['title']:
            return {"message": "Title cannot be empty."}, 400

        updated_course = self.course_repo.update(course_id, data)
        return {"message": "Course updated successfully"}, 200

    # THÊM MỚI/CẬP NHẬT: Xóa khóa học
    def delete_course(self, course_id, user_id):
        course, status_code = self.get_course_details(course_id, user_id)
        
        if status_code == 404:
            return {"message": "Course not found."}, 404
        if status_code == 403:
            return {"message": "Forbidden. You do not own this course."}, 403
        
        # Thực hiện xóa
        self.course_repo.delete(course_id)
        return {"message": "Course deleted successfully"}, 200