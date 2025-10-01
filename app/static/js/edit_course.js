// app/static/js/edit_course.js (đã chỉnh sửa, thêm đầy đủ code cho quản lý materials)
// Giả sử file này đã có code cũ cho chỉnh sửa khóa học, thêm phần mới vào cuối

// Hàm khởi tạo trang chỉnh sửa khóa học (code cũ, giữ nguyên)
async function initEditCoursePage(courseId) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch(`/api/courses/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            alert('Lỗi tải thông tin khóa học');
            window.location.href = '/teacher/dashboard';
            return;
        }
        const data = await response.json();
        
        document.getElementById('course-id-display').textContent = courseId;
        document.getElementById('course-title').value = data.title;
        document.getElementById('course-description').value = data.description || '';
        document.getElementById('is-public').checked = data.is_public;
        document.getElementById('created-at-display').textContent = data.created_at;

        // Load materials khi khởi tạo
        loadMaterials(courseId);
    } catch (err) {
        console.error('Lỗi:', err);
        alert('Lỗi kết nối');
    }

    // Gắn event cho form chỉnh sửa khóa học (code cũ)
    document.getElementById('edit-course-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('course-title').value;
        const description = document.getElementById('course-description').value;
        const is_public = document.getElementById('is-public').checked;

        try {
            const res = await fetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, is_public })
            });
            const data = await res.json();
            alert(data.message);
            if (res.ok) {
                // Reload trang hoặc cập nhật
                initEditCoursePage(courseId);
            }
        } catch (err) {
            alert('Lỗi cập nhật khóa học');
        }
    });

    // Event xóa khóa học (code cũ)
    document.getElementById('delete-course-btn').addEventListener('click', async () => {
        if (confirm('Xác nhận xóa khóa học?')) {
            try {
                const res = await fetch(`/api/courses/${courseId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                alert(data.message);
                if (res.ok) {
                    window.location.href = '/teacher/dashboard';
                }
            } catch (err) {
                alert('Lỗi xóa khóa học');
            }
        }
    });
}

// Phần mới: Quản lý materials

async function loadMaterials(courseId) {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`/api/materials/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            alert('Lỗi tải tài liệu');
            return;
        }
        const data = await response.json();
        const tbody = document.querySelector('#materials-table tbody');
        tbody.innerHTML = '';
        data.materials.forEach(m => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${m.id}</td>
                <td>${m.title}</td>
                <td>${m.content.substring(0, 50)}...</td> <!-- Rút gọn nội dung -->
                <td>${m.created_at}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editMaterial(${m.id}, '${m.title}', '${m.content.replace(/'/g, "\\'")}')">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMaterial(${m.id}, ${courseId})">Xóa</button>
                </td>
            `;
        });
    } catch (err) {
        console.error('Lỗi tải materials:', err);
    }
}

document.getElementById('create-material-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const courseId = parseInt(document.body.getAttribute('data-course-id'), 10);
    const title = document.getElementById('material-title').value;
    const content = document.getElementById('material-content').value;
    const token = localStorage.getItem('access_token');

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
        alert('Lỗi tạo tài liệu');
    }
});

function editMaterial(materialId, currentTitle, currentContent) {
    const newTitle = prompt('Chỉnh sửa tiêu đề:', currentTitle);
    const newContent = prompt('Chỉnh sửa nội dung:', currentContent);
    if (newTitle && newContent) {
        updateMaterial(materialId, newTitle, newContent);
    }
}

async function updateMaterial(materialId, title, content) {
    const courseId = parseInt(document.body.getAttribute('data-course-id'), 10);
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`/api/materials/${materialId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, content })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            loadMaterials(courseId);
        }
    } catch (err) {
        alert('Lỗi cập nhật tài liệu');
    }
}

async function deleteMaterial(materialId, courseId) {
    if (confirm('Xác nhận xóa tài liệu?')) {
        const token = localStorage.getItem('access_token');
        try {
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
            alert('Lỗi xóa tài liệu');
        }
    }
}