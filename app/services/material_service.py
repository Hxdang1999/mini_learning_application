# app/services/material_service.py
from app.repositories.material_repository import MaterialRepository
from app.repositories.course_repository import CourseRepository
from app.repositories.auth_repository import AuthRepository

class MaterialService:
    def __init__(self):
        self.material_repo = MaterialRepository()
        self.course_repo = CourseRepository()
        self.auth_repo = AuthRepository()

    def create_material(self, user_id, course_id, title, content):
        course = self.course_repo.get_by_id(course_id)
        if not course or course.teacher_id != user_id:
            return {"message": "Forbidden or course not found"}, 403
        if not title:
            return {"message": "Title is required"}, 400
        material = self.material_repo.create(title, content, course_id)
        return {"message": "Material created", "material_id": material.id}, 201

    def get_materials_by_course(self, course_id, user_id, user_role):
        course = self.course_repo.get_by_id(course_id)
        if not course:
            return {"message": "Course not found"}, 404
        # Kiểm tra quyền: Giảng viên sở hữu hoặc sinh viên đã enroll
        if user_role == 'teacher' and course.teacher_id != user_id:
            return {"message": "Forbidden"}, 403
        elif user_role == 'student' and not self.course_repo.is_student_enrolled(user_id, course_id):
            return {"message": "Not enrolled"}, 403
        materials = self.material_repo.get_all_by_course(course_id)
        return [{"id": m.id, "title": m.title, "content": m.content, "created_at": m.created_at.strftime('%Y-%m-%d %H:%M:%S')} for m in materials], 200

    def update_material(self, user_id, material_id, data):
        material = self.material_repo.get_by_id(material_id)
        if not material or material.course.teacher_id != user_id:
            return {"message": "Forbidden or material not found"}, 403
        updated = self.material_repo.update(material_id, data)
        return {"message": "Material updated"}, 200

    def delete_material(self, user_id, material_id):
        material = self.material_repo.get_by_id(material_id)
        if not material or material.course.teacher_id != user_id:
            return {"message": "Forbidden or material not found"}, 403
        self.material_repo.delete(material_id)
        return {"message": "Material deleted"}, 200