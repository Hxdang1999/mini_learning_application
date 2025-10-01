// app/static/js/edit_course.js
const API_BASE_URL = '/api/courses';

async function initEditCoursePage(courseId) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('Không tìm thấy token');
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${courseId}`, {
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
        
        console.log('Dữ liệu khóa học:', data); // Log để kiểm tra
        document.getElementById('course-id-display').textContent = courseId;
        document.getElementById('course-title').value = data.title || '';
        document.getElementById('course-description').value = data.description || '';
        document.getElementById('is-public').checked = data.is_public || false;
        document.getElementById('created-at-display').textContent = data.created_at || 'N/A';

        // Load materials
        loadMaterials(courseId);

        // Load danh sách sinh viên
        loadPendingStudents(courseId, data.is_public);
        loadActiveStudents(courseId);
    } catch (err) {
        console.error('Lỗi khởi tạo trang:', err);
        alert('Lỗi kết nối khi tải thông tin khóa học');
    }

    // Gắn sự kiện form
    const editForm = document.getElementById('edit-course-form');
    if (editForm) {
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = document.getElementById('course-title').value;
            const description = document.getElementById('course-description').value;
            const is_public = document.getElementById('is-public').checked;

            try {
                const response = await fetch(`${API_BASE_URL}/${courseId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, description, is_public })
                });
                const data = await response.json();
                document.getElementById('message-container').textContent = data.message;
                if (response.ok) {
                    setTimeout(() => {
                        document.getElementById('message-container').textContent = '';
                    }, 3000);
                    // Cập nhật lại danh sách pending nếu thay đổi is_public
                    loadPendingStudents(courseId, is_public);
                }
            } catch (err) {
                console.error('Lỗi cập nhật khóa học:', err);
                alert('Lỗi kết nối khi cập nhật khóa học');
            }
        });
    }

    // Gắn sự kiện xóa khóa học
    const deleteBtn = document.getElementById('delete-course-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/${courseId}`, {
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

    // Gắn sự kiện tạo tài liệu
    const materialForm = document.getElementById('create-material-form');
    if (materialForm) {
        materialForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = document.getElementById('material-title').value;
            const content = document.getElementById('material-content').value;
            try {
                const response = await fetch(`/api/materials/${courseId}`, {
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
}

async function loadMaterials(courseId) {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`/api/materials/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Lỗi tải tài liệu:', data.message);
            alert(`Lỗi tải tài liệu: ${data.message}`);
            return;
        }
        const tbody = document.querySelector('#materials-table tbody');
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
                <td>${m.content ? m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '') : ''}</td>
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
        const response = await fetch(`/api/materials/${materialId}`, {
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
            const response = await fetch(`/api/materials/${materialId}`, {
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
        document.getElementById('pending-students-section').style.display = 'none';
        return;
    }
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/${courseId}/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Dữ liệu pending:', data); // Log để kiểm tra
        if (!response.ok) {
            console.error('Lỗi tải danh sách pending:', data.message);
            alert(`Lỗi tải danh sách sinh viên đợi duyệt: ${data.message}`);
            return;
        }
        const tbody = document.querySelector('#pending-students-table tbody');
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            console.log('Không có sinh viên đợi duyệt');
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
        document.getElementById('pending-students-section').style.display = 'block';
    } catch (err) {
        console.error('Lỗi tải danh sách pending:', err);
        alert('Lỗi kết nối khi tải danh sách sinh viên đợi duyệt');
    }
}

async function loadActiveStudents(courseId) {
    console.log(`Load active students for course ${courseId}`);
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/${courseId}/enrolled-students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Dữ liệu active:', data); // Log để kiểm tra
        if (!response.ok) {
            console.error('Lỗi tải danh sách active:', data.message);
            alert(`Lỗi tải danh sách sinh viên tham gia: ${data.message}`);
            return;
        }
        const tbody = document.querySelector('#active-students-table tbody');
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            console.log('Không có sinh viên tham gia');
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
        const response = await fetch(`${API_BASE_URL}/enrollments/${enrollmentId}/${action}`, {
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
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`${API_BASE_URL}/enrollments/${enrollmentId}/unenroll`, {
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