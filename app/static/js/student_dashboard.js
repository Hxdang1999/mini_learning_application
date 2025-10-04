const API_BASE_URL = '/api/courses';

function checkAuthAndLoad() {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    if (!token || role !== 'student' || !username) {
        if (typeof logout === 'function') {
            logout();
        } else {
            window.location.href = '/login';
        }
        return;
    }
    document.getElementById('username-display').textContent = username;
    fetchAvailableCourses();
    fetchEnrolledCourses();
    const searchBtn = document.querySelector('#search-course-id + button');
    if (searchBtn) {
        searchBtn.addEventListener('click', lookupCourse);
    }
    // Mới: Gắn sự kiện submit cho form đổi mật khẩu
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
}

function truncateDescription(description) {
    if (!description) return '';
    return description.length > 50 ? description.substring(0, 50) + '...' : description;
}

function displayAvailableCourses(courses) {
    const tbody = document.querySelector('#available-courses-list tbody');
    tbody.innerHTML = '';
    if (!courses || courses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Không có khóa học nào.</td></tr>';
        return;
    }
    courses.forEach(c => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${c.id}</td>
            <td>${c.title}</td>
            <td title="${c.description || ''}">${truncateDescription(c.description)}</td>
            <td>${c.is_public ? 'Công khai' : 'Riêng tư'}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="handleEnrollCourse(${c.id})">
                    ${c.is_public ? 'Đăng ký' : 'Yêu cầu tham gia'}
                </button>
            </td>
        `;
    });
}

function displayEnrolledCourses(courses) {
    const tbody = document.querySelector('#enrolled-courses-list tbody');
    tbody.innerHTML = '';
    if (!courses || courses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Bạn chưa đăng ký khóa học nào.</td></tr>';
        return;
    }
    courses.forEach(c => {
        const row = tbody.insertRow();
        let actionButtons = '';
        if (c.status === 'active') {
            actionButtons = `
                <button class="btn btn-success btn-sm" onclick="enterCourse(${c.id})">Vào khóa học</button>
                <button class="btn btn-danger btn-sm" onclick="handleUnenroll(${c.id})">Rời khỏi</button>
            `;
        } else if (c.status === 'pending') {
            actionButtons = `
                <button class="btn btn-secondary btn-sm" disabled>Chờ duyệt</button>
                <button class="btn btn-danger btn-sm" onclick="handleUnenroll(${c.id})">Hủy yêu cầu</button>
            `;
        }
        row.innerHTML = `
            <td>${c.id}</td>
            <td>${c.title}</td>
            <td>${c.teacher_username}</td>
            <td>${c.is_public ? 'Công khai' : 'Riêng tư'}</td>
            <td>${actionButtons}</td>
        `;
    });
}

async function fetchAvailableCourses() {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/available`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            alert('Lỗi: ' + errorData.message);
            return;
        }
        const data = await response.json();
        displayAvailableCourses(data.courses);
    } catch (err) {
        console.error('Lỗi tải khóa học:', err);
        alert('Lỗi kết nối');
    }
}

async function fetchEnrolledCourses() {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/enrolled`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            alert('Lỗi: ' + errorData.message);
            return;
        }
        const data = await response.json();
        displayEnrolledCourses(data.courses);
    } catch (err) {
        console.error('Lỗi tải khóa học đã đăng ký:', err);
        alert('Lỗi kết nối');
    }
}

async function handleEnrollCourse(courseId) {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/${courseId}/enroll`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            fetchAvailableCourses();
            fetchEnrolledCourses();
        }
    } catch (err) {
        console.error('Lỗi khi đăng ký:', err);
        alert('Lỗi kết nối');
    }
}

async function handleUnenroll(courseId) {
    const token = localStorage.getItem('access_token');
    if (!confirm("Bạn có chắc chắn muốn rời khỏi khóa học này?")) return;
    try {
        const response = await fetch(`${API_BASE_URL}/${courseId}/unenroll`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            fetchAvailableCourses();
            fetchEnrolledCourses();
        }
    } catch (err) {
        console.error('Lỗi khi rời khỏi:', err);
        alert('Không thể rời khỏi khóa học.');
    }
}

async function lookupCourse() {
    const token = localStorage.getItem('access_token');
    const courseId = document.getElementById('search-course-id').value;
    if (!courseId) return alert("Vui lòng nhập ID khóa học");
    try {
        const response = await fetch(`${API_BASE_URL}/${courseId}/lookup`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.message);
            return;
        }
        const enrolledResponse = await fetch(`${API_BASE_URL}/enrolled`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const enrolledData = await enrolledResponse.json();
        const enrolledCourses = enrolledData.courses || [];
        const enrolled = enrolledCourses.find(c => c.id === data.id);
        let actionButtons = '';
        if (!enrolled) {
            actionButtons = `
                <button class="btn btn-primary btn-sm" onclick="handleEnrollCourse(${data.id})">
                    ${data.is_public ? 'Đăng ký' : 'Yêu cầu tham gia'}
                </button>
            `;
        } else {
            if (enrolled.status === 'active') {
                actionButtons = `
                    <button class="btn btn-success btn-sm" onclick="enterCourse(${data.id})">Vào khóa học</button>
                    <button class="btn btn-danger btn-sm" onclick="handleUnenroll(${data.id})">Rời khỏi</button>
                `;
            } else if (enrolled.status === 'pending') {
                actionButtons = `
                    <button class="btn btn-secondary btn-sm" disabled>Chờ duyệt</button>
                    <button class="btn btn-danger btn-sm" onclick="handleUnenroll(${data.id})">Hủy yêu cầu</button>
                `;
            }
        }
        document.getElementById('lookup-result').innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tiêu đề</th>
                        <th>Mô tả</th>
                        <th>Công khai</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${data.id}</td>
                        <td>${data.title}</td>
                        <td title="${data.description || ''}">
                            ${truncateDescription(data.description)}
                        </td>
                        <td>${data.is_public ? 'Công khai' : 'Riêng tư'}</td>
                        <td>${actionButtons}</td>
                    </tr>
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error('Lỗi khi tìm khóa học:', err);
        alert('Không thể tìm khóa học');
    }
}

function enterCourse(courseId) {
    window.location.href = `/student/courses/${courseId}`;
}

// Mới: Xử lý đổi mật khẩu
async function handleChangePassword(event) {
    event.preventDefault();
    const token = localStorage.getItem('access_token');
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            document.getElementById('change-password-form').reset();
        }
    } catch (error) {
        console.error('Lỗi khi thay đổi mật khẩu:', error);
        alert('Có lỗi xảy ra khi thay đổi mật khẩu.');
    }
}

document.addEventListener('DOMContentLoaded', checkAuthAndLoad);