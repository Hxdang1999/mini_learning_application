// app/static/js/course_detail.js (file mới cho sinh viên)
async function initCourseDetailPage(courseId) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        // Load thông tin khóa học (sử dụng API get_course)
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!courseResponse.ok) {
            alert('Lỗi tải thông tin khóa học');
            window.location.href = '/student/dashboard';
            return;
        }
        const courseData = await courseResponse.json();
        
        document.getElementById('course-id-display').textContent = courseId;
        document.getElementById('course-title').textContent = courseData.title;
        document.getElementById('course-description').textContent = courseData.description || 'Không có';
        document.getElementById('is-public').textContent = courseData.is_public ? 'Có' : 'Không';
        document.getElementById('created-at-display').textContent = courseData.created_at;

        // Load materials
        loadMaterials(courseId);
    } catch (err) {
        console.error('Lỗi:', err);
        alert('Lỗi kết nối');
    }
}

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
                <td>${m.content}</td> <!-- Hiển thị đầy đủ hoặc rút gọn nếu cần -->
                <td>${m.created_at}</td>
            `;
        });
    } catch (err) {
        console.error('Lỗi tải materials:', err);
    }
}