// app/static/js/edit_course.js
const API_BASE_URL = '/api';

// Hàm hiển thị section tương ứng với menu
function showSection(sectionId) {
    // Ẩn tất cả các sections
    document.querySelectorAll('.main-container .card').forEach(section => {
        section.style.display = 'none';
    });
    // Hiện section được chọn
    const targetSection = document.getElementById(sectionId + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    // Cập nhật trạng thái active của sidebar link
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === sectionId);
    });
}

// Hàm thiết lập Event Listeners cho Sidebar
function setupSidebarEvents(courseId) {
    // Gắn sự kiện cho menu sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            showSection(sectionId);
            // Cần cập nhật lại dữ liệu khi chuyển sang section Assignments để đảm bảo thống kê/bài nộp mới nhất
            if (sectionId === 'assignments') {
                loadAssignments(courseId);
            }
        });
    });

    // Gắn sự kiện toggle sidebar
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const mainContainer = document.getElementById('main-container');
            const isCollapsed = sidebar.classList.toggle('collapsed');
            mainContainer.classList.toggle('full-width');
            sidebarToggle.setAttribute('title', isCollapsed ? 'Mở rộng' : 'Thu gọn');
        });
    }

    // Gắn sự kiện toggle sáng/tối
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeToggle.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            themeToggle.setAttribute('title', isDark ? 'Chế độ sáng' : 'Chế độ tối');
        });

        // Áp dụng theme từ localStorage
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.querySelector('i').className = 'fas fa-sun';
            themeToggle.setAttribute('title', 'Chế độ sáng');
        } else {
            themeToggle.setAttribute('title', 'Chế độ tối');
        }
    }

    // Áp dụng trạng thái sidebar từ localStorage (nếu có)
    const sidebar = document.getElementById('sidebar');
    const mainContainer = document.getElementById('main-container');
    if (sidebar && mainContainer) {
        // Lưu ý: Không lưu trạng thái sidebar trên trang này để luôn hiển thị đầy đủ ban đầu
        // if (localStorage.getItem('sidebar') === 'collapsed') {
        //     sidebar.classList.add('collapsed');
        //     mainContainer.classList.add('full-width');
        //     if (sidebarToggle) sidebarToggle.setAttribute('title', 'Mở rộng');
        // } else {
        //     if (sidebarToggle) sidebarToggle.setAttribute('title', 'Thu gọn');
        // }
    }
}


