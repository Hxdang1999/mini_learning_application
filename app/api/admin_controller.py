from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.admin_service import AdminService
from openpyxl import Workbook
from flask import send_file
import io
from datetime import timedelta

admin_bp = Blueprint('admin_bp', __name__, url_prefix='/api/admin')
admin_service = AdminService()

@admin_bp.route('/sub-admins', methods=['POST'])
@jwt_required()
def create_sub_admin():
    current_user = get_jwt_identity()
    if current_user['role'] != 'admin' or not current_user.get('is_root', False):
        return jsonify({"message": "Only root admin"}), 403
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    max_users = data.get('max_users', 0)
    response, status = admin_service.create_sub_admin(current_user['id'], username, password, max_users)
    return jsonify(response), status

@admin_bp.route('/sub-admins', methods=['GET'])
@jwt_required()
def get_sub_admins():
    current_user = get_jwt_identity()
    if current_user['role'] != 'admin' or not current_user.get('is_root', False):
        return jsonify({"message": "Only root admin can view sub-admins"}), 403
    sub_admins = admin_service.admin_repo.get_sub_admins()
    return jsonify({
        "sub_admins": [{
            "id": admin.id,
            "username": admin.username,
            "registration_code": admin.registration_code,
            "max_users": admin.max_users
        } for admin in sub_admins]
    }), 200

@admin_bp.route('/sub-admins/<int:sub_id>', methods=['DELETE'])
@jwt_required()
def delete_sub_admin(sub_id):
    current_user = get_jwt_identity()
    response, status = admin_service.delete_sub_admin(current_user['id'], sub_id)
    return jsonify(response), status

@admin_bp.route('/sub-admins/<int:sub_id>/max-users', methods=['PUT'])
@jwt_required()
def update_max_users(sub_id):
    current_user = get_jwt_identity()
    data = request.get_json()
    max_users = data.get('max_users')
    response, status = admin_service.update_max_users(current_user['id'], sub_id, max_users)
    return jsonify(response), status

@admin_bp.route('/sub-admins/<int:sub_id>/reset-password', methods=['PUT'])  # Mới
@jwt_required()
def reset_sub_admin_password(sub_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'admin' or not current_user.get('is_root', False):
        return jsonify({"message": "Only root admin can reset sub-admin password"}), 403
    response, status = admin_service.reset_sub_admin_password(current_user['id'], sub_id)
    return jsonify(response), status

@admin_bp.route('/registration-code', methods=['PUT'])
@jwt_required()
def update_registration_code():
    current_user = get_jwt_identity()
    if current_user['role'] != 'admin':
        return jsonify({"message": "Only admins can update code"}), 403
    data = request.get_json()
    new_code = data.get('new_code')
    response, status = admin_service.update_registration_code(current_user['id'], new_code)
    return jsonify(response), status

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user = get_jwt_identity()
    if current_user['role'] != 'admin':
        return jsonify({"message": "Only admins"}), 403
    response, status = admin_service.get_users(current_user['id'])
    return jsonify(response), status

@admin_bp.route('/users/<int:user_id>/reset-password', methods=['PUT'])
@jwt_required()
def reset_user_password(user_id):
    current_user = get_jwt_identity()
    response, status = admin_service.reset_user_password(current_user['id'], user_id)
    return jsonify(response), status

@admin_bp.route('/users/<int:user_id>/lock', methods=['PUT'])
@jwt_required()
def lock_user(user_id):
    current_user = get_jwt_identity()
    data = request.get_json()
    lock = data.get('lock', True)
    response, status = admin_service.lock_user(current_user['id'], user_id, lock)
    return jsonify(response), status

@admin_bp.route('/pending-users', methods=['GET'])  # Mới
@jwt_required()
def get_pending_users():
    current_user = get_jwt_identity()
    if current_user['role'] != 'admin':
        return jsonify({"message": "Only admins can view pending users"}), 403
    response, status = admin_service.get_pending_users(current_user['id'])
    return jsonify(response), status

@admin_bp.route('/users/<int:user_id>/approve', methods=['PUT'])  # Mới
@jwt_required()
def approve_user(user_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'admin':
        return jsonify({"message": "Only admins can approve users"}), 403
    data = request.get_json()
    approve = data.get('approve', True)
    response, status = admin_service.approve_user(current_user['id'], user_id, approve)
    return jsonify(response), status

@admin_bp.route('/export-users', methods=['GET'])
@jwt_required()
def export_users():
    """
    Xuất danh sách user ra file Excel (có lọc admin phụ, trạng thái khóa, thời gian tạo).
    """
    current_user = get_jwt_identity()
    if current_user['role'] != 'admin':
        return jsonify({"message": "Only admins can export users"}), 403

    admin_id = request.args.get('admin_id', 'all')

    users_data, status = admin_service.get_users(current_user['id'])
    if status != 200:
        return jsonify(users_data), status

    # Chuẩn hóa dữ liệu user
    users_list = []
    if isinstance(users_data, dict):
        if "users" in users_data:
            users_list = users_data["users"]
        else:
            for _, ulist in users_data.items():
                if isinstance(ulist, list):
                    users_list.extend(ulist)
    elif isinstance(users_data, list):
        users_list = users_data

    if not users_list:
        return jsonify({"message": "No users found"}), 404

    # Tạo workbook Excel
    wb = Workbook()
    ws = wb.active
    ws.title = "Users List"

    # Tiêu đề các cột
    ws.append(["ID", "Username", "Role", "Status", "Locked", "Sub Admin", "Created At"])

    for u in users_list:
        created_at = ""
        if u.get("created_at"):
            # Nếu là chuỗi thì parse, nếu là datetime thì cộng giờ VN
            dt = u["created_at"]
            if isinstance(dt, str):
                created_at = dt
            else:
                created_at = (dt + timedelta(hours=7)).strftime("%Y-%m-%d %H:%M:%S")

        ws.append([
            u.get("id"),
            u.get("username"),
            u.get("role"),
            u.get("status", "active"),
            "T" if u.get("is_locked") else "F",
            u.get("manager", "—"),
            created_at
        ])

    # Xuất ra file Excel
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name="users_export.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )