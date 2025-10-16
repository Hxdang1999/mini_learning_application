# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os
from werkzeug.middleware.proxy_fix import ProxyFix

# Khởi tạo các extension
db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    # Cấu hình ứng dụng
    app.config['SECRET_KEY'] = 'your_secret_key'
    app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
    # Sử dụng đường dẫn tuyệt đối cho database
    base_dir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(base_dir, "instance", "dl_platform.db")}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_IDENTITY_CLAIM'] = 'user_info'
    
    # Khởi tạo các extension với app
    db.init_app(app)
    jwt.init_app(app)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    # Import models
    from .models import user, course, enrollment, material, assignment
    
    # Tạo thư mục instance nếu chưa tồn tại
    instance_dir = os.path.join(base_dir, 'instance')
    if not os.path.exists(instance_dir):
        os.makedirs(instance_dir)
    
    # Tạo tất cả bảng trong database
    with app.app_context():
        db.create_all()
    
    # Đăng ký blueprints
    from .api import auth_controller, course_controller, frontend_controller, material_controller, assignment_controller, admin_controller  # Thêm admin_controller
    app.register_blueprint(auth_controller.auth_bp)
    app.register_blueprint(course_controller.course_bp)
    app.register_blueprint(frontend_controller.frontend_bp)
    app.register_blueprint(material_controller.material_bp)
    app.register_blueprint(assignment_controller.assignment_bp)
    app.register_blueprint(admin_controller.admin_bp)  # Đăng ký blueprint mới
    
    return app