// app/static/js/edit_course.js
const API_BASE_URL = '/api';

async function initEditCoursePage(courseId) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('Không tìm thấy token');
        alert('Vui lòng đăng nhập lại');
        window.location.href = '/login';
        return;
    }

    try {
        // Tải thông tin khóa học
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Lỗi tải khóa học:', errorData.message);
            alert(`Lỗi tải thông tin khóa học: ${errorData.message}`);
            window.location.href = '/teacher/dashboard';
            return;
        }
        const data = await response.json();
        
        console.log('Dữ liệu khóa học:', data);
        // Cập nhật thông tin khóa học
        const courseIdDisplay = document.getElementById('course-id-display');
        const courseTitle = document.getElementById('course-title');
        const courseDescription = document.getElementById('course-description');
        const isPublic = document.getElementById('is-public');
        const createdAtDisplay = document.getElementById('created-at-display');
        
        if (courseIdDisplay && courseTitle && courseDescription && isPublic && createdAtDisplay) {
            courseIdDisplay.textContent = courseId;
            courseTitle.value = data.title || '';
            courseDescription.value = data.description || '';
            isPublic.checked = data.is_public || false;
            createdAtDisplay.textContent = data.created_at || 'N/A';
        } else {
            console.error('Không tìm thấy một hoặc nhiều phần tử DOM');
            alert('Lỗi giao diện: Không tìm thấy các phần tử cần thiết');
            return;
        }

        // Tải các danh sách
        await Promise.all([
            loadMaterials(courseId),
            loadPendingStudents(courseId, data.is_public),
            loadActiveStudents(courseId),
            loadAssignments(courseId)
        ]);
    } catch (err) {
        console.error('Lỗi khởi tạo trang:', err);
        alert('Lỗi kết nối khi tải thông tin khóa học');
        window.location.href = '/teacher/dashboard';
    }

    // Event cho form sửa khóa học
    const editForm = document.getElementById('edit-course-form');
    if (editForm) {
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = document.getElementById('course-title').value;
            const description = document.getElementById('course-description').value;
            const is_public = document.getElementById('is-public').checked;
            try {
                const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, description, is_public })
                });
                const data = await response.json();
                alert(data.message);
                if (response.ok) {
                    document.getElementById('message-container').textContent = data.message;
                    setTimeout(() => {
                        document.getElementById('message-container').textContent = '';
                    }, 3000);
                    loadPendingStudents(courseId, is_public);
                }
            } catch (err) {
                console.error('Lỗi cập nhật khóa học:', err);
                alert('Lỗi kết nối khi cập nhật khóa học');
            }
        });
    }

    // Event cho xóa khóa học
    const deleteBtn = document.getElementById('delete-course-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    alert(data.message);
                    if (response.ok) {
                        window.location.href = '/teacher/dashboard';
                    }
                } catch (err) {
                    console.error('Lỗi xóa khóa học:', err);
                    alert('Lỗi kết nối khi xóa khóa học');
                }
            }
        });
    }

    // Event cho tạo tài liệu
    const materialForm = document.getElementById('create-material-form');
    if (materialForm) {
        materialForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = document.getElementById('material-title').value;
            const content = document.getElementById('material-content').value;
            try {
                const response = await fetch(`${API_BASE_URL}/materials/${courseId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, content })
                });
                const data = await response.json();
                alert(data.message);
                if (response.ok) {
                    document.getElementById('create-material-form').reset();
                    loadMaterials(courseId);
                }
            } catch (err) {
                console.error('Lỗi tạo tài liệu:', err);
                alert('Lỗi kết nối khi tạo tài liệu');
            }
        });
    }

    // Event cho tạo bài tập
    const assignmentForm = document.getElementById('create-assignment-form');
    if (assignmentForm) {
        assignmentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = document.getElementById('assignment-title').value;
            const description = document.getElementById('assignment-description').value;
            const deadline = document.getElementById('assignment-deadline').value;
            const max_score = parseFloat(document.getElementById('assignment-max-score').value);
            try {
                const response = await fetch(`${API_BASE_URL}/assignments/${courseId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, description, deadline, max_score })
                });
                const data = await response.json();
                alert(data.message);
                if (response.ok) {
                    document.getElementById('create-assignment-form').reset();
                    loadAssignments(courseId);
                }
            } catch (err) {
                console.error('Lỗi tạo bài tập:', err);
                alert('Lỗi kết nối khi tạo bài tập');
            }
        });
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
        if (!tbody) {
            console.error('Không tìm thấy bảng tài liệu');
            return;
        }
        tbody.innerHTML = '';
        if (!data.materials || data.materials.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Không có tài liệu nào.</td></tr>';
            return;
        }
        data.materials.forEach(m => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${m.id}</td>
                <td>${m.title}</td>
                <td>${m.content ? m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '') : 'N/A'}</td>
                <td>${m.created_at}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editMaterial(${m.id}, ${courseId}, '${m.title}', '${m.content || ''}')">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMaterial(${m.id}, ${courseId})">Xóa</button>
                </td>
            `;
        });
    } catch (err) {
        console.error('Lỗi tải tài liệu:', err);
        alert('Lỗi kết nối khi tải tài liệu');
    }
}

async function editMaterial(materialId, courseId, title, content) {
    const newTitle = prompt('Nhập tiêu đề mới:', title);
    if (!newTitle) return;
    const newContent = prompt('Nhập nội dung/link mới:', content);
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/materials/${materialId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title: newTitle, content: newContent })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            loadMaterials(courseId);
        }
    } catch (err) {
        console.error('Lỗi sửa tài liệu:', err);
        alert('Lỗi kết nối khi sửa tài liệu');
    }
}

async function deleteMaterial(materialId, courseId) {
    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/materials/${materialId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            alert(data.message);
            if (response.ok) {
                loadMaterials(courseId);
            }
        } catch (err) {
            console.error('Lỗi xóa tài liệu:', err);
            alert('Lỗi kết nối khi xóa tài liệu');
        }
    }
}

async function loadPendingStudents(courseId, isPublic) {
    console.log(`Load pending students for course ${courseId}, isPublic: ${isPublic}`);
    if (isPublic) {
        console.log('Khóa học công khai, ẩn section pending');
        const pendingSection = document.getElementById('pending-students-section');
        if (pendingSection) pendingSection.style.display = 'none';
        return;
    }
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Dữ liệu pending:', data);
        if (!response.ok) {
            console.error('Lỗi tải danh sách pending:', data.message);
            alert(`Lỗi tải danh sách sinh viên đợi duyệt: ${data.message}`);
            return;
        }
        const tbody = document.querySelector('#pending-students-table tbody');
        if (!tbody) {
            console.error('Không tìm thấy bảng pending students');
            return;
        }
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">Không có sinh viên đợi duyệt.</td></tr>';
        } else {
            data.forEach(e => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${e.id}</td>
                    <td>${e.student_id}</td>
                    <td>${e.created_at}</td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="handleEnrollmentAction(${e.id}, 'approve', ${courseId})">Duyệt</button>
                        <button class="btn btn-sm btn-danger" onclick="handleEnrollmentAction(${e.id}, 'reject', ${courseId})">Từ chối</button>
                    </td>
                `;
            });
        }
        const pendingSection = document.getElementById('pending-students-section');
        if (pendingSection) pendingSection.style.display = 'block';
    } catch (err) {
        console.error('Lỗi tải danh sách pending:', err);
        alert('Lỗi kết nối khi tải danh sách sinh viên đợi duyệt');
    }
}

