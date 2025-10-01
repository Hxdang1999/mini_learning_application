# app/__init__.py
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
    
    # Import tất cả các models cần thiết
    from .models import user, course, enrollment, material, assignment 
    
    with app.app_context():
        db.create_all()
        
    # Đăng ký blueprints SAU KHI db được khởi tạo
    from .api.auth_controller import auth_bp
    from .api.course_controller import course_bp
    from .api.frontend_controller import frontend_bp
    from .api.material_controller import material_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(course_bp)
    app.register_blueprint(frontend_bp)
    app.register_blueprint(material_bp)
    
    return app