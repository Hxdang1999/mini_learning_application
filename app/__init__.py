from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from datetime import timedelta

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your_secret_key'
    app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dl_platform.db'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    
    app.config['JWT_IDENTITY_CLAIM'] = 'user_info'
    db.init_app(app)
    jwt.init_app(app)
    
    # --- IMPORT TẤT CẢ CÁC MODELS CẦN THIẾT ---
    # Sau khi sửa user.py, dòng này sẽ hoạt động
    from .models import user, course, enrollment, material, assignment 
    
    with app.app_context():
        db.create_all()
        
    # --- ĐĂNG KÝ BLUEPRINTS ---
    from .api.auth_controller import auth_bp
    from .api.course_controller import course_bp
    from .api.frontend_controller import frontend_bp # <-- DÒNG QUAN TRỌNG

    app.register_blueprint(auth_bp)
    app.register_blueprint(course_bp)
    app.register_blueprint(frontend_bp)   # <-- Đăng ký Frontend để chạy được /
    
 
    
    return app