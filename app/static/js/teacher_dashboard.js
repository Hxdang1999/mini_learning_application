// app/static/js/teacher_dashboard.js

const API_BASE_URL = '/api/courses';

// Hàm chuyển hướng đến trang chỉnh sửa khóa học
function editCourse(courseId) {
    window.location.href = `/teacher/courses/${courseId}`;
}

// Hàm kiểm tra xác thực và tải dữ liệu
function checkAuthAndLoad() {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    
    if (!token || role !== 'teacher' || !username) {
        if (typeof logout === 'function') {
            logout(); 
        } else {
            window.location.href = '/login';
        }
    } else {
        document.getElementById('username-display').textContent = username;
        fetchTeacherCourses();
        // Gắn sự kiện cho form tạo khóa học
        const createForm = document.getElementById('create-course-form');
        if (createForm) {
            createForm.addEventListener('submit', handleCreateCourse);
        }
    }
}

// Hàm hiển thị danh sách khóa học
function displayCourses(courses) {
    const tableBody = document.querySelector('#courses-table tbody'); 
    tableBody.innerHTML = ''; // Xóa nội dung cũ

    if (!courses || courses.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">Bạn chưa tạo khóa học nào.</td></tr>';
        return;
    }

    courses.forEach(c => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = c.id;

        // Cột tiêu đề: rút gọn và thêm tooltip
        const titleCell = row.insertCell();
        if (c.title) {
            const words = c.title.trim().split(/\s+/);
            if (words.length > 2) {
                titleCell.textContent = words.slice(0, 2).join(" ") + "...";
                titleCell.title = c.title; // Tooltip mặc định
            } else {
                titleCell.textContent = c.title;
            }
        } else {
            titleCell.textContent = "N/A";
        }

        row.insertCell().textContent = c.created_at || 'N/A';
        row.insertCell().textContent = c.is_public ? 'Công khai' : 'Riêng tư';
        
        const actionsCell = row.insertCell();
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-primary';
        editBtn.textContent = 'Sửa';
        editBtn.onclick = () => editCourse(c.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.textContent = 'Xóa';
        deleteBtn.onclick = () => deleteCourse(c.id);

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
}

// Hàm lấy danh sách khóa học
async function fetchTeacherCourses() {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/teacher`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayCourses(data.courses);
        } else if (response.status === 401 || response.status === 403) {
            alert("Phiên làm việc đã hết hạn hoặc không có quyền. Vui lòng đăng nhập lại.");
            logout();
        } else {
            const errorData = await response.json();
            alert('Lỗi khi tải khóa học: ' + errorData.message);
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách khóa học:', error);
        alert('Lỗi kết nối đến máy chủ.');
    }
}

// Hàm xử lý việc tạo khóa học mới
async function handleCreateCourse(event) {
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

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, is_public })
        });
        
        const data = await response.json();
        alert(data.message);

        if (response.ok) {
            document.getElementById('create-course-form').reset();
            fetchTeacherCourses();
        }

    } catch (error) {
        console.error('Lỗi khi tạo khóa học:', error);
        alert('Có lỗi xảy ra khi tạo khóa học. Vui lòng thử lại.');
    }
}

// Hàm xử lý xóa khóa học
async function deleteCourse(courseId) {
    if (confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
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
                fetchTeacherCourses();
            }
        } catch (error) {
            console.error('Lỗi khi xóa khóa học:', error);
            alert('Có lỗi xảy ra khi xóa khóa học. Vui lòng thử lại.');
        }
    }
}

// Gắn sự kiện khi DOM được tải xong
document.addEventListener('DOMContentLoaded', checkAuthAndLoad);
