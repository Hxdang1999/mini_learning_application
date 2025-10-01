# app/repositories/auth_repository.py
from app import db
from app.models.user import User

class AuthRepository:
    def get_user_by_username(self, username):
        return User.query.filter_by(username=username).first()

    def create_user(self, username, password, role):
        new_user = User(username=username, role=role)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        return new_user
        
    # Thêm phương thức mới này vào đây
    def get_user_by_id(self, user_id):
        return User.query.get(user_id)