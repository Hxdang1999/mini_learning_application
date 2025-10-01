# app/repositories/material_repository.py
from app import db
from app.models.material import Material

class MaterialRepository:
    def create(self, title, content, course_id):
        new_material = Material(title=title, content=content, course_id=course_id)
        db.session.add(new_material)
        db.session.commit()
        return new_material

    def get_by_id(self, material_id):
        return Material.query.get(material_id)

    def get_all_by_course(self, course_id):
        return Material.query.filter_by(course_id=course_id).all()

    def update(self, material_id, data):
        material = self.get_by_id(material_id)
        if material:
            for key, value in data.items():
                setattr(material, key, value)
            db.session.commit()
            return material
        return None

    def delete(self, material_id):
        material = self.get_by_id(material_id)
        if material:
            db.session.delete(material)
            db.session.commit()
            return True
        return False