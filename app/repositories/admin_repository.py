# app/repositories/admin_repository.py
from app import db
from app.models.user import User
import random
import string

class AdminRepository:
    def get_admin_by_id(self, admin_id):
        return User.query.filter_by(id=admin_id, role='admin').first()

    def get_sub_admins(self):
        return User.query.filter_by(role='admin', is_root=False).all()

    def create_sub_admin(self, username, password, max_users):
        sub_admin = User(username=username, role='admin', is_root=False, max_users=max_users)
        sub_admin.set_password(password)
        sub_admin.generate_registration_code()
        db.session.add(sub_admin)
        db.session.commit()
        return sub_admin

    def delete_sub_admin(self, sub_admin_id):
        sub_admin = self.get_admin_by_id(sub_admin_id)
        if sub_admin and not sub_admin.is_root:
            db.session.delete(sub_admin)
            db.session.commit()
            return True
        return False

    def update_max_users(self, sub_admin_id, max_users):
        sub_admin = self.get_admin_by_id(sub_admin_id)
        if sub_admin:
            sub_admin.max_users = max_users
            db.session.commit()
            return sub_admin
        return None

    def update_registration_code(self, admin_id, new_code):
        admin = self.get_admin_by_id(admin_id)
        if admin:
            admin.registration_code = new_code
            db.session.commit()
            return admin
        return None

    def get_users_by_manager(self, manager_id):
        return User.query.filter_by(manager_id=manager_id).all()

    def get_all_users(self):
        return User.query.filter(User.role.in_(['student', 'teacher'])).all()

    def reset_user_password(self, user_id):
        user = User.query.get(user_id)
        if user:
            new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
            user.set_password(new_password)
            db.session.commit()
            return new_password
        return None

    def lock_user(self, user_id, lock=True):
        user = User.query.get(user_id)
        if user:
            user.is_locked = lock
            db.session.commit()
            return user
        return None

    def count_active_users(self, manager_id):
        return User.query.filter_by(manager_id=manager_id, is_locked=False).count()

    def get_pending_users(self, manager_id=None):  # Đảm bảo có phương thức này
        query = User.query.filter_by(status='pending')
        if manager_id:
            query = query.filter_by(manager_id=manager_id)
        return query.all()