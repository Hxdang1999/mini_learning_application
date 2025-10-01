// app/static/js/logout.js

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username'); // Xóa cả username
    window.location.href = '/login'; // Chuyển hướng đến route Flask
}