async function initEditCoursePage(courseId) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('Không tìm thấy token');
        alert('Vui lòng đăng nhập lại');
        window.location.href = '/login';
        return;
    }

    // 1. Thiết lập các sự kiện cho sidebar (Theme, Toggle, Menu)
    setupSidebarEvents(courseId);


    try {
        // 2. Tải thông tin khóa học
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
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

        console.log('Dữ liệu khóa học:', data);
        // Cập nhật thông tin khóa học
        const courseIdDisplay = document.getElementById('course-id-display');
        const courseTitle = document.getElementById('course-title');
        const courseDescription = document.getElementById('course-description');
        const isPublic = document.getElementById('is-public');
        const createdAtDisplay = document.getElementById('created-at-display');

        if (courseIdDisplay && courseTitle && courseDescription && isPublic && createdAtDisplay) {
            courseIdDisplay.textContent = courseId;
            courseTitle.value = data.title || '';
            courseDescription.value = data.description || '';
            isPublic.checked = data.is_public || false;
            createdAtDisplay.textContent = data.created_at || 'N/A';
        } else {
            console.error('Không tìm thấy một hoặc nhiều phần tử DOM');
            alert('Lỗi giao diện: Không tìm thấy các phần tử cần thiết');
            return;
        }

        // 3. Tải các danh sách (tất cả chỉ cần load, chỉ có section đầu tiên là hiện)
        await Promise.all([
            loadMaterials(courseId),
            loadPendingStudents(courseId, data.is_public),
            loadActiveStudents(courseId),
            loadAssignments(courseId)
        ]);

        // 4. Hiển thị section mặc định (Thông tin Khóa học)
        showSection('edit-course');

    } catch (err) {
        console.error('Lỗi khởi tạo trang:', err);
        alert('Lỗi kết nối khi tải thông tin khóa học');
        window.location.href = '/teacher/dashboard';
    }

    // 5. Gắn các Event cho Form và Buttons (Giữ nguyên)

    // Event cho form sửa khóa học
    const editForm = document.getElementById('edit-course-form');
    if (editForm) {
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = document.getElementById('course-title').value;
            const description = document.getElementById('course-description').value;
            const is_public = document.getElementById('is-public').checked;
            try {
                const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, description, is_public })
                });
                const data = await response.json();
                alert(data.message);
                if (response.ok) {
                    document.getElementById('message-container').textContent = data.message;
                    setTimeout(() => {
                        document.getElementById('message-container').textContent = '';
                    }, 3000);
                    // Sau khi cập nhật, cần tải lại pending students vì trạng thái is_public có thể thay đổi
                    loadPendingStudents(courseId, is_public);
                }
            } catch (err) {
                console.error('Lỗi cập nhật khóa học:', err);
                alert('Lỗi kết nối khi cập nhật khóa học');
            }
        });
    }

    // Event cho xóa khóa học
    const deleteBtn = document.getElementById('delete-course-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
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

    // Event cho tạo tài liệu
    const materialForm = document.getElementById('create-material-form');
    if (materialForm) {
        materialForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = document.getElementById('material-title').value;
            const content = document.getElementById('material-content').value;
            try {
                const response = await fetch(`${API_BASE_URL}/materials/${courseId}`, {
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

    // Event cho tạo bài tập
    const assignmentForm = document.getElementById('create-assignment-form');
    if (assignmentForm) {
        assignmentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = document.getElementById('assignment-title').value;
            const description = document.getElementById('assignment-description').value;
            const deadline = document.getElementById('assignment-deadline').value;
            const max_score = parseFloat(document.getElementById('assignment-max-score').value);
            try {
                const response = await fetch(`${API_BASE_URL}/assignments/${courseId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, description, deadline, max_score })
                });
                const data = await response.json();
                alert(data.message);
                if (response.ok) {
                    document.getElementById('create-assignment-form').reset();
                    loadAssignments(courseId);
                }
            } catch (err) {
                console.error('Lỗi tạo bài tập:', err);
                alert('Lỗi kết nối khi tạo bài tập');
            }
        });
    }
}

// Giữ nguyên các hàm loadMaterials, editMaterial, deleteMaterial, loadPendingStudents, loadActiveStudents, 
// handleEnrollmentAction, teacherUnenroll, loadAssignments, editAssignment, deleteAssignment, 
// loadSubmissions, gradeSubmission như file cũ.
// ... (Các hàm này đã được định nghĩa trong file edit_course.js cũ) ...

async function loadMaterials(courseId) {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/materials/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Lỗi tải tài liệu:', data.message);
            // alert(`Lỗi tải tài liệu: ${data.message}`); // Bỏ alert để tránh làm gián đoạn lúc load
            return;
        }
        console.log('Dữ liệu tài liệu:', data);
        const tbody = document.querySelector('#materials-table tbody');
        if (!tbody) {
            console.error('Không tìm thấy bảng tài liệu');
            return;
        }
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
                <td style="white-space: pre-wrap; word-wrap: break-word;">${m.content || 'N/A'}</td>
                <td>${m.created_at}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editMaterial(${m.id}, ${courseId}, '${m.title.replace(/'/g, "\\'")}', '${m.content ? m.content.replace(/'/g, "\\'") : ''}')">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMaterial(${m.id}, ${courseId})">Xóa</button>
                </td>
            `;
        });
    } catch (err) {
        console.error('Lỗi tải tài liệu:', err);
        // alert('Lỗi kết nối khi tải tài liệu'); // Bỏ alert để tránh làm gián đoạn lúc load
    }
}

async function editMaterial(materialId, courseId, title, content) {
    // Mở modal
    const modal = document.getElementById("editMaterialModal");
    modal.style.display = "flex";

    // Gán dữ liệu vào form
    document.getElementById("edit-material-id").value = materialId;
    document.getElementById("edit-material-course-id").value = courseId;
    document.getElementById("edit-material-title").value = title;
    document.getElementById("edit-material-content").value = content || "";
}
document.getElementById("edit-material-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-material-id").value;
    const courseId = document.getElementById("edit-material-course-id").value;
    const title = document.getElementById("edit-material-title").value;
    const content = document.getElementById("edit-material-content").value;
    const token = localStorage.getItem("access_token");

    try {
        const res = await fetch(`/api/materials/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ title, content }),
        });
        const data = await res.json();
        alert(data.message);
        if (res.ok) {
            document.getElementById("editMaterialModal").style.display = "none";
            loadMaterials(courseId);
        }
    } catch (err) {
        alert("Lỗi khi cập nhật tài liệu");
    }
});

async function loadPendingStudents(courseId, isPublic) {
    console.log(`Load pending students for course ${courseId}, isPublic: ${isPublic}`);
    const pendingSection = document.getElementById('pending-students-section');
    if (isPublic) {
        console.log('Khóa học công khai, ẩn section pending');
        if (pendingSection) pendingSection.style.display = 'none';
        return;
    }
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Dữ liệu pending:', data);
        if (!response.ok) {
            console.error('Lỗi tải danh sách pending:', data.message);
            // alert(`Lỗi tải danh sách sinh viên đợi duyệt: ${data.message}`); // Bỏ alert để tránh làm gián đoạn lúc load
            if (pendingSection) pendingSection.style.display = 'none';
            return;
        }
        const tbody = document.querySelector('#pending-students-table tbody');
        if (!tbody) {
            console.error('Không tìm thấy bảng pending students');
            return;
        }
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
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
        if (pendingSection) pendingSection.style.display = 'block'; // Sẽ bị ẩn bởi showSection nếu không phải là section hiện tại
    } catch (err) {
        console.error('Lỗi tải danh sách pending:', err);
        // alert('Lỗi kết nối khi tải danh sách sinh viên đợi duyệt'); // Bỏ alert
    }
}

async function loadActiveStudents(courseId) {
    console.log(`Load active students for course ${courseId}`);
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enrolled-students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Dữ liệu active:', data);
        if (!response.ok) {
            console.error('Lỗi tải danh sách active:', data.message);
            // alert(`Lỗi tải danh sách sinh viên tham gia: ${data.message}`); // Bỏ alert
            return;
        }
        const tbody = document.querySelector('#active-students-table tbody');
        if (!tbody) {
            console.error('Không tìm thấy bảng active students');
            return;
        }
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
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
        // alert('Lỗi kết nối khi tải danh sách sinh viên tham gia'); // Bỏ alert
    }
}

async function handleEnrollmentAction(enrollmentId, action, courseId) {
    console.log(`Xử lý enrollment ${enrollmentId}, action: ${action}`);
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/courses/enrollments/${enrollmentId}/${action}`, {
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
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/courses/enrollments/${enrollmentId}/unenroll`, {
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

async function loadAssignments(courseId) {
    console.log(`Load assignments for course ${courseId}`);
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Dữ liệu bài tập:', data);
        if (!response.ok) {
            console.error('Lỗi tải bài tập:', data.message);
            // alert(`Lỗi tải bài tập: ${data.message}`); // Bỏ alert
            return;
        }
        const tbody = document.querySelector('#assignments-table tbody');
        const submissionsTbody = document.querySelector('#submissions-table tbody'); // Reset submissions table
        if (!tbody || !submissionsTbody) {
            console.error('Không tìm thấy bảng bài tập hoặc bài nộp');
            // alert('Lỗi giao diện: Không tìm thấy bảng bài tập');
            return;
        }
        tbody.innerHTML = '';
        submissionsTbody.innerHTML = '<tr><td colspan="6">Chọn bài tập để xem bài nộp.</td></tr>'; // Thiết lập nội dung mặc định

        if (!data.assignments || data.assignments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Không có bài tập nào.</td></tr>';
            return;
        }
        for (const a of data.assignments) {
            let stats = { average: 0, max: 0, min: 0, count: 0 };
            try {
                const statsResponse = await fetch(`${API_BASE_URL}/assignments/${a.id}/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (statsResponse.ok) {
                    stats = await statsResponse.json();
                    console.log(`Thống kê bài tập ${a.id}:`, stats);
                } else {
                    console.error(`Lỗi tải thống kê bài tập ${a.id}:`, await statsResponse.json());
                }
            } catch (err) {
                console.error(`Lỗi tải thống kê bài tập ${a.id}:`, err);
            }
            const row = tbody.insertRow();
            // Xử lý chuỗi description và title để tránh lỗi trong onclick
            const assignmentTitle = a.title.replace(/'/g, "\\'");
            const assignmentDescription = (a.description || '').replace(/'/g, "\\'");

            row.innerHTML = `
                <td>${a.id}</td>
                <td>${a.title}</td>
                <td style="white-space: pre-wrap; word-wrap: break-word;">${a.description || 'N/A'}</td>
                <td>${a.deadline || 'Không có'}</td>
                <td>${a.max_score}</td>
                <td class="stats">TB: ${stats.average.toFixed(2)}, Cao: ${stats.max}, Thấp: ${stats.min}, Số bài: ${stats.count}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editAssignment(${a.id}, ${courseId}, '${assignmentTitle}', '${assignmentDescription}', '${a.deadline || ''}', ${a.max_score})">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${a.id}, ${courseId})">Xóa</button>
                    <button class="btn btn-sm btn-info" onclick="loadSubmissions(${a.id}, ${courseId})">Xem bài nộp</button>
                </td>
            `;
        }
    } catch (err) {
        console.error('Lỗi tải bài tập:', err);
        // alert('Lỗi kết nối khi tải bài tập'); // Bỏ alert
    }
}

async function editAssignment(id, courseId, title, description, deadline, max_score) {
    const modal = document.getElementById("editAssignmentModal");
    modal.style.display = "flex";

    document.getElementById("edit-assignment-id").value = id;
    document.getElementById("edit-assignment-course-id").value = courseId;
    document.getElementById("edit-assignment-title").value = title;
    document.getElementById("edit-assignment-description").value = description || "";
    document.getElementById("edit-assignment-deadline").value =
        deadline && deadline.includes("T") ? deadline : new Date(deadline).toISOString().slice(0, 16);
    document.getElementById("edit-assignment-max-score").value = max_score;
}

// Submit form sửa bài tập
document.getElementById("edit-assignment-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-assignment-id").value;
    const courseId = document.getElementById("edit-assignment-course-id").value;
    const title = document.getElementById("edit-assignment-title").value;
    const description = document.getElementById("edit-assignment-description").value;
    const deadline = document.getElementById("edit-assignment-deadline").value;
    const max_score = parseFloat(document.getElementById("edit-assignment-max-score").value);
    const token = localStorage.getItem("access_token");

    try {
        const res = await fetch(`/api/assignments/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ title, description, deadline: deadline || null, max_score }),
        });
        const data = await res.json();
        alert(data.message);
        if (res.ok) {
            document.getElementById("editAssignmentModal").style.display = "none";
            loadAssignments(courseId);
        }
    } catch {
        alert("Lỗi khi cập nhật bài tập");
    }
});

async function deleteAssignment(assignmentId, courseId) {
    if (confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            alert(data.message);
            if (response.ok) {
                loadAssignments(courseId);
            }
        } catch (err) {
            console.error('Lỗi xóa bài tập:', err);
            alert('Lỗi kết nối khi xóa bài tập');
        }
    }
}

async function loadSubmissions(assignmentId, courseId) {
    console.log(`Load submissions for assignment ${assignmentId}`);
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Dữ liệu bài nộp:', data);
        if (!response.ok) {
            console.error('Lỗi tải bài nộp:', data.message);
            alert(`Lỗi tải bài nộp: ${data.message}`);
            return;
        }
        const tbody = document.querySelector('#submissions-table tbody');
        if (!tbody) {
            console.error('Không tìm thấy bảng bài nộp');
            alert('Lỗi giao diện: Không tìm thấy bảng bài nộp');
            return;
        }
        tbody.innerHTML = '';
        if (!data.submissions || data.submissions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Không có bài nộp nào cho bài tập này.</td></tr>';
            return;
        }
        data.submissions.forEach(s => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${s.id}</td>
                <td>${s.student_username}</td>
                <td style="white-space: pre-wrap; word-wrap: break-word;">${s.content ? `<a href="${s.content}" target="_blank">${s.content}</a>` : 'N/A'}</td>
                <td>${s.score !== null ? s.score : 'Chưa chấm'}</td>
                <td>${s.submitted_at}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="gradeSubmission(${s.id}, ${courseId}, ${assignmentId})">Chấm điểm</button>
                </td>
            `;
        });
    } catch (err) {
        console.error('Lỗi tải bài nộp:', err);
        alert('Lỗi kết nối khi tải bài nộp');
    }
}

// ====== CHẤM ĐIỂM (SỬA LẠI) ======
async function gradeSubmission(submissionId, courseId, assignmentId) {
    console.log(`Bắt đầu chấm điểm cho submission ${submissionId}`);

    const token = localStorage.getItem("access_token");
    if (!token) {
        alert("Vui lòng đăng nhập lại");
        window.location.href = "/login";
        return;
    }

    try {
        // ✅ Gọi API có header Authorization
        const res = await fetch(`/api/assignments/${assignmentId}/submissions`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
            alert(`Lỗi tải bài nộp: ${data.message}`);
            return;
        }

        const submission = data.submissions.find(s => s.id === submissionId);
        if (!submission) {
            alert("Không tìm thấy bài nộp.");
            return;
        }

        // Hiện modal và gán dữ liệu
        const modal = document.getElementById("gradeSubmissionModal");
        modal.style.display = "flex";

        document.getElementById("grade-submission-id").value = submissionId;
        document.getElementById("grade-submission-course-id").value = courseId;
        document.getElementById("grade-assignment-id").value = assignmentId;
        document.getElementById("grade-student-username").textContent = submission.student_username;
        document.getElementById("grade-submission-content").href = submission.content;
        document.getElementById("grade-submission-content").textContent = submission.content;
        document.getElementById("grade-input").value = submission.score ?? "";
    } catch (err) {
        console.error("Lỗi khi tải bài nộp:", err);
        alert("Không thể tải dữ liệu bài nộp.");
    }
}

const exportBtn = document.getElementById('exportGradesBtn');
if (exportBtn) {
  exportBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('access_token');
    // Lấy courseId từ URL hoặc DOM
    const pathParts = window.location.pathname.split('/');
    const courseId = pathParts[pathParts.length - 1];

    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/export-grades`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || 'Không thể xuất bảng điểm');
        return;
      }

      // Nhận blob và tải file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `course_${courseId}_grades.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi khi xuất bảng điểm:', err);
      alert('Lỗi kết nối khi xuất bảng điểm.');
    }
  });
}
