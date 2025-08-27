from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
import os

db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    # Cấu hình cơ sở dữ liệu và khóa bí mật JWT
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///online_learning.db'
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your_secret_key_here')
    
    # Khởi tạo các tiện ích mở rộng
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # Đăng ký các Blueprint
    from .api.auth_controller import auth_bp
    from .api.frontend_controller import frontend_bp # Import Blueprint mới
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(frontend_bp) # Đăng ký Blueprint frontend

    # Tạo các bảng CSDL
    with app.app_context():
        from .models.user import User
        db.create_all()
        
    return app