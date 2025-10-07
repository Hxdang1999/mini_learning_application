# app/repositories/assignment_repository.py
from app.models.assignment import Assignment, Submission
from app import db
from sqlalchemy.exc import IntegrityError

class AssignmentRepository:
    def create(self, course_id, title, description, deadline, max_score):
        assignment = Assignment(
            course_id=course_id,
            title=title,
            description=description,
            deadline=deadline,
            max_score=max_score
        )
        db.session.add(assignment)
        db.session.commit()
        return assignment

    def get_by_id(self, assignment_id):
        return Assignment.query.get(assignment_id)

    def get_by_course(self, course_id):
        return Assignment.query.filter_by(course_id=course_id).all()

    def update(self, assignment_id, data):
        assignment = self.get_by_id(assignment_id)
        if assignment:
            for key, value in data.items():
                setattr(assignment, key, value)
            db.session.commit()
            return assignment
        return None

    def delete(self, assignment_id):
        assignment = self.get_by_id(assignment_id)
        if assignment:
            db.session.delete(assignment)
            db.session.commit()
            return True
        return False

    def create_submission(self, assignment_id, student_id, content):
        submission = Submission(
            assignment_id=assignment_id,
            student_id=student_id,
            content=content
        )
        try:
            db.session.add(submission)
            db.session.commit()
            return submission
        except IntegrityError:
            db.session.rollback()
            return None

    def get_submission(self, assignment_id, student_id):
        return Submission.query.filter_by(assignment_id=assignment_id, student_id=student_id).first()

    def get_submissions_by_assignment(self, assignment_id):
        return Submission.query.filter_by(assignment_id=assignment_id).all()

    def update_submission_score(self, submission_id, score):
        submission = Submission.query.get(submission_id)
        if submission:
            submission.score = score
            db.session.commit()
            return submission
        return None

    def get_assignment_stats(self, assignment_id):
        submissions = self.get_submissions_by_assignment(assignment_id)
        scores = [s.score for s in submissions if s.score is not None]
        if not scores:
            return {"average": 0, "max": 0, "min": 0, "count": 0}
        return {
            "average": sum(scores) / len(scores),
            "max": max(scores),
            "min": min(scores),
            "count": len(scores)
        }
    
    def get_submission_by_id(self, submission_id):
        return Submission.query.get(submission_id)
    
    def update_submission_content(self, submission_id, content, submitted_at):
        submission = Submission.query.get(submission_id)
        if not submission:
            return None
        submission.content = content
        submission.submitted_at = submitted_at
        # Khi sinh viên nộp lại, điểm có thể reset về None (nếu bạn muốn chấm lại)
        submission.score = None  
        try:
            db.session.commit()
            return submission
        except IntegrityError:
            db.session.rollback()
            return None
