from app.models.user import User
from app import db

class AuthRepository:
    def create_user(self, username, password, role):
        new_user = User(username=username, role=role)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        return new_user

    def get_user_by_username(self, username):
        return User.query.filter_by(username=username).first()