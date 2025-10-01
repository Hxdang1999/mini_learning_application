// app/static/js/edit_course.js

const API_BASE_URL = '/api/courses';

/**
 * Tải thông tin chi tiết của khóa học và điền vào form.
 * @param {number} courseId - ID của khóa học.
 */
async function fetchCourseDetails(courseId) {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.href = '/login'; return; }
    
    document.getElementById('course-id-display').textContent = courseId;
    document.getElementById('message-container').textContent = 'Đang tải thông tin...';

    try {
        const response = await fetch(`${API_BASE_URL}/${courseId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('course-title').value = data.title;
            document.getElementById('course-description').value = data.description;
            document.getElementById('is-public').checked = data.is_public;
            document.getElementById('created-at-display').textContent = data.created_at;
            document.getElementById('message-container').textContent = ''; 
        } else if (response.status === 403 || response.status === 404) {
            alert(`Lỗi: ${data.message || "Không tìm thấy khóa học hoặc bạn không có quyền."}`);
            window.location.href = '/teacher/dashboard';
        } else {
            alert('Lỗi khi tải chi tiết khóa học: ' + data.message);
            window.location.href = '/teacher/dashboard';
        }
    } catch (error) {
        console.error('Lỗi kết nối API:', error);
        alert('Lỗi kết nối đến máy chủ.');
        window.location.href = '/teacher/dashboard';
    }
}

/**
 * Gửi yêu cầu cập nhật khóa học lên server.
 * @param {Event} event - Sự kiện submit form.
 * @param {number} courseId - ID của khóa học.
 */
async function handleUpdateCourse(event, courseId) {
    event.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const title = document.getElementById('course-title').value;
    const description = document.getElementById('course-description').value;
    const is_public = document.getElementById('is-public').checked;

    if (!title) {
        alert("Tiêu đề không được để trống!");
        return;
    }

    const messageContainer = document.getElementById('message-container');
    messageContainer.textContent = 'Đang lưu...';

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
        
        if (response.ok) {
            messageContainer.textContent = data.message;
            // Xóa thông báo sau 3 giây
            setTimeout(() => messageContainer.textContent = '', 3000); 
        } else {
            messageContainer.textContent = 'Cập nhật thất bại: ' + data.message;
        }

    } catch (error) {
        console.error('Lỗi khi cập nhật khóa học:', error);
        messageContainer.textContent = 'Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.';
    }
}

/**
 * Xử lý việc xóa khóa học.
 * @param {number} courseId - ID của khóa học.
 */
async function deleteCourseFromEditPage(courseId) {
    if (confirm('Bạn có chắc chắn muốn XÓA khóa học này? Hành động này không thể hoàn tác!')) {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/${courseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            alert(data.message);
            if (response.ok) {
                // Chuyển hướng về dashboard sau khi xóa thành công
                window.location.href = '/teacher/dashboard';
            }
        } catch (error) {
            console.error('Lỗi khi xóa:', error);
            alert('Lỗi xảy ra trong quá trình xóa.');
        }
    }
}

/**
 * Hàm khởi tạo chính, được gọi khi DOM đã sẵn sàng.
 * @param {number} courseId - ID của khóa học được truyền từ Flask.
 */
function initEditCoursePage(courseId) {
    fetchCourseDetails(courseId);
    
    const form = document.getElementById('edit-course-form');
    if (form) {
        // Gắn sự kiện submit form, truyền courseId
        form.addEventListener('submit', (event) => handleUpdateCourse(event, courseId));
    }

    const deleteButton = document.getElementById('delete-course-btn');
    if (deleteButton) {
        // Gắn sự kiện click nút xóa
        deleteButton.addEventListener('click', () => deleteCourseFromEditPage(courseId));
    }
}