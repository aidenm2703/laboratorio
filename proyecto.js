const $ = (selector) => document.querySelector(selector);
const taskForm = $('#taskForm');
const taskInput = $('#taskInput');
const priorityInput = $('#priorityInput');
const durationInput = $('#durationInput');
const taskList = $('#taskList');
const totalTasksSpan = $('#totalTasks');
const completedTasksSpan = $('#completedTasks');
const filterBtns = document.querySelectorAll('.filter-btn');
const progressBar = $('#progressBar');
const progressPercentage = $('#progressPercentage');
const progressLabel = $('#progressLabel');
const progressTrack = $('.progress-track');
const streakDays = $('#streakDays');
const weeklyAchievement = $('#weeklyAchievement');
const weeklyChart = $('#weeklyChart');
const successModal = $('#successModal');

let tasks = loadTasks();
let completionDays = loadDays();
let currentFilter = 'all';
let draggedId = null;

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem('poketasks'));
    return Array.isArray(saved) ? saved.map(task => {
      const wasRunning = Boolean(task.timerRunning && task.timerEnds);
      const remaining = wasRunning ? Math.max(0, Math.ceil((task.timerEnds - Date.now()) / 1000)) : task.remainingSeconds ?? null;
      return { ...task, priority: task.priority || 'medium', remainingSeconds: remaining, timerRunning: wasRunning && remaining > 0, timerEnds: wasRunning && remaining > 0 ? task.timerEnds : null };
    }) : [];
  } catch { return []; }
}
function loadDays() { try { const saved = JSON.parse(localStorage.getItem('poketasks-completion-days')); return Array.isArray(saved) ? saved : []; } catch { return []; } }
function saveTasks() { localStorage.setItem('poketasks', JSON.stringify(tasks)); }
function saveDays() { localStorage.setItem('poketasks-completion-days', JSON.stringify(completionDays)); }
function dayKey(date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala' }).format(date); }

function playBattleSound() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    [262, 330, 392].forEach((frequency, index) => {
      const oscillator = context.createOscillator(), gain = context.createGain(), start = context.currentTime + index * .075;
      oscillator.type = 'square'; oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(.035, start); gain.gain.exponentialRampToValueAtTime(.001, start + .13);
      oscillator.connect(gain).connect(context.destination); oscillator.start(start); oscillator.stop(start + .14);
    });
  } catch {}
}
function createShootingStars() { const c = $('#shootingStarsContainer'); for (let i = 0; c && i < 4; i++) { const s = document.createElement('div'); s.className = 'shooting-star'; s.style.left = `${Math.random() * 100}%`; s.style.top = `${Math.random() * 40}%`; s.style.animationDuration = `${3 + Math.random() * 3}s`; s.style.animationDelay = `${Math.random() * 7}s`; c.appendChild(s); } }
function createParticles() { const c = $('#starsContainer'), colors = ['#00f5ff', '#ff00e6', '#ffe600', '#ff6b6b', '#48dbfb']; for (let i = 0; c && i < 45; i++) { const p = document.createElement('div'), size = 2 + Math.random() * 4; p.className = 'particle'; p.style.width = p.style.height = `${size}px`; p.style.left = `${Math.random() * 100}%`; p.style.background = colors[Math.floor(Math.random() * colors.length)]; p.style.boxShadow = `0 0 ${size * 2}px ${p.style.background}`; p.style.animationDuration = `${9 + Math.random() * 12}s`; p.style.animationDelay = `${Math.random() * 10}s`; c.appendChild(p); } }

