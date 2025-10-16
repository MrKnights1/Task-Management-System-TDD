// Task Management System - Frontend
let sessionToken = localStorage.getItem('sessionToken');
let currentUser = null;

const API = {
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }
    return headers;
  },
  async register(name, email) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const data = await res.json();
    sessionToken = data.sessionToken;
    currentUser = data.user;
    localStorage.setItem('sessionToken', sessionToken);
    return data;
  },
  async login(email) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const data = await res.json();
    sessionToken = data.sessionToken;
    currentUser = data.user;
    localStorage.setItem('sessionToken', sessionToken);
    return data;
  },
  async getCurrentUser() {
    const res = await fetch('/api/auth/me', {
      headers: this.getHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  },
  async fetchStats() {
    const res = await fetch('/api/stats', { headers: this.getHeaders() });
    return res.json();
  },
  async fetchTasks() {
    const res = await fetch('/api/tasks', { headers: this.getHeaders() });
    return res.json();
  },
  async createTask(title, priority) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, priority }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },
  async completeTask(taskId) {
    const res = await fetch(`/api/tasks/${taskId}/complete`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
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
  await Promise.all([loadStats(), loadTasks()]);
}

document.getElementById('createTaskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('taskTitle').value;
  const priority = document.getElementById('taskPriority').value;
  try {
    await API.createTask(title, priority);
    e.target.reset();
    await loadAll();
  } catch (error) {
    alert(error.message);
  }
});

// Authentication UI
async function handleAuthSuccess() {
  showApp();
  await loadAll();
}

async function handleAuthError(error) {
  alert(error.message);
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  try {
    await API.register(name, email);
    await handleAuthSuccess();
  } catch (error) {
    handleAuthError(error);
  }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  try {
    await API.login(email);
    await handleAuthSuccess();
  } catch (error) {
    handleAuthError(error);
  }
});

// Tab switching
function switchToTab(activeTab) {
  const tabs = {
    login: {
      tab: document.getElementById('loginTab'),
      container: document.getElementById('loginFormContainer'),
    },
    register: {
      tab: document.getElementById('registerTab'),
      container: document.getElementById('registerFormContainer'),
    },
  };

  Object.keys(tabs).forEach(key => {
    if (key === activeTab) {
      tabs[key].tab.classList.add('active');
      tabs[key].container.style.display = 'block';
    } else {
      tabs[key].tab.classList.remove('active');
      tabs[key].container.style.display = 'none';
    }
  });
}

document.getElementById('loginTab').addEventListener('click', () => switchToTab('login'));
document.getElementById('registerTab').addEventListener('click', () => switchToTab('register'));

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionToken = null;
  currentUser = null;
  localStorage.removeItem('sessionToken');
  showLogin();
});

function showLogin() {
  document.getElementById('loginView').style.display = 'block';
  document.getElementById('appView').style.display = 'none';
}

function showApp() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('appView').style.display = 'block';
  document.getElementById('currentUser').textContent = `Logged in as: ${currentUser.name}`;
}

// Initialize app
async function init() {
  if (sessionToken) {
    currentUser = await API.getCurrentUser();
    if (currentUser) {
      showApp();
      await loadAll();
    } else {
      showLogin();
    }
  } else {
    showLogin();
  }
}

init();
