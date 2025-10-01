# app/api/material_controller.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.material_service import MaterialService

material_bp = Blueprint('material_bp', __name__, url_prefix='/api/materials')
material_service = MaterialService()

@material_bp.route('/<int:course_id>', methods=['POST'])
@jwt_required()
def create_material(course_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'teacher':
        return jsonify({"message": "Only teachers"}), 403
    data = request.get_json()
    response, status = material_service.create_material(current_user['id'], course_id, data.get('title'), data.get('content'))
    return jsonify(response), status

@material_bp.route('/<int:course_id>', methods=['GET'])
@jwt_required()
def get_materials(course_id):
    current_user = get_jwt_identity()
    materials, status = material_service.get_materials_by_course(course_id, current_user['id'], current_user['role'])
    if status == 200:
        return jsonify({"materials": materials}), 200
    return jsonify(materials), status

@material_bp.route('/<int:material_id>', methods=['PUT'])
@jwt_required()
def update_material(material_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'teacher':
        return jsonify({"message": "Only teachers"}), 403
    data = request.get_json()
    response, status = material_service.update_material(current_user['id'], material_id, data)
    return jsonify(response), status

@material_bp.route('/<int:material_id>', methods=['DELETE'])
@jwt_required()
def delete_material(material_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'teacher':
        return jsonify({"message": "Only teachers"}), 403
    response, status = material_service.delete_material(current_user['id'], material_id)
    return jsonify(response), status