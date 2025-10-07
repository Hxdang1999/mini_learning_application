# app/services/admin_service.py
from app import db
from app.repositories.admin_repository import AdminRepository
from app.repositories.auth_repository import AuthRepository
from app.models.user import User
from app.services.auth_service import AuthService  # Thêm import

class AdminService:
    def __init__(self):
        self.admin_repo = AdminRepository()
        self.auth_repo = AuthRepository()
        self.auth_service = AuthService()  # Thêm instance AuthService

    def create_sub_admin(self, root_id, username, password, max_users):
        root = self.admin_repo.get_admin_by_id(root_id)
        if not root or not root.is_root:
            return {"message": "Only root admin can create sub admins"}, 403
        sub_admin = self.admin_repo.create_sub_admin(username, password, max_users)
        if sub_admin:
            return {"id": sub_admin.id, "username": sub_admin.username, "message": "Sub admin created"}, 201
        return {"message": "Failed to create sub admin"}, 500

    def delete_sub_admin(self, root_id, sub_admin_id):
        root = self.admin_repo.get_admin_by_id(root_id)
        if not root or not root.is_root:
            return {"message": "Only root admin can delete sub admins"}, 403
        if self.admin_repo.delete_sub_admin(sub_admin_id):
            return {"message": "Sub admin deleted"}, 200
        return {"message": "Sub admin not found"}, 404

    def update_max_users(self, root_id, sub_admin_id, max_users):
        root = self.admin_repo.get_admin_by_id(root_id)
        if not root or not root.is_root:
            return {"message": "Only root admin can update max users"}, 403
        updated = self.admin_repo.update_max_users(sub_admin_id, max_users)
        if updated:
            return {"message": "Max users updated"}, 200
        return {"message": "Sub admin not found"}, 404

    def update_registration_code(self, admin_id, new_code):
        if len(new_code) != 6:
            return {"message": "Code must be 6 characters"}, 400
        updated = self.admin_repo.update_registration_code(admin_id, new_code)
        if updated:
            return {"message": "Registration code updated"}, 200
        return {"message": "Admin not found"}, 404

    def get_users(self, admin_id):
        admin = self.admin_repo.get_admin_by_id(admin_id)
        if admin.is_root:
            all_users = self.admin_repo.get_all_users()
            grouped = {}
            for user in all_users:
                manager = self.auth_repo.get_user_by_id(user.manager_id) if user.manager_id else None
                manager_name = manager.username if manager else "Root"
                grouped.setdefault(manager_name, []).append({
                    "id": user.id,
                    "username": user.username,
                    "role": user.role,
                    "status": user.status,
                    "is_locked": user.is_locked,
                    "manager": manager_name,  
                    "created_at": user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else ""
                })
            return grouped, 200

        else:
            users = self.admin_repo.get_users_by_manager(admin_id)
            remaining = admin.max_users - self.admin_repo.count_active_users(admin_id)
            return {
                "users": [{
                    "id": u.id,
                    "username": u.username,
                    "role": u.role,
                    "status": u.status,
                    "is_locked": u.is_locked,
                    "manager": admin.username,
                    "created_at": u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else ""
                } for u in users],
                "remaining_slots": remaining
            }, 200

    def reset_user_password(self, admin_id, user_id):
        admin = self.admin_repo.get_admin_by_id(admin_id)
        user = self.auth_repo.get_user_by_id(user_id)
        if not admin or not user:
            return {"message": "Not found"}, 404
        if admin.is_root or user.manager_id == admin_id:
            new_pass = self.admin_repo.reset_user_password(user_id)
            if new_pass:
                return {"message": "Password reset", "new_password": new_pass}, 200
            return {"message": "Error"}, 500
        return {"message": "No permission"}, 403

    def reset_sub_admin_password(self, root_id, sub_admin_id):
        root = self.admin_repo.get_admin_by_id(root_id)
        sub_admin = self.admin_repo.get_admin_by_id(sub_admin_id)
        if not root or not root.is_root or not sub_admin:
            return {"message": "No permission or not found"}, 403
        new_pass = self.admin_repo.reset_user_password(sub_admin_id)
        if new_pass:
            return {"message": "Password reset for sub-admin", "new_password": new_pass}, 200
        return {"message": "Error"}, 500

    def get_pending_users(self, admin_id):
        admin = self.admin_repo.get_admin_by_id(admin_id)
        if not admin:
            return {"message": "Admin not found"}, 404
        if admin.is_root:
            pending = self.admin_repo.get_pending_users()
        else:
            pending = self.admin_repo.get_pending_users(admin_id)
        return {"pending_users": [{"id": u.id, "username": u.username, "role": u.role} for u in pending]}, 200

    def approve_user(self, admin_id, user_id, approve): 
        return self.auth_service.approve_user(admin_id, user_id, approve)
    
    def lock_user(self, admin_id, user_id, lock):
        admin = self.admin_repo.get_admin_by_id(admin_id)
        user = self.auth_repo.get_user_by_id(user_id)

        if not admin or not user:
            return {"message": "Admin hoặc User không tồn tại"}, 404

        if admin.is_root or user.manager_id == admin_id:
            updated = self.admin_repo.update_lock_status(user_id, lock)
            if updated:
                msg = "Đã khóa user" if lock else "Đã mở khóa user"
                return {"message": msg}, 200
            return {"message": "Không thể cập nhật trạng thái khóa"}, 500

        return {"message": "Không có quyền khóa user này"}, 403
