const API_BASE_URL = '/api/courses';

// Hàm chuyển hướng đến trang chỉnh sửa/chi tiết khóa học
function editCourse(courseId) {
    window.location.href = `/teacher/courses/${courseId}`;
}

// Hàm hiển thị section tương ứng với menu
function showSection(sectionId) {
    document.querySelectorAll('.card').forEach(section => {
        section.style.display = section.id === sectionId ? 'block' : 'none';
    });
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === sectionId);
    });
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
        return;
    }

    document.getElementById('username-display').textContent = username;
    
    // Gắn sự kiện cho menu sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(link.dataset.section + '-section');
        });
    });

    // Gắn sự kiện submit cho form tạo khóa học
    const createForm = document.getElementById('create-course-form');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateCourse);
    }

    // Gắn sự kiện submit cho form đổi mật khẩu
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    // Gắn sự kiện toggle sidebar
    const sidebarToggle = document.getElementById('sidebar-toggle');
    sidebarToggle.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        const mainContainer = document.getElementById('main-container');
        const isCollapsed = sidebar.classList.toggle('collapsed');
        mainContainer.classList.toggle('full-width');
        sidebarToggle.setAttribute('title', isCollapsed ? 'Mở rộng' : 'Thu gọn');
    });

    // Gắn sự kiện toggle sáng/tối
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        themeToggle.setAttribute('title', isDark ? 'Chế độ sáng' : 'Chế độ tối');
    });

    // Gắn sự kiện đăng xuất
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', () => {
        logout();
    });

    // Áp dụng theme từ localStorage
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.querySelector('i').className = 'fas fa-sun';
        themeToggle.setAttribute('title', 'Chế độ sáng');
    } else {
        themeToggle.setAttribute('title', 'Chế độ tối');
    }

    // Áp dụng trạng thái sidebar từ localStorage (nếu có)
    if (localStorage.getItem('sidebar') === 'collapsed') {
        document.getElementById('sidebar').classList.add('collapsed');
        document.getElementById('main-container').classList.add('full-width');
        sidebarToggle.setAttribute('title', 'Mở rộng');
    } else {
        sidebarToggle.setAttribute('title', 'Thu gọn');
    }

    // Tải danh sách khóa học
    fetchTeacherCourses();

    // Hiển thị section mặc định
    showSection('create-course-section');
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
        row.insertCell().textContent = c.id || 'N/A';
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
        const detailBtn = document.createElement('button');
        detailBtn.className = 'btn btn-sm btn-info';
        detailBtn.textContent = 'Xem chi tiết';
        detailBtn.onclick = () => editCourse(c.id);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.textContent = 'Xóa';
        deleteBtn.onclick = () => deleteCourse(c.id);
        actionsCell.appendChild(detailBtn);
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

// Hàm xử lý đổi mật khẩu
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

// Gắn sự kiện khi DOM được tải xong
document.addEventListener('DOMContentLoaded', checkAuthAndLoad);