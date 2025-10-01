from app.models.course import Course
from app import db

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