async function loadActiveStudents(courseId) {
    console.log(`Load active students for course ${courseId}`);
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enrolled-students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Dữ liệu active:', data);
        if (!response.ok) {
            console.error('Lỗi tải danh sách active:', data.message);
            alert(`Lỗi tải danh sách sinh viên tham gia: ${data.message}`);
            return;
        }
        const tbody = document.querySelector('#active-students-table tbody');
        if (!tbody) {
            console.error('Không tìm thấy bảng active students');
            return;
        }
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Không có sinh viên tham gia.</td></tr>';
        } else {
            data.forEach(e => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${e.id}</td>
                    <td>${e.student_id}</td>
                    <td>${e.student_username || 'N/A'}</td>
                    <td>${e.enrolled_at}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="teacherUnenroll(${e.id}, ${courseId})">Buộc rời</button>
                    </td>
                `;
            });
        }
    } catch (err) {
        console.error('Lỗi tải danh sách active:', err);
        alert('Lỗi kết nối khi tải danh sách sinh viên tham gia');
    }
}

async function handleEnrollmentAction(enrollmentId, action, courseId) {
    console.log(`Xử lý enrollment ${enrollmentId}, action: ${action}`);
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/courses/enrollments/${enrollmentId}/${action}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Kết quả xử lý enrollment:', data);
        alert(data.message);
        if (response.ok) {
            loadPendingStudents(courseId, document.getElementById('is-public').checked);
            loadActiveStudents(courseId);
        }
    } catch (err) {
        console.error('Lỗi xử lý yêu cầu:', err);
        alert('Lỗi kết nối khi xử lý yêu cầu');
    }
}

async function teacherUnenroll(enrollmentId, courseId) {
    console.log(`Buộc rời enrollment ${enrollmentId}`);
    if (confirm('Bạn có chắc chắn muốn buộc rời sinh viên này?')) {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/courses/enrollments/${enrollmentId}/unenroll`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            console.log('Kết quả buộc rời:', data);
            alert(data.message);
            if (response.ok) {
                loadActiveStudents(courseId);
            }
        } catch (err) {
            console.error('Lỗi buộc rời:', err);
            alert('Lỗi kết nối khi buộc rời sinh viên');
        }
    }
}