function visibleTasks() { return currentFilter === 'pending' ? tasks.filter(t => !t.completed) : currentFilter === 'completed' ? tasks.filter(t => t.completed) : tasks; }
function renderTasks() {
  taskList.replaceChildren(); const shown = visibleTasks();
  if (!shown.length) { const message = document.createElement('li'); message.className = 'task-item empty-state'; message.textContent = currentFilter === 'all' ? 'No hay tareas... ¡agrega una!' : currentFilter === 'pending' ? '¡Todas las tareas están completadas!' : 'No hay tareas completadas aún.'; taskList.appendChild(message); }
  else shown.forEach(task => taskList.appendChild(createTaskElement(task)));
  updateDashboard();
}
function createTaskElement(task) {
  const item = document.createElement('li'), handle = document.createElement('span'), checkbox = document.createElement('input'), text = document.createElement('span'), badge = document.createElement('span'), timer = document.createElement('div'), edit = document.createElement('button'), remove = document.createElement('button');
  item.className = `task-item${task.completed ? ' completed' : ''}`; item.draggable = true; item.dataset.id = task.id;
  item.addEventListener('dragstart', onDragStart); item.addEventListener('dragover', event => event.preventDefault()); item.addEventListener('drop', onDrop); item.addEventListener('dragend', () => item.classList.remove('dragging'));
  handle.className = 'drag-handle'; handle.textContent = '⋮⋮'; handle.title = 'Arrastra para ordenar';
  checkbox.type = 'checkbox'; checkbox.className = 'task-checkbox pokeball-checkbox'; checkbox.checked = task.completed; checkbox.setAttribute('aria-label', `Marcar ${task.text} como completada`); checkbox.addEventListener('change', () => toggleTask(task.id));
  text.className = 'task-text'; text.textContent = task.text;
  badge.className = `priority priority-${task.priority}`; badge.textContent = { high: 'Alta', medium: 'Media', low: 'Baja' }[task.priority];
  if (task.remainingSeconds !== null) { timer.className = 'task-timer'; timer.innerHTML = `<span class="timer-value">${formatTime(remainingFor(task))}</span>`; const button = document.createElement('button'); button.type = 'button'; button.className = 'timer-button'; button.textContent = task.timerRunning ? 'Pausa' : remainingFor(task) ? 'Iniciar' : 'Finalizó'; button.disabled = !remainingFor(task); button.addEventListener('click', () => toggleTimer(task.id)); timer.appendChild(button); }
  edit.className = 'task-edit'; edit.type = 'button'; edit.textContent = '✎'; edit.title = 'Editar tarea'; edit.addEventListener('click', () => editTask(task.id));
  remove.className = 'task-delete'; remove.type = 'button'; remove.textContent = '×'; remove.title = 'Eliminar tarea'; remove.addEventListener('click', () => deleteTask(task.id, item));
  item.append(handle, checkbox, text, badge, timer, edit, remove); return item;
}
function onDragStart(event) { draggedId = event.currentTarget.dataset.id; event.currentTarget.classList.add('dragging'); event.dataTransfer.effectAllowed = 'move'; }
function onDrop(event) { event.preventDefault(); const targetId = event.currentTarget.dataset.id; if (!draggedId || draggedId === targetId) return; const from = tasks.findIndex(t => t.id === draggedId), to = tasks.findIndex(t => t.id === targetId); tasks.splice(to, 0, tasks.splice(from, 1)[0]); saveTasks(); renderTasks(); }
function remainingFor(task) { return task.timerRunning && task.timerEnds ? Math.max(0, Math.ceil((task.timerEnds - Date.now()) / 1000)) : task.remainingSeconds || 0; }
function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function toggleTimer(id) { const task = tasks.find(t => t.id === id); if (!task) return; const remaining = remainingFor(task); if (task.timerRunning) { task.remainingSeconds = remaining; task.timerRunning = false; task.timerEnds = null; } else if (remaining) { task.timerRunning = true; task.timerEnds = Date.now() + remaining * 1000; } saveTasks(); renderTasks(); }
function tickTimers() { let changed = false; tasks.forEach(task => { if (task.timerRunning && remainingFor(task) === 0) { task.remainingSeconds = 0; task.timerRunning = false; task.timerEnds = null; changed = true; } }); if (changed) saveTasks(); document.querySelectorAll('.task-item[data-id]').forEach(item => { const task = tasks.find(t => t.id === item.dataset.id), value = item.querySelector('.timer-value'), button = item.querySelector('.timer-button'); if (task && value) { const remaining = remainingFor(task); value.textContent = formatTime(remaining); if (button) { button.textContent = task.timerRunning ? 'Pausa' : remaining ? 'Iniciar' : 'Finalizó'; button.disabled = !remaining; } } }); }

