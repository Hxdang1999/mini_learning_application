# app/api/course_controller.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.course_service import CourseService

course_bp = Blueprint('course_bp', __name__, url_prefix='/api/courses')
course_service = CourseService()

@course_bp.route('/', methods=['POST'])
@jwt_required()
def create_course():
    current_user_info = get_jwt_identity()
    user_id = current_user_info['id']
    user_role = current_user_info['role']
    
    if user_role != 'teacher':
        return jsonify({"message": "Forbidden. Only teachers can create courses."}), 403

    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    is_public = data.get('is_public', False)
    
    response, status_code = course_service.create_course(user_id, title, description, is_public)
    return jsonify(response), status_code

@course_bp.route('/teacher', methods=['GET'])
@jwt_required()
def get_teacher_courses():
    try:
        current_user_info = get_jwt_identity()
        user_id = current_user_info['id']
        
        courses = course_service.get_teacher_courses(user_id)
        # CẬP NHẬT: Thêm và format created_at
        courses_list = [{
            "id": c.id,
            "title": c.title,
            "description": c.description, 
            "is_public": c.is_public,
            "created_at": c.created_at.strftime('%Y-%m-%d %H:%M:%S') if c.created_at else 'N/A' 
        } for c in courses]
        
        return jsonify({"courses": courses_list}), 200
        
    except Exception as e:
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

# THÊM MỚI: API GET chi tiết khóa học
@course_bp.route('/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course(course_id):
    current_user_info = get_jwt_identity()
    user_id = current_user_info['id']
    
    course, status_code = course_service.get_course_details(course_id, user_id)
    
    if status_code != 200:
        return jsonify({"message": course["message"]}), status_code # course là dict khi có lỗi
    
    # Format the course data for frontend
    course_data = {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "is_public": course.is_public,
        "created_at": course.created_at.strftime('%Y-%m-%d %H:%M:%S') if course.created_at else 'N/A'
    }
    return jsonify(course_data), 200

# THÊM MỚI: API PUT cập nhật khóa học
@course_bp.route('/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    current_user_info = get_jwt_identity()
    user_id = current_user_info['id']
    data = request.get_json()
    
    response, status_code = course_service.update_course(course_id, user_id, data)
    return jsonify(response), status_code

# THÊM MỚI: API DELETE xóa khóa học
@course_bp.route('/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    current_user_info = get_jwt_identity()
    user_id = current_user_info['id']
    
    response, status_code = course_service.delete_course(course_id, user_id)
    return jsonify(response), status_code