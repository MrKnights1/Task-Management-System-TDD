// Task Management System - Frontend
const API = {
  async fetchStats() {
    const res = await fetch('/api/stats');
    return res.json();
  },
  async fetchUsers() {
    const res = await fetch('/api/users');
    return res.json();
  },
  async createUser(name, email) {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    return res.json();
  },
  async fetchTasks() {
    const res = await fetch('/api/tasks');
    return res.json();
  },
  async createTask(userId, title, priority) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: parseInt(userId), title, priority }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },
  async completeTask(taskId) {
    const res = await fetch(`/api/tasks/${taskId}/complete`, { method: 'PUT' });
    return res.json();
  },
};

async function loadStats() {
  const stats = await API.fetchStats();
  document.getElementById('stats').innerHTML = `
    <div class="stat">Users: ${stats.totalUsers}</div>
    <div class="stat">Tasks: ${stats.totalTasks}</div>
    <div class="stat">Active: ${stats.activeTasks}</div>
    <div class="stat">Completed: ${stats.completedTasks}</div>
  `;
}

async function loadUsers() {
  const users = await API.fetchUsers();
  const usersList = document.getElementById('usersList');
  const userSelect = document.getElementById('taskUserId');

  usersList.innerHTML = users.map(u => `
    <div class="user">
      <div><strong>${u.name}</strong></div>
      <div>${u.email} (${u.tasks.length} active tasks)</div>
    </div>
  `).join('');

  userSelect.innerHTML = '<option value="">Select User</option>' +
    users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
}

async function loadTasks() {
  const tasks = await API.fetchTasks();
  document.getElementById('tasksList').innerHTML = tasks.map(t => `
    <div class="task priority-${t.priority}">
      <div><strong>${t.title}</strong> - ${t.priority} priority</div>
      <div>Assigned to: ${t.user.name} | Status: ${t.status}</div>
      ${t.status === 'ACTIVE' ? `
        <div class="task-actions">
          <button class="btn-sm" onclick="completeTask(${t.id})">Complete</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

async function completeTask(id) {
  await API.completeTask(id);
  await loadAll();
}

async function loadAll() {
  await Promise.all([loadStats(), loadUsers(), loadTasks()]);
}

document.getElementById('createUserForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('userName').value;
  const email = document.getElementById('userEmail').value;
  await API.createUser(name, email);
  e.target.reset();
  await loadAll();
});

document.getElementById('createTaskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('taskTitle').value;
  const userId = document.getElementById('taskUserId').value;
  const priority = document.getElementById('taskPriority').value;
  try {
    await API.createTask(userId, title, priority);
    e.target.reset();
    await loadAll();
  } catch (error) {
    alert(error.message);
  }
});

loadAll();
