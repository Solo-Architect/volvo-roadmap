// 1. ХРАНИЛИЩЕ ЗАДАЧ
let tasks = JSON.parse(localStorage.getItem('volvo_tasks')) || [
    { id: "1", title: "Изучить базу данных Room", status: "todo", tags: ["learn"] },
    { id: "2", title: "Установить Python и YOLOv8", status: "todo", tags: ["learn"] },
    { id: "3", title: "Оформить ИП для приема платежей", status: "todo", tags: ["law"] },
    { id: "4", title: "Добавить GPS для проверки в школе", status: "progress", tags: ["dev"] },
    { id: "5", title: "Сделать красивый дизайн (Material 3)", status: "progress", tags: ["dev"] },
    { id: "6", title: "Создать проект в Android Studio", status: "done", tags: ["dev"] },
    { id: "7", title: "Купить Volvo FH16", status: "future", tags: [] },
    { id: "8", title: "Открыть LLC в США (Stripe)", status: "future", tags: ["law"] }
];

// Элементы интерфейса
const taskModal = document.getElementById('taskModal');
const modalTaskTitle = document.getElementById('modalTaskTitle');
const modalSaveBtn = document.getElementById('modalSaveBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const addBtn = document.getElementById('addTaskBtn');
const resetBtn = document.getElementById('resetBtn');

const tagClasses = { 'dev': 'tag-dev', 'learn': 'tag-learn', 'law': 'tag-law' };
const tagNames = { 'dev': 'Разработка', 'learn': 'Обучение', 'law': 'Юр. вопросы' };

// 2. ФУНКЦИЯ ОТРИСОВКИ ДОСКИ
function renderBoard() {
    const columns = {
        todo: document.getElementById('list-todo'),
        progress: document.getElementById('list-progress'),
        done: document.getElementById('list-done'),
        future: document.getElementById('list-future')
    };

    Object.values(columns).forEach(col => { if (col) col.innerHTML = ''; });

    tasks.forEach(task => {
        const columnEl = columns[task.status];
        if (!columnEl) return;

        const card = document.createElement('div');
        card.className = 'card';
        card.draggable = true;
        card.dataset.id = task.id;

        let tagsHTML = `<div class="card-tags">`;
        if (task.tags && task.tags.length > 0) {
            task.tags.forEach(tag => {
                const className = tagClasses[tag] || 'tag-none';
                const name = tagNames[tag] || tag;
                tagsHTML += `<span class="tag ${className}">${name}</span>`;
            });
        }
        tagsHTML += `</div>`;

        card.innerHTML = `${tagsHTML}<div class="card-text">${task.title}</div>`;

        card.addEventListener('dragstart', () => card.classList.add('dragging'));
        card.addEventListener('dragend', () => card.classList.remove('dragging'));

        columnEl.appendChild(card);
    });

    updateProgress();
}

// 3. ЛОГИКА DRAG AND DROP
document.querySelectorAll('.task-list').forEach(zone => {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        const bottomTask = insertAfterTask(zone, e.clientY);
        const curTask = document.querySelector('.dragging');
        if (!curTask) return;

        if (!bottomTask) { zone.appendChild(curTask); } 
        else { zone.insertBefore(curTask, bottomTask); }
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        const curTask = document.querySelector('.dragging');
        if (!curTask) return;

        const taskId = curTask.dataset.id;
        const columnId = zone.id;
        
        let newStatus = 'todo';
        if (columnId === 'list-progress') newStatus = 'progress';
        if (columnId === 'list-done') newStatus = 'done';
        if (columnId === 'list-future') newStatus = 'future';

        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.status = newStatus;
            saveState();
            renderBoard(); 
        }
    });
});

function insertAfterTask(zone, mouseY) {
    const els = zone.querySelectorAll('.card:not(.dragging)');
    let closestTask = null;
    let closestOffset = Number.NEGATIVE_INFINITY;

    els.forEach(el => {
        const box = el.getBoundingClientRect();
        const offset = mouseY - box.top - box.height / 2;
        if (offset < 0 && offset > closestOffset) {
            closestOffset = offset;
            closestTask = el;
        }
    });
    return closestTask;
}

// 4. УПРАВЛЕНИЕ СОСТОЯНИЕМ И ПРОГРЕССОМ
function saveState() {
    localStorage.setItem('volvo_tasks', JSON.stringify(tasks));
}

function updateProgress() {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.innerHTML = `Выполнение: ${done} из ${total} (${percent}%)`;

    const countTodo = document.getElementById('count-todo');
    const countProgress = document.getElementById('count-progress');
    const countDone = document.getElementById('count-done');
    const countFuture = document.getElementById('count-future');

    if (countTodo) countTodo.innerText = tasks.filter(t => t.status === 'todo').length;
    if (countProgress) countProgress.innerText = tasks.filter(t => t.status === 'progress').length;
    if (countDone) countDone.innerText = done;
    if (countFuture) countFuture.innerText = tasks.filter(t => t.status === 'future').length;
}

// 5. МОДАЛЬНОЕ ОКНО
if (addBtn) {
    addBtn.addEventListener('click', () => {
        modalTaskTitle.value = '';
        const defaultRadio = document.querySelector('input[name="modalTag"][value="dev"]');
        if (defaultRadio) defaultRadio.checked = true;
        if (taskModal) taskModal.style.display = 'flex';
        modalTaskTitle.focus();
    });
}

function closeModal() { if (taskModal) taskModal.style.display = 'none'; }
if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

// Добавление задачи (клик + Enter)
function addNewTask() {
    const title = modalTaskTitle.value.trim();
    if (!title) return;

    const checkedRadio = document.querySelector('input[name="modalTag"]:checked');
    const selectedTagValue = checkedRadio ? checkedRadio.value : 'none';
    
    let tags = [];
    if (selectedTagValue !== 'none') { tags.push(selectedTagValue); }

    tasks.push({
        id: Date.now().toString(),
        title: title,
        status: 'todo',
        tags: tags
    });

    saveState();
    renderBoard();
    closeModal();
}

if (modalSaveBtn) modalSaveBtn.addEventListener('click', addNewTask);

// Добавление по нажатию Enter в инпуте
if (modalTaskTitle) {
    modalTaskTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewTask();
    });
}

// КНОПКА СБРОСА КЭША
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (confirm("Сбросить весь прогресс и вернуть начальные задачи?")) {
            localStorage.removeItem('volvo_tasks');
            location.reload();
        }
    });
}

// Запуск доски
document.addEventListener('DOMContentLoaded', renderBoard);