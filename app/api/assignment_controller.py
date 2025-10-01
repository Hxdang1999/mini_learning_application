# app/api/assignment_controller.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.assignment_service import AssignmentService

assignment_bp = Blueprint('assignment_bp', __name__, url_prefix='/api/assignments')
assignment_service = AssignmentService()

@assignment_bp.route('/<int:course_id>', methods=['POST'])
@jwt_required()
def create_assignment(course_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'teacher':
        return jsonify({"message": "Only teachers can create assignments"}), 403
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    deadline = data.get('deadline')  # Format: YYYY-MM-DDTHH:MM
    max_score = data.get('max_score', 100.0)
    response, status = assignment_service.create_assignment(
        current_user['id'], course_id, title, description, deadline, max_score
    )
    return jsonify(response), status

@assignment_bp.route('/<int:course_id>', methods=['GET'])
@jwt_required()
def get_assignments(course_id):
    current_user = get_jwt_identity()
    assignments, status = assignment_service.get_assignments(
        current_user['id'], course_id, current_user['role']
    )
    return jsonify({"assignments": assignments}), status

@assignment_bp.route('/<int:assignment_id>', methods=['PUT'])
@jwt_required()
def update_assignment(assignment_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'teacher':
        return jsonify({"message": "Only teachers can update assignments"}), 403
    data = request.get_json()
    response, status = assignment_service.update_assignment(current_user['id'], assignment_id, data)
    return jsonify(response), status

@assignment_bp.route('/<int:assignment_id>', methods=['DELETE'])
@jwt_required()
def delete_assignment(assignment_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'teacher':
        return jsonify({"message": "Only teachers can delete assignments"}), 403
    response, status = assignment_service.delete_assignment(current_user['id'], assignment_id)
    return jsonify(response), status

@assignment_bp.route('/<int:assignment_id>/submit', methods=['POST'])
@jwt_required()
def submit_assignment(assignment_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'student':
        return jsonify({"message": "Only students can submit assignments"}), 403
    data = request.get_json()
    content = data.get('content')
    response, status = assignment_service.submit_assignment(current_user['id'], assignment_id, content)
    return jsonify(response), status

@assignment_bp.route('/<int:assignment_id>/submissions', methods=['GET'])
@jwt_required()
def get_submissions(assignment_id):
    current_user = get_jwt_identity()
    submissions, status = assignment_service.get_submissions(
        current_user['id'], assignment_id, current_user['role']
    )
    return jsonify({"submissions": submissions}), status

@assignment_bp.route('/submissions/<int:submission_id>/grade', methods=['PUT'])
@jwt_required()
def grade_submission(submission_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'teacher':
        return jsonify({"message": "Only teachers can grade submissions"}), 403
    data = request.get_json()
    score = data.get('score')
    if score is None:
        return jsonify({"message": "Score is required"}), 400
    response, status = assignment_service.grade_submission(current_user['id'], submission_id, score)
    return jsonify(response), status

@assignment_bp.route('/<int:assignment_id>/stats', methods=['GET'])
@jwt_required()
def get_assignment_stats(assignment_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'teacher':
        return jsonify({"message": "Only teachers can view assignment stats"}), 403
    stats, status = assignment_service.get_assignment_stats(current_user['id'], assignment_id)
    return jsonify(stats), status