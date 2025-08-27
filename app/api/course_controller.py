from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.course_service import CourseService

course_bp = Blueprint('course', __name__, url_prefix='/api/courses')
course_service = CourseService()

@course_bp.route('/', methods=['POST'])
@jwt_required()
def create_course():
    user_id = get_jwt_identity()
    # Kiểm tra quyền của người dùng (giảng viên)
    # ... logic để kiểm tra vai trò ...
    
    data = request.get_json()
    title = data.get('title')
    is_public = data.get('is_public', False)
    
    response, status_code = course_service.create_course(user_id, title, is_public)
    return jsonify(response), status_code

# ... Thêm các routes khác cho chỉnh sửa, xóa, lấy danh sách khóa học ...