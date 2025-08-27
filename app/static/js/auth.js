document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Ngăn chặn form gửi đi theo cách mặc định
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            // Lưu JWT và vai trò vào localStorage
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_role', data.role);
            
            // Chuyển hướng đến dashboard phù hợp với vai trò
            if (data.role === 'teacher') {
                window.location.href = '/teacher/dashboard';
            } else {
                window.location.href = '/student/dashboard';
            }
        } else {
            // Hiển thị lỗi từ server
            alert('Đăng nhập thất bại: ' + data.message);
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại.');
    }
});