# app/repositories/auth_repository.py
from app import db
from app.models.user import User

class AuthRepository:
    def get_user_by_username(self, username):
        return User.query.filter_by(username=username).first()

    def get_user_by_id(self, user_id):
        return User.query.get(user_id)

    def get_admin_by_code(self, code):
        return User.query.filter_by(registration_code=code, role='admin').first()

    def create_user(self, username, password, role):
        user = User(username=username, role=role)
        user.set_password(password)
        user.generate_registration_code()
        db.session.add(user)
        db.session.commit()
        return user

    def approve_user(self, user_id, approve=True):  # Đảm bảo có phương thức này
        user = User.query.get(user_id)
        if user:
            user.status = 'active' if approve else 'rejected'
            db.session.commit()
            return user
        return None