async function loadAssignments(courseId) {
    console.log(`Load assignments for course ${courseId}`);
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Dữ liệu bài tập:', data);
        if (!response.ok) {
            console.error('Lỗi tải bài tập:', data.message);
            alert(`Lỗi tải bài tập: ${data.message}`);
            return;
        }
        const tbody = document.querySelector('#assignments-table tbody');
        if (!tbody) {
            console.error('Không tìm thấy bảng bài tập');
            alert('Lỗi giao diện: Không tìm thấy bảng bài tập');
            return;
        }
        tbody.innerHTML = '';
        if (!data.assignments || data.assignments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Không có bài tập nào.</td></tr>';
            return;
        }
        for (const a of data.assignments) {
            let stats = { average: 0, max: 0, min: 0, count: 0 };
            try {
                const statsResponse = await fetch(`${API_BASE_URL}/assignments/${a.id}/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (statsResponse.ok) {
                    stats = await statsResponse.json();
                    console.log(`Thống kê bài tập ${a.id}:`, stats);
                } else {
                    console.error(`Lỗi tải thống kê bài tập ${a.id}:`, await statsResponse.json());
                }
            } catch (err) {
                console.error(`Lỗi tải thống kê bài tập ${a.id}:`, err);
            }
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${a.id}</td>
                <td>${a.title}</td>
                <td>${a.description ? a.description.substring(0, 50) + (a.description.length > 50 ? '...' : '') : 'N/A'}</td>
                <td>${a.deadline || 'Không có'}</td>
                <td>${a.max_score}</td>
                <td class="stats">TB: ${stats.average.toFixed(2)}, Cao: ${stats.max}, Thấp: ${stats.min}, Số bài: ${stats.count}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editAssignment(${a.id}, ${courseId}, '${a.title}', '${a.description || ''}', '${a.deadline || ''}', ${a.max_score})">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${a.id}, ${courseId})">Xóa</button>
                    <button class="btn btn-sm btn-info" onclick="loadSubmissions(${a.id}, ${courseId})">Xem bài nộp</button>
                </td>
            `;
        }
    } catch (err) {
        console.error('Lỗi tải bài tập:', err);
        alert('Lỗi kết nối khi tải bài tập');
    }
}

async function editAssignment(assignmentId, courseId, title, description, deadline, max_score) {
    const newTitle = prompt('Nhập tiêu đề mới:', title);
    if (!newTitle) return;
    const newDescription = prompt('Nhập mô tả mới:', description);
    const newDeadline = prompt('Nhập hạn nộp mới (YYYY-MM-DDTHH:MM):', deadline);
    const newMaxScore = prompt('Nhập điểm tối đa mới:', max_score);
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: newTitle,
                description: newDescription,
                deadline: newDeadline || null,
                max_score: parseFloat(newMaxScore)
            })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            loadAssignments(courseId);
        }
    } catch (err) {
        console.error('Lỗi sửa bài tập:', err);
        alert('Lỗi kết nối khi sửa bài tập');
    }
}