function updateDashboard() {
  const total = tasks.length, done = tasks.filter(t => t.completed).length, percentage = total ? Math.round(done / total * 100) : 0;
  totalTasksSpan.textContent = `Total: ${total}`; completedTasksSpan.textContent = `Completadas: ${done}`; progressBar.style.width = `${percentage}%`; progressPercentage.textContent = `${percentage}%`; progressTrack.setAttribute('aria-valuenow', percentage); progressLabel.textContent = total ? `${done} de ${total} tareas completadas.` : 'Completa una tarea para comenzar.';
  const streak = getStreak(), weekDone = countWeekCompletions(); streakDays.textContent = streak;
  weeklyAchievement.textContent = weekDone >= 5 ? '¡Gran entrenador! Ya llevas 5 misiones esta semana.' : streak >= 3 ? '¡Racha imparable! Sigue conquistando tus metas.' : weekDone ? `¡Buen inicio! Ya completaste ${weekDone} misión${weekDone === 1 ? '' : 'es'} esta semana.` : 'Tu próxima tarea puede iniciar una gran racha.';
  renderWeeklyChart();
}
function lastSevenDays() { return Array.from({ length: 7 }, (_, i) => { const date = new Date(); date.setDate(date.getDate() - (6 - i)); return date; }); }
function countWeekCompletions() { const keys = new Set(lastSevenDays().map(dayKey)); return completionDays.filter(d => keys.has(d)).length; }
function getStreak() { const dates = new Set(completionDays); let count = 0; for (let i = 0; i < 365; i++) { const date = new Date(); date.setDate(date.getDate() - i); if (dates.has(dayKey(date))) count++; else break; } return count; }
function renderWeeklyChart() { weeklyChart.replaceChildren(); const completed = new Set(completionDays), labels = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; lastSevenDays().forEach(date => { const isDone = completed.has(dayKey(date)), column = document.createElement('div'); column.className = 'chart-column'; column.innerHTML = `<span class="chart-value">${isDone ? '✓' : ''}</span><span class="chart-bar ${isDone ? 'active' : ''}" style="height:${isDone ? 100 : 18}%"></span><small>${labels[date.getDay()]}</small>`; weeklyChart.appendChild(column); }); }
function toggleTask(id) { const task = tasks.find(t => t.id === id); if (!task) return; task.completed = !task.completed; if (task.completed) { const today = dayKey(); if (!completionDays.includes(today)) { completionDays.push(today); saveDays(); } } saveTasks(); renderTasks(); if (task.completed && tasks.length && tasks.every(t => t.completed)) setTimeout(showSuccess, 350); }
function showSuccess() { successModal.hidden = false; $('#closeSuccess').focus(); }
function deleteTask(id, item) { playBattleSound(); item.style.cssText += ';opacity:0;transform:translateX(25px) scale(.96);transition:.3s'; setTimeout(() => { tasks = tasks.filter(t => t.id !== id); saveTasks(); renderTasks(); }, 300); }
function addTask(text) { const minutes = Number(durationInput.value); tasks.unshift({ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, text, priority: priorityInput.value, completed: false, remainingSeconds: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : null, timerRunning: false, timerEnds: null }); saveTasks(); playBattleSound(); renderTasks(); }
function editTask(id) { const task = tasks.find(t => t.id === id), next = prompt('Edita tu tarea:', task.text); if (next === null || !next.trim()) return; task.text = next.trim(); const priority = prompt('Prioridad: alta, media o baja', task.priority); const translated = { alta: 'high', media: 'medium', baja: 'low' }[priority?.toLowerCase()] || priority?.toLowerCase(); if (['high', 'medium', 'low'].includes(translated)) task.priority = translated; saveTasks(); renderTasks(); }
function resetInput() { taskInput.removeAttribute('style'); taskInput.placeholder = '¿Qué tarea vas a capturar?'; }
function setFilter(filter) { currentFilter = filter; filterBtns.forEach(button => button.classList.toggle('active', button.dataset.filter === filter)); renderTasks(); }
taskForm.addEventListener('submit', event => { event.preventDefault(); const text = taskInput.value.trim(); if (!text) { taskInput.style.cssText = 'border-color:#ff5777;box-shadow:0 0 18px rgba(255,87,119,.4);animation:shake .3s ease'; taskInput.placeholder = 'Escribe una tarea primero'; taskInput.focus(); return; } addTask(text); taskInput.value = ''; durationInput.value = ''; resetInput(); taskInput.focus(); });
taskInput.addEventListener('input', resetInput); filterBtns.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter))); $('#closeSuccess').addEventListener('click', () => { successModal.hidden = true; }); successModal.addEventListener('click', event => { if (event.target === successModal) successModal.hidden = true; });
createShootingStars(); createParticles(); renderTasks(); setInterval(tickTimers, 1000);
