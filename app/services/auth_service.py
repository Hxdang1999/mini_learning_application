# app/services/auth_service.py
from app.repositories.auth_repository import AuthRepository
from flask_jwt_extended import create_access_token

class AuthService:
    def __init__(self):
        self.auth_repo = AuthRepository()

    def register_user(self, username, password, role):
        if not username or not password:
            return {"message": "Username and password are required"}, 400
        if self.auth_repo.get_user_by_username(username):
            return {"message": "User already exists"}, 409
        
        new_user = self.auth_repo.create_user(username, password, role)
        return {"message": "User created successfully"}, 201

    def login_user(self, username, password):
        user = self.auth_repo.get_user_by_username(username)
        
        if user and user.check_password(password):
            access_token = create_access_token(identity={'id': user.id, 'role': user.role})
            return {"access_token": access_token, "role": user.role, "username": user.username}, 200
        
        return {"message": "Invalid credentials"}, 401