async function deleteAssignment(assignmentId, courseId) {
    if (confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            alert(data.message);
            if (response.ok) {
                loadAssignments(courseId);
            }
        } catch (err) {
            console.error('Lỗi xóa bài tập:', err);
            alert('Lỗi kết nối khi xóa bài tập');
        }
    }
}

async function loadSubmissions(assignmentId, courseId) {
    console.log(`Load submissions for assignment ${assignmentId}`);
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Dữ liệu bài nộp:', data);
        if (!response.ok) {
            console.error('Lỗi tải bài nộp:', data.message);
            alert(`Lỗi tải bài nộp: ${data.message}`);
            return;
        }
        const tbody = document.querySelector('#submissions-table tbody');
        if (!tbody) {
            console.error('Không tìm thấy bảng bài nộp');
            alert('Lỗi giao diện: Không tìm thấy bảng bài nộp');
            return;
        }
        tbody.innerHTML = '';
        if (!data.submissions || data.submissions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Không có bài nộp nào.</td></tr>';
            return;
        }
        data.submissions.forEach(s => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${s.id}</td>
                <td>${s.student_username}</td>
                <td>${s.content ? s.content.substring(0, 50) + (s.content.length > 50 ? '...' : '') : 'N/A'}</td>
                <td>${s.score !== null ? s.score : 'Chưa chấm'}</td>
                <td>${s.submitted_at}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="gradeSubmission(${s.id}, ${courseId}, ${assignmentId})">Chấm điểm</button>
                </td>
            `;
        });
    } catch (err) {
        console.error('Lỗi tải bài nộp:', err);
        alert('Lỗi kết nối khi tải bài nộp');
    }
}

async function gradeSubmission(submissionId, courseId, assignmentId) {
    console.log(`Bắt đầu chấm điểm cho submission ${submissionId}, assignment ${assignmentId}, course ${courseId}`);
    const score = prompt('Nhập điểm (0-100):');
    if (score === null) {
        console.log('Hủy chấm điểm');
        return;
    }
    const scoreValue = parseFloat(score);
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
        console.error('Điểm không hợp lệ:', score);
        alert('Điểm phải là số từ 0 đến 100');
        return;
    }
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.error('Không tìm thấy token');
            alert('Vui lòng đăng nhập lại');
            window.location.href = '/login';
            return;
        }
        console.log('Gửi yêu cầu chấm điểm:', { submissionId, score: scoreValue });
        const response = await fetch(`${API_BASE_URL}/assignments/submissions/${submissionId}/grade`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ score: scoreValue })
        });
        const data = await response.json();
        console.log('Phản hồi từ API chấm điểm:', data);
        alert(data.message);
        if (response.ok) {
            loadSubmissions(assignmentId, courseId);
        } else {
            console.error('Lỗi từ server:', data.message);
            alert(`Lỗi từ server: ${data.message}`);
        }
    } catch (err) {
        console.error('Lỗi kết nối khi chấm điểm:', err.message);
        alert(`Lỗi kết nối khi chấm điểm: ${err.message}`);
    }
}