# app/services/auth_service.py
from app import db
from app.repositories.auth_repository import AuthRepository
from flask_jwt_extended import create_access_token
from app.models.user import User

class AuthService:
    def __init__(self):
        self.auth_repo = AuthRepository()

    def register_user(self, username, password, role, code=None):
        if self.auth_repo.get_user_by_username(username):
            return {"message": "Username already exists"}, 400
        
        if not code:
            return {"message": "Registration code required"}, 400
        
        admin = self.auth_repo.get_admin_by_code(code)
        if not admin:
            return {"message": "Invalid registration code"}, 400
        
        new_user = self.auth_repo.create_user(username, password, role)
        new_user.manager_id = admin.id
        new_user.status = 'active' if admin.is_root else 'pending'  # Đúng logic: pending cho mã admin phụ
        db.session.commit()
        return {"message": "User registered successfully"}, 201

    def login_user(self, username, password):
        user = self.auth_repo.get_user_by_username(username)
        if not user or not user.check_password(password) or user.is_locked or user.status != 'active':  # Thêm kiểm tra status
            return {"message": "Invalid credentials, account locked, or pending approval"}, 401
        access_token = create_access_token(identity={'id': user.id, 'role': user.role, 'is_root': user.is_root})
        return {"access_token": access_token, "role": user.role, "username": user.username}, 200

    def get_user_profile(self, user_id):
        user = self.auth_repo.get_user_by_id(user_id)
        if not user:
            return {"message": "User not found"}, 404
        return {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "is_root": user.is_root,
            "registration_code": user.registration_code,
            "status": user.status
        }, 200

    def change_password(self, user_id, old_password, new_password):
        user = self.auth_repo.get_user_by_id(user_id)
        if not user or not user.check_password(old_password):
            return {"message": "Invalid old password"}, 401
        user.set_password(new_password)
        db.session.commit()
        return {"message": "Password changed successfully"}, 200

    def approve_user(self, admin_id, user_id, approve):  # Đã có từ trước, đảm bảo giữ nguyên
        admin = User.query.filter_by(id=admin_id, role='admin').first()
        user = self.auth_repo.get_user_by_id(user_id)
        if not admin or not user:
            return {"message": "Not found"}, 404
        if admin.is_root or user.manager_id == admin_id:
            updated = self.auth_repo.approve_user(user_id, approve)
            if updated:
                return {"message": f"User {'approved' if approve else 'rejected'}"}, 200
            return {"message": "Error"}, 500
        return {"message": "No permission"}, 403