/* ============================================
 PokéTasks ✨ - JavaScript Completo
 ============================================ */

// ============================================
// 🎯 REFERENCIAS DOM
// ============================================
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const filterBtns = document.querySelectorAll('.filter-btn');

// ============================================
// 📦 ESTADO GLOBAL
// ============================================
let tasks = JSON.parse(localStorage.getItem('poketasks')) || [];
let currentFilter = 'all';

// ============================================
// 🌌 FONDO: ESTRELLAS FUGACES
// ============================================
function createShootingStars() {
 const container = document.getElementById('shootingStarsContainer');
 if (!container) return;

 for (let i = 0; i < 4; i++) {
 const star = document.createElement('div');
 star.className = 'shooting-star';
 star.style.left = `${Math.random() * 100}%`;
 star.style.top = `${Math.random() * 40}%`;
 star.style.animationDuration = `${2 + Math.random() * 3}s`;
 star.style.animationDelay = `${Math.random() * 8}s`;
 container.appendChild(star);
 }
}

// ============================================
// ✨ FONDO: PARTÍCULAS FLOTANTES
// ============================================
function createParticles() {
 const container = document.getElementById('starsContainer');
 if (!container) return;

 const colors = '#00f5ff', '#ff00e6', '#ffe600', '#ff6b6b', '#48dbfb';

 for (let i = 0; i < 50; i++) {
 const particle = document.createElement('div');
 particle.className = 'particle';
 const size = 2 + Math.random() * 5;
 particle.style.width = `${size}px`;
 particle.style.height = `${size}px`;
 particle.style.left = `${Math.random() * 100}%`;
 particle.style.background = colors Math.floor(Math.random() * colors.length);
 particle.style.boxShadow = `0 0 ${size * 2}px ${particle.style.background}`;
 particle.style.animationDuration = `${8 + Math.random() * 15}s`;
 particle.style.animationDelay = `${Math.random() * 12}s`;
 container.appendChild(particle);
 }
}

// ============================================
// 💾 LOCAL STORAGE
// ============================================
function saveTasks() {
 localStorage.setItem('poketasks', JSON.stringify(tasks));
}

// ============================================
// 🖼️ RENDERIZAR TAREAS
// ============================================
function renderTasks() {
 taskList.innerHTML = '';

 let filteredTasks = tasks;
 if (currentFilter === 'pending') {
 filteredTasks = tasks.filter(t =>!t.completed);
 } else if (currentFilter === 'completed') {
 filteredTasks = tasks.filter(t => t.completed);
 }

 if (filteredTasks.length === 0) {
 const emptyMsg = document.createElement('li');
 emptyMsg.className = 'task-item';
 emptyMsg.style.justifyContent = 'center';
 emptyMsg.style.color = 'var(--text-secondary)';
 emptyMsg.style.fontStyle = 'italic';
 emptyMsg.textContent = currentFilter === 'all'
? '🌀 No hay tareas... ¡agrega una!'
: currentFilter === 'pending'
? '🎉 ¡Todas las tareas están completadas!'
: '📭 No hay tareas completadas aún.';
 taskList.appendChild(emptyMsg);
 } else {
 filteredTasks.forEach((task, index) => {
 const li = document.createElement('li');
 li.className = `task-item ${task.completed? 'completed': ''}`;

 // Checkbox
 const checkbox = document.createElement('input');
 checkbox.type = 'checkbox';
 checkbox.className = 'task-checkbox';
 checkbox.checked = task.completed;
 checkbox.addEventListener('change', () => toggleTask(task.id));

 // Texto
 const span = document.createElement('span');
 span.className = 'task-text';
 span.textContent = task.text;

 // Botón eliminar
 const deleteBtn = document.createElement('button');
 deleteBtn.className = 'task-delete';
 deleteBtn.textContent = '✖';
 deleteBtn.addEventListener('click', () => deleteTask(task.id));

 li.appendChild(checkbox);
 li.appendChild(span);
 li.appendChild(deleteBtn);
 taskList.appendChild(li);
 });
 }

 updateStats();
}

// ============================================
// 📊 ACTUALIZAR ESTADÍSTICAS
// ============================================
function updateStats() {
 const total = tasks.length;
 const completed = tasks.filter(t => t.completed).length;
 totalTasksSpan.textContent = `Total: ${total}`;
 completedTasksSpan.textContent = `Completadas: ${completed}`;
}

// ============================================
// ➕ AGREGAR TAREA
// ============================================
function addTask(text) {
 const newTask = {
 id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
 text: text.trim(),
 completed: false,
 createdAt: new Date().toISOString()
 };

 tasks.unshift(newTask);
 saveTasks();
 renderTasks();
}

// ============================================
// ✅ TOGGLE TAREA
// ============================================
function toggleTask(id) {
 const task = tasks.find(t => t.id === id);
 if (task) {
 task.completed =!task.completed;
 saveTasks();
 renderTasks();
 }
}

// ============================================
// 🗑️ ELIMINAR TAREA
// ============================================
function deleteTask(id) {
 tasks = tasks.filter(t => t.id!== id);
 saveTasks();
 renderTasks();
}

// ============================================
// 🔍 CAMBIAR FILTRO
// ============================================
function setFilter(filter) {
 currentFilter = filter;
 filterBtns.forEach(btn => {
 btn.classList.toggle('active', btn.dataset.filter === filter);
 });
 renderTasks();
}

// ============================================
// 🎧 EVENTOS
// ============================================

// Formulario
taskForm.addEventListener('submit', (e) => {
 e.preventDefault();
 const text = taskInput.value.trim();
 if (text) {
 addTask(text);
 taskInput.value = '';
 taskInput.focus();
 }
});

// Filtros
filterBtns.forEach(btn => {
 btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// ============================================
// 🚀 INICIALIZACIÓN
// ============================================
createShootingStars();
createParticles();
renderTasks();