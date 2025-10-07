const API_BASE_URL = '/api';

function showSection(sectionId) {
  document.querySelectorAll('.main-container .card').forEach(c => c.style.display = 'none');
  const section = document.getElementById(sectionId + '-section');
  if (section) section.style.display = 'block';
  document.querySelectorAll('.sidebar-link').forEach(l =>
    l.classList.toggle('active', l.dataset.section === sectionId)
  );
}

function setupSidebarEvents(courseId) {
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const sectionId = link.dataset.section;
      showSection(sectionId);
      if (sectionId === 'materials') loadMaterials(courseId);
      if (sectionId === 'assignments') loadAssignments(courseId);
    });
  });

  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main-container');
  sidebarToggle.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('collapsed');
    main.classList.toggle('full-width', collapsed);
  });
}

// 🌙 Bật/tắt chế độ tối
function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  });
  const current = localStorage.getItem('theme');
  if (current === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.querySelector('i').className = 'fas fa-sun';
  }
}

async function initCourseDetailPage(courseId) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    alert('Vui lòng đăng nhập lại');
    return (window.location.href = '/login');
  }

  setupSidebarEvents(courseId);
  setupThemeToggle();

  const res = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) return alert('Lỗi tải khóa học');

  document.getElementById('course-id-display').textContent = courseId;
  document.getElementById('course-title').textContent = data.title || 'N/A';
  document.getElementById('course-description').textContent = data.description || 'Không có mô tả';
  document.getElementById('is-public').textContent = data.is_public ? 'Công khai' : 'Riêng tư';
  document.getElementById('created-at').textContent = data.created_at || 'N/A';

  await loadMaterials(courseId);
  await loadAssignments(courseId);
  showSection('course-info');
}

async function loadMaterials(courseId) {
  const token = localStorage.getItem('access_token');
  const tbody = document.querySelector('#materials-table tbody');
  tbody.innerHTML = '<tr><td colspan="4">Đang tải...</td></tr>';
  try {
    const res = await fetch(`${API_BASE_URL}/materials/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    tbody.innerHTML = '';
    if (!data.materials?.length)
      return (tbody.innerHTML = '<tr><td colspan="4">Không có tài liệu.</td></tr>');

    data.materials.forEach(m => {
      const content = m.content?.startsWith('http')
        ? `<a href="${m.content}" target="_blank">${m.content}</a>`
        : m.content || 'N/A';
      const tr = tbody.insertRow();
      tr.innerHTML = `<td>${m.id}</td><td>${m.title}</td><td>${content}</td><td>${m.created_at}</td>`;
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="4">Lỗi tải tài liệu.</td></tr>';
  }
}

async function loadAssignments(courseId) {
  const token = localStorage.getItem('access_token');
  const tbody = document.querySelector('#assignments-table tbody');
  tbody.innerHTML = '<tr><td colspan="7">Đang tải...</td></tr>';
  try {
    const res = await fetch(`${API_BASE_URL}/assignments/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    tbody.innerHTML = '';
    if (!data.assignments?.length)
      return (tbody.innerHTML = '<tr><td colspan="7">Không có bài tập.</td></tr>');

    for (const a of data.assignments) {
      const subRes = await fetch(`${API_BASE_URL}/assignments/${a.id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const subData = await subRes.json();
      const submission = subData.submissions && subData.submissions[0];
      const status = submission
        ? (submission.score !== null ? `Đã chấm: ${submission.score}` : 'Đã nộp, chưa chấm')
        : 'Chưa nộp';
      const btn = `<button class="btn btn-sm btn-${submission ? 'info' : 'primary'}" onclick="openSubmitModal(${a.id}, ${courseId})">${submission ? 'Nộp lại' : 'Nộp bài'}</button>`;
      tbody.insertRow().innerHTML = `
        <td>${a.id}</td><td>${a.title}</td><td>${a.description || ''}</td>
        <td>${a.deadline || 'Không có'}</td><td>${a.max_score}</td>
        <td>${status}</td><td>${btn}</td>`;
    }
  } catch {
    tbody.innerHTML = '<tr><td colspan="7">Lỗi tải bài tập.</td></tr>';
  }
}

// ==== Modal xử lý nộp bài ====
const modal = document.getElementById('submitModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelModal');
const submitForm = document.getElementById('submitForm');

function openSubmitModal(assignmentId, courseId) {
  modal.style.display = 'flex';
  document.getElementById('submitAssignmentId').value = assignmentId;
  submitForm.onsubmit = e => {
    e.preventDefault();
    submitAssignment(courseId);
  };
}

[closeModalBtn, cancelBtn].forEach(b => b.addEventListener('click', () => (modal.style.display = 'none')));

async function submitAssignment(courseId) {
  const token = localStorage.getItem('access_token');
  const assignmentId = document.getElementById('submitAssignmentId').value;
  const content = document.getElementById('submitContent').value.trim();
  if (!content) return alert('Vui lòng nhập nội dung hoặc link.');

  try {
    const res = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });

    const data = await res.json();

    if (res.status === 403 && data.message?.toLowerCase().includes('late')) {
      alert('⏰ Bạn đã nộp TRỄ HẠN, vui lòng liên hệ giảng viên!');
      return;
    }
    
    if (!res.ok) {
      alert(data.message || 'Không thể nộp bài.');
      return;
    }

    alert(data.message || 'Nộp bài thành công!');
    modal.style.display = 'none';
    document.getElementById('submitContent').value = '';
    loadAssignments(courseId);
  } catch (error) {
    console.error('Lỗi khi nộp bài:', error);
    alert('Lỗi kết nối khi nộp bài.');
  }
}
