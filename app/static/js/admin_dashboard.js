const API_BASE_URL = '/api/admin';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    if (!token || role !== 'admin') {
        window.location.href = '/login';
        return;
    }

    document.getElementById('username-display').textContent = username;

    // Sidebar & Theme setup
    setupSidebar();

    try {
        const profileResponse = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!profileResponse.ok) throw new Error('Failed to fetch profile');
        const profile = await profileResponse.json();

        const isRoot = profile.is_root;
        if (isRoot) {
            document.getElementById('menu-root-admin').style.display = 'block';
            document.getElementById('root-admin-section').style.display = 'block';
            document.getElementById('create-sub-admin-form').addEventListener('submit', handleCreateSubAdmin);
            loadSubAdmins();
        }

        loadUsers();
        loadCurrentCode();
        loadPendingUsers();

        document.getElementById('update-code-form').addEventListener('submit', handleUpdateCode);
        document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Lỗi tải thông tin admin. Vui lòng đăng nhập lại.');
        logout();
    }
});

function setupSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const mainContainer = document.getElementById('main-container');
    const themeToggle = document.getElementById('theme-toggle');
    const logoutButton = document.getElementById('logout-button');

    // Toggle sidebar
    sidebarToggle.addEventListener('click', () => {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        mainContainer.classList.toggle('full-width');
        localStorage.setItem('sidebar', isCollapsed ? 'collapsed' : 'expanded');
        sidebarToggle.setAttribute('title', isCollapsed ? 'Mở rộng' : 'Thu gọn');
    });

    // Toggle dark mode
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        themeToggle.setAttribute('title', isDark ? 'Chế độ sáng' : 'Chế độ tối');
    });

    // Apply theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.querySelector('i').className = 'fas fa-sun';
    }

    // Sidebar state
    if (localStorage.getItem('sidebar') === 'collapsed') {
        sidebar.classList.add('collapsed');
        mainContainer.classList.add('full-width');
    }

    // Logout
    logoutButton.addEventListener('click', logout);

    // Menu click
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            showSection(sectionId);
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    showSection('manage-users-section'); // Default view
}

function showSection(sectionId) {
    document.querySelectorAll('.card').forEach(sec => {
        sec.style.display = sec.id === sectionId ? 'block' : 'none';
    });
}

/* ================== CÁC HÀM GỐC GIỮ NGUYÊN ================== */

async function loadSubAdmins() {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/sub-admins`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch sub-admins');
        const data = await response.json();
        const tableBody = document.getElementById('sub-admins-table').querySelector('tbody');
        tableBody.innerHTML = '';
        data.sub_admins.forEach(admin => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${admin.id}</td>
                <td>${admin.username}</td>
                <td>${admin.registration_code}</td>
                <td>${admin.max_users}</td>
                <td>
                    <button onclick="updateMaxUsers(${admin.id})">Cập nhật Max</button>
                    <button onclick="resetSubAdminPassword(${admin.id})">Reset PW</button>
                    <button onclick="deleteSubAdmin(${admin.id})">Xóa</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Lỗi khi tải danh sách admin phụ:', error);
        alert('Lỗi khi tải danh sách admin phụ.');
    }
}

async function handleCreateSubAdmin(event) {
    event.preventDefault();
    const token = localStorage.getItem('access_token');
    const username = document.getElementById('sub-username').value;
    const password = document.getElementById('sub-password').value;
    const maxUsers = document.getElementById('max-users').value;

    try {
        const response = await fetch(`${API_BASE_URL}/sub-admins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ username, password, max_users: maxUsers })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            loadSubAdmins();
            document.getElementById('create-sub-admin-form').reset();
        }
    } catch (error) {
        console.error('Lỗi khi tạo admin phụ:', error);
        alert('Có lỗi xảy ra khi tạo admin phụ.');
    }
}

async function deleteSubAdmin(subAdminId) {
    if (!confirm('Bạn có chắc muốn xóa admin phụ này?')) return;
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/sub-admins/${subAdminId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) loadSubAdmins();
    } catch (error) {
        console.error('Lỗi khi xóa admin phụ:', error);
        alert('Có lỗi xảy ra khi xóa admin phụ.');
    }
}

