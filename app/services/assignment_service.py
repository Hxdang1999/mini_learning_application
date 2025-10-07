# app/services/assignment_service.py
from app.repositories.assignment_repository import AssignmentRepository
from app.repositories.course_repository import CourseRepository
from app.repositories.auth_repository import AuthRepository
from datetime import datetime

class AssignmentService:
    def __init__(self):
        self.assignment_repo = AssignmentRepository()
        self.course_repo = CourseRepository()
        self.auth_repo = AuthRepository()

    def create_assignment(self, user_id, course_id, title, description, deadline, max_score):
        course = self.course_repo.get_by_id(course_id)
        if not course or course.teacher_id != user_id:
            return {"message": "Forbidden or course not found"}, 403
        if not title:
            return {"message": "Title is required"}, 400
        try:
            deadline_date = datetime.strptime(deadline, '%Y-%m-%dT%H:%M') if deadline else None
        except ValueError:
            return {"message": "Invalid deadline format"}, 400
        assignment = self.assignment_repo.create(course_id, title, description, deadline_date, max_score)
        return {"message": "Assignment created successfully", "assignment_id": assignment.id}, 201

    def get_assignments(self, user_id, course_id, user_role):
        course = self.course_repo.get_by_id(course_id)
        if not course:
            return {"message": "Course not found"}, 404
        if user_role == 'teacher' and course.teacher_id != user_id:
            return {"message": "Forbidden"}, 403
        if user_role == 'student':
            enrollment = self.course_repo.get_enrollment(user_id, course_id)
            if not enrollment or enrollment.status != 'active':
                return {"message": "Forbidden. You are not enrolled or not active."}, 403
        assignments = self.assignment_repo.get_by_course(course_id)
        return [{
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "deadline": a.deadline.strftime('%Y-%m-%d %H:%M') if a.deadline else None,
            "max_score": a.max_score,
            "created_at": a.created_at.strftime('%Y-%m-%d %H:%M')
        } for a in assignments], 200

    def update_assignment(self, user_id, assignment_id, data):
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            return {"message": "Assignment not found"}, 404
        course = self.course_repo.get_by_id(assignment.course_id)
        if course.teacher_id != user_id:
            return {"message": "Forbidden"}, 403
        if 'title' in data and not data['title']:
            return {"message": "Title cannot be empty"}, 400
        if 'deadline' in data and data['deadline']:
            try:
                data['deadline'] = datetime.strptime(data['deadline'], '%Y-%m-%dT%H:%M')
            except ValueError:
                return {"message": "Invalid deadline format"}, 400
        updated_assignment = self.assignment_repo.update(assignment_id, data)
        return {"message": "Assignment updated successfully"}, 200

    def delete_assignment(self, user_id, assignment_id):
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            return {"message": "Assignment not found"}, 404
        course = self.course_repo.get_by_id(assignment.course_id)
        if course.teacher_id != user_id:
            return {"message": "Forbidden"}, 403
        self.assignment_repo.delete(assignment_id)
        return {"message": "Assignment deleted successfully"}, 200

    def submit_assignment(self, student_id, assignment_id, content):
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            return {"message": "Assignment not found"}, 404

        enrollment = self.course_repo.get_enrollment(student_id, assignment.course_id)
        if not enrollment or enrollment.status != 'active':
            return {"message": "Forbidden. You are not enrolled or not active."}, 403

        # Kiểm tra deadline
        if assignment.deadline and datetime.utcnow() > assignment.deadline:
            return {"message": "Submission closed. Deadline passed."}, 403

        existing_submission = self.assignment_repo.get_submission(assignment_id, student_id)
        if existing_submission:
            # ✅ Cho phép nộp lại: cập nhật nội dung và thời gian nộp
            updated_submission = self.assignment_repo.update_submission_content(
                existing_submission.id,
                content,
                datetime.utcnow()
            )
            if not updated_submission:
                return {"message": "Failed to update existing submission"}, 500
            return {"message": "Resubmission successful. Your work has been updated."}, 200

        # ✅ Nếu chưa có bài nộp trước đó → tạo mới
        submission = self.assignment_repo.create_submission(assignment_id, student_id, content)
        if not submission:
            return {"message": "Failed to submit assignment"}, 500
        return {"message": "Assignment submitted successfully", "submission_id": submission.id}, 201


    def grade_submission(self, teacher_id, submission_id, score):
        submission = self.assignment_repo.get_submission_by_id(submission_id)
        if not submission:
          return {"message": "Submission not found"}, 404
        assignment = self.assignment_repo.get_by_id(submission.assignment_id)
        if not assignment:
         return {"message": "Assignment not found"}, 404
        course = self.course_repo.get_by_id(assignment.course_id)
        if course.teacher_id != teacher_id:
            return {"message": "Forbidden. You are not the teacher of this course."}, 403
        if score < 0 or score > assignment.max_score:
            return {"message": f"Score must be between 0 and {assignment.max_score}"}, 400
        updated_submission = self.assignment_repo.update_submission_score(submission_id, score)
        if not updated_submission:
            return {"message": "Failed to update submission score"}, 500
        return {"message": "Submission graded successfully"}, 200

    def get_submissions(self, user_id, assignment_id, user_role):
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            return {"message": "Assignment not found"}, 404
        course = self.course_repo.get_by_id(assignment.course_id)
        if user_role == 'teacher' and course.teacher_id != user_id:
            return {"message": "Forbidden"}, 403
        if user_role == 'student':
            enrollment = self.course_repo.get_enrollment(user_id, assignment.course_id)
            if not enrollment or enrollment.status != 'active':
                return {"message": "Forbidden. You are not enrolled or not active."}, 403
            submission = self.assignment_repo.get_submission(assignment_id, user_id)
            if not submission:
                return [], 200
            return [{
                "id": submission.id,
                "assignment_id": submission.assignment_id,
                "student_id": submission.student_id,
                "content": submission.content,
                "score": submission.score,
                "submitted_at": submission.submitted_at.strftime('%Y-%m-%d %H:%M')
            }], 200
        submissions = self.assignment_repo.get_submissions_by_assignment(assignment_id)
        return [{
            "id": s.id,
            "student_id": s.student_id,
            "student_username": self.auth_repo.get_user_by_id(s.student_id).username,
            "content": s.content,
            "score": s.score,
            "submitted_at": s.submitted_at.strftime('%Y-%m-%d %H:%M')
        } for s in submissions], 200

    def get_assignment_stats(self, teacher_id, assignment_id):
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            return {"message": "Assignment not found"}, 404
        course = self.course_repo.get_by_id(assignment.course_id)
        if course.teacher_id != teacher_id:
            return {"message": "Forbidden"}, 403
        stats = self.assignment_repo.get_assignment_stats(assignment_id)
        return stats, 200