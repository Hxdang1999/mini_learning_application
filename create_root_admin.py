# create_root_admin.py
from app import create_app, db
from app.models.user import User
import random
import string

def generate_random_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def create_root_admin():
    app = create_app()
    with app.app_context():
        existing_root = User.query.filter_by(role='admin', is_root=True).first()
        if existing_root:
            print("Admin gốc đã tồn tại!")
            return

        root_admin = User(
            username='admin',
            role='admin',
            is_root=True,
            registration_code=generate_random_code(),
            max_users=0,
            is_locked=False,
            status='active'
        )
        root_admin.set_password('admin')  # Thay bằng mật khẩu mong muốn
        db.session.add(root_admin)
        db.session.commit()
        print(f"Admin gốc tạo thành công! Username: root_admin, Registration Code: {root_admin.registration_code}")

if __name__ == '__main__':
    create_root_admin()