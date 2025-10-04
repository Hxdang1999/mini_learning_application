# app/api/auth_controller.py
from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService
from flask_jwt_extended import jwt_required, get_jwt_identity

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api/auth')
auth_service = AuthService()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'student')
    code = data.get('code')  # Mới
    response, status_code = auth_service.register_user(username, password, role, code)
    return jsonify(response), status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    response, status_code = auth_service.login_user(username, password)
    return jsonify(response), status_code

@auth_bp.route('/profile', methods=['GET'])  # Thêm route mới
@jwt_required()
def get_profile():
    current_user = get_jwt_identity()
    response, status_code = auth_service.get_user_profile(current_user['id'])
    return jsonify(response), status_code

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user = get_jwt_identity()
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    response, status = auth_service.change_password(current_user['id'], old_password, new_password)
    return jsonify(response), status


