// app/static/js/course_detail.js
const API_BASE_URL = '/api';

async function initCourseDetailPage(courseId) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('Không tìm thấy token');
        alert('Vui lòng đăng nhập lại');
        window.location.href = '/login';
        return;
    }

    try {
        // Tải thông tin khóa học
        const courseResponse = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const courseData = await courseResponse.json();
        if (!courseResponse.ok) {
            console.error('Lỗi tải thông tin khóa học:', courseData.message);
            alert(`Chưa tải được thông tin khóa học: ${courseData.message}`);
            window.location.href = '/student/dashboard';
            return;
        }

        console.log('Dữ liệu khóa học:', courseData);
        document.getElementById('course-id-display').textContent = courseId;
        document.getElementById('course-title').textContent = courseData.title || 'N/A';
        document.getElementById('course-description').textContent = courseData.description || 'Không có mô tả';
        document.getElementById('is-public').textContent = courseData.is_public ? 'Công khai' : 'Riêng tư';
        document.getElementById('created-at').textContent = courseData.created_at || 'N/A';

        // Tải tài liệu
        await loadMaterials(courseId);
        // Tải bài tập
        await loadAssignments(courseId);
    } catch (err) {
        console.error('Lỗi kết nối:', err);
        alert('Lỗi kết nối khi tải thông tin khóa học');
        window.location.href = '/student/dashboard';
    }
}

async function loadMaterials(courseId) {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/materials/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Lỗi tải tài liệu:', data.message);
            alert(`Lỗi tải tài liệu: ${data.message}`);
            return;
        }
        console.log('Dữ liệu tài liệu:', data);
        const tbody = document.querySelector('#materials-table tbody');
        tbody.innerHTML = '';
        if (!data.materials || data.materials.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">Không có tài liệu nào.</td></tr>';
            return;
        }
        data.materials.forEach(m => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${m.id}</td>
                <td>${m.title}</td>
                <td>${m.content ? m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '') : 'N/A'}</td>
                <td>${m.created_at}</td>
            `;
        });
    } catch (err) {
        console.error('Lỗi tải tài liệu:', err);
        alert('Lỗi kết nối khi tải tài liệu');
    }
}

async function loadAssignments(courseId) {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Lỗi tải bài tập:', data.message);
            alert(`Lỗi tải bài tập: ${data.message}`);
            return;
        }
        console.log('Dữ liệu bài tập:', data);
        const tbody = document.querySelector('#assignments-table tbody');
        tbody.innerHTML = '';
        if (!data.assignments || data.assignments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Không có bài tập nào.</td></tr>';
            return;
        }
        for (const a of data.assignments) {
            const submissionResponse = await fetch(`${API_BASE_URL}/assignments/${a.id}/submissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const submissionData = await submissionResponse.json();
            const submission = submissionData.submissions && submissionData.submissions[0];
            const status = submission
                ? (submission.score !== null ? `Đã chấm: ${submission.score}` : 'Đã nộp, chưa chấm')
                : 'Chưa nộp';
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${a.id}</td>
                <td>${a.title}</td>
                <td>${a.description ? a.description.substring(0, 50) + (a.description.length > 50 ? '...' : '') : 'N/A'}</td>
                <td>${a.deadline || 'Không có'}</td>
                <td>${a.max_score}</td>
                <td>${status}</td>
                <td>
                    ${!submission ? `<button class="btn btn-sm btn-primary" onclick="submitAssignment(${a.id}, ${courseId})">Nộp bài</button>` : ''}
                </td>
            `;
        }
    } catch (err) {
        console.error('Lỗi tải bài tập:', err);
        alert('Lỗi kết nối khi tải bài tập');
    }
}

async function submitAssignment(assignmentId, courseId) {
    const content = prompt('Nhập nội dung hoặc link bài nộp:');
    if (!content) return;
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            loadAssignments(courseId);
        }
    } catch (err) {
        console.error('Lỗi nộp bài:', err);
        alert('Lỗi kết nối khi nộp bài');
    }
}