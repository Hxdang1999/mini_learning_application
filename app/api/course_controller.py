from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.course_service import CourseService

course_bp = Blueprint('course', __name__, url_prefix='/api/courses')
course_service = CourseService()

@course_bp.route('/', methods=['POST'])
@jwt_required()
def create_course():
    # Lấy thông tin người dùng từ token JWT
    current_user_info = get_jwt_identity()
    user_id = current_user_info['id']
    user_role = current_user_info['role']

    # Kiểm tra vai trò của người dùng
    if user_role != 'teacher':
        return jsonify({"message": "Forbidden. Only teachers can create courses."}), 403

    data = request.get_json()
    title = data.get('title')
    is_public = data.get('is_public', False)
    
    response, status_code = course_service.create_course(user_id, title, is_public)
    return jsonify(response), status_code