async function updateMaxUsers(subAdminId) {
    const maxUsers = prompt('Nhập số lượng user tối đa mới:');
    if (!maxUsers || isNaN(maxUsers)) {
        alert('Vui lòng nhập số hợp lệ.');
        return;
    }
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/sub-admins/${subAdminId}/max-users`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ max_users: parseInt(maxUsers) })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) loadSubAdmins();
    } catch (error) {
        console.error('Lỗi khi cập nhật max users:', error);
        alert('Có lỗi xảy ra khi cập nhật max users.');
    }
}

async function resetSubAdminPassword(subAdminId) {
    if (!confirm('Bạn có chắc muốn reset mật khẩu admin phụ này?')) return;
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/sub-admins/${subAdminId}/reset-password`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        alert(`${data.message}. Mật khẩu mới: ${data.new_password}`);
        if (response.ok) loadSubAdmins();
    } catch (error) {
        console.error('Lỗi khi reset mật khẩu admin phụ:', error);
        alert('Có lỗi xảy ra khi reset mật khẩu admin phụ.');
    }
}

async function loadUsers() {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        const tableBody = document.getElementById('users-table').querySelector('tbody');
        tableBody.innerHTML = '';
        if (data.remaining_slots !== undefined) {
            document.getElementById('remaining-slots').textContent = data.remaining_slots;
            data.users.forEach(user => addUserRow(tableBody, user, ''));
        } else {
            for (const [manager, users] of Object.entries(data)) {
                users.forEach(user => addUserRow(tableBody, user, manager));
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách user:', error);
        alert('Lỗi khi tải danh sách user.');
    }
}

function addUserRow(tableBody, user, manager) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.role}</td>
        <td>${user.status || 'active'}</td>
        <td>${manager}</td>
        <td>
            <button onclick="resetPassword(${user.id})">Reset PW</button>
            <button onclick="lockUser(${user.id}, ${!user.is_locked})">${user.is_locked ? 'Unlock' : 'Lock'}</button>
        </td>
    `;
    tableBody.appendChild(row);
}

async function resetPassword(userId) {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        alert(`${data.message}. Mật khẩu mới: ${data.new_password}`);
        loadUsers();
    } catch (error) {
        console.error('Lỗi khi reset mật khẩu:', error);
        alert('Có lỗi xảy ra khi reset mật khẩu.');
    }
}

async function lockUser(userId, lock) {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/lock`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ lock })
        });
        const data = await response.json();
        alert(data.message);
        loadUsers();
    } catch (error) {
        console.error('Lỗi khi khóa/mở khóa user:', error);
        alert('Có lỗi xảy ra khi khóa/mở khóa user.');
    }
}

async function handleUpdateCode(event) {
    event.preventDefault();
    const token = localStorage.getItem('access_token');
    const newCode = document.getElementById('new-code').value;
    try {
        const response = await fetch(`${API_BASE_URL}/registration-code`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ new_code: newCode })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) loadCurrentCode();
    } catch (error) {
        console.error('Lỗi khi cập nhật mã đăng ký:', error);
        alert('Có lỗi xảy ra khi cập nhật mã đăng ký.');
    }
}

async function loadCurrentCode() {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        document.getElementById('current-code').textContent = data.registration_code || 'Không có';
    } catch (error) {
        console.error('Lỗi khi tải mã đăng ký hiện tại:', error);
        document.getElementById('current-code').textContent = 'Lỗi tải mã';
    }
}

async function handleChangePassword(event) {
    event.preventDefault();
    const token = localStorage.getItem('access_token');
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) document.getElementById('change-password-form').reset();
    } catch (error) {
        console.error('Lỗi khi thay đổi mật khẩu:', error);
        alert('Có lỗi xảy ra khi thay đổi mật khẩu.');
    }
}

async function loadPendingUsers() {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/pending-users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch pending users');
        const data = await response.json();
        const tableBody = document.getElementById('pending-users-table').querySelector('tbody');
        tableBody.innerHTML = '';
        data.pending_users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>
                    <button onclick="approveUser(${user.id}, true)">Duyệt</button>
                    <button onclick="approveUser(${user.id}, false)">Từ chối</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Lỗi khi tải danh sách user pending:', error);
        alert('Lỗi khi tải danh sách user pending.');
    }
}

async function approveUser(userId, approve) {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ approve })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            loadPendingUsers();
            loadUsers();
        }
    } catch (error) {
        console.error('Lỗi khi duyệt/từ chối user:', error);
        alert('Có lỗi xảy ra khi duyệt/từ chối user.');
    }
}
