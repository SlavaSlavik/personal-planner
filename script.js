const DAY_NAMES = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];
const STORAGE_KEY = "personal-planner-v02";
let currentWeekOffset = 0;
let editingTask = null;

const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

const weekTitle = document.getElementById("weekTitle");
const weekNumber = document.getElementById("weekNumber");
const weekGrid = document.getElementById("weekGrid");
const modal = document.getElementById("taskModal");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const modalTitle = document.getElementById("modalTitle");
const deleteTaskBtn = document.getElementById("deleteTask");

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mondayOfWeek(offset) {
  const date = new Date();
  const day = (date.getDay() + 6) % 7;
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - day + offset * 7);
  return date;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatRange(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} — ${end.getDate()} ${months[end.getMonth()]}`;
  }
  return `${start.getDate()} ${months[start.getMonth()]} — ${end.getDate()} ${months[end.getMonth()]}`;
}

function getWeekNumber(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  return 1 + Math.round((target - firstThursday) / 604800000);
}

function getTasks(dayKey) {
  if (!state[dayKey]) state[dayKey] = [];
  return state[dayKey];
}

function render() {
  const monday = mondayOfWeek(currentWeekOffset);
  weekTitle.textContent = formatRange(monday);
  weekNumber.textContent = `Неделя ${getWeekNumber(monday)}`;

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push({ date, key: dateKey(date), name: DAY_NAMES[i] });
  }

  weekGrid.innerHTML = "";

  days.slice(0, 5).forEach((day) => {
    weekGrid.appendChild(createDayCard(day));
  });

  const weekend = document.createElement("article");
  weekend.className = "weekend-card";
  weekend.appendChild(createWeekendDay(days[5]));
  weekend.appendChild(createWeekendDay(days[6]));
  weekGrid.appendChild(weekend);
}

function createDayCard(day) {
  const card = document.createElement("article");
  card.className = "day-card";
  card.innerHTML = `
    <header>
      <h2>${day.name} <span>${day.date.getDate()}</span></h2>
      <button class="more-day" aria-label="Редактировать день">•••</button>
    </header>
    <div class="tasks"></div>
    <button class="add-task">＋&nbsp; Добавить задачу</button>
  `;
  populateTasks(card.querySelector(".tasks"), day.key);
  card.querySelector(".add-task").addEventListener("click", () => openModal(day.key));
  card.querySelector(".more-day").addEventListener("click", () => openModal(day.key));
  return card;
}

function createWeekendDay(day) {
  const wrapper = document.createElement("div");
  wrapper.className = "weekend-day";
  wrapper.innerHTML = `
    <header>
      <h2>${day.name} <span>${day.date.getDate()}</span></h2>
      <button class="more-day" aria-label="Редактировать день">•••</button>
    </header>
    <div class="tasks"></div>
    <button class="add-task">＋&nbsp; Добавить</button>
  `;
  populateTasks(wrapper.querySelector(".tasks"), day.key);
  wrapper.querySelector(".add-task").addEventListener("click", () => openModal(day.key));
  wrapper.querySelector(".more-day").addEventListener("click", () => openModal(day.key));
  return wrapper;
}

function populateTasks(container, dayKey) {
  const tasks = getTasks(dayKey);
  tasks.forEach((task) => {
    const row = document.createElement("div");
    row.className = `task-row${task.completed ? " completed" : ""}`;
    row.innerHTML = `
      <input class="task-check" type="checkbox" ${task.completed ? "checked" : ""} aria-label="Выполнить задачу">
      ${task.priority ? '<button class="priority-star" aria-label="Снять главную задачу">★</button>' : ""}
      <button class="task-text" title="Редактировать задачу"></button>
    `;
    row.querySelector(".task-text").textContent = task.text;

    row.querySelector(".task-check").addEventListener("change", (event) => {
      task.completed = event.target.checked;
      saveState();
      row.classList.toggle("completed", task.completed);
    });

    const star = row.querySelector(".priority-star");
    if (star) {
      star.addEventListener("click", () => {
        task.priority = false;
        saveState();
        render();
      });
    }

    row.querySelector(".task-text").addEventListener("click", () => openModal(dayKey, task.id));
    container.appendChild(row);
  });
}

function openModal(dayKey, taskId = null) {
  editingTask = { dayKey, taskId };
  const tasks = getTasks(dayKey);
  const task = taskId ? tasks.find((item) => item.id === taskId) : null;

  modalTitle.textContent = task ? "Редактировать задачу" : "Новая задача";
  taskInput.value = task ? task.text : "";
  priorityInput.checked = Boolean(task?.priority);
  deleteTaskBtn.classList.toggle("hidden", !task);
  modal.classList.remove("hidden");
  setTimeout(() => taskInput.focus(), 0);
}

function closeModal() {
  modal.classList.add("hidden");
  editingTask = null;
  taskInput.value = "";
  priorityInput.checked = false;
}

function saveTask() {
  const text = taskInput.value.trim();
  if (!text || !editingTask) return;

  const tasks = getTasks(editingTask.dayKey);

  if (editingTask.taskId) {
    const task = tasks.find((item) => item.id === editingTask.taskId);
    if (task) {
      task.text = text;
      if (priorityInput.checked) {
        tasks.forEach((item) => item.priority = false);
      }
      task.priority = priorityInput.checked;
    }
  } else {
    if (priorityInput.checked) {
      tasks.forEach((item) => item.priority = false);
    }
    tasks.push({
      id: crypto.randomUUID(),
      text,
      completed: false,
      priority: priorityInput.checked
    });
  }

  saveState();
  closeModal();
  render();
}

function deleteTask() {
  if (!editingTask?.taskId) return;
  const tasks = getTasks(editingTask.dayKey);
  state[editingTask.dayKey] = tasks.filter((task) => task.id !== editingTask.taskId);
  saveState();
  closeModal();
  render();
}

document.getElementById("prevWeek").addEventListener("click", () => {
  currentWeekOffset--;
  render();
});

document.getElementById("nextWeek").addEventListener("click", () => {
  currentWeekOffset++;
  render();
});

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("saveTask").addEventListener("click", saveTask);
deleteTaskBtn.addEventListener("click", deleteTask);

taskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") saveTask();
  if (event.key === "Escape") closeModal();
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.getElementById("globalAdd").addEventListener("click", () => {
  const monday = mondayOfWeek(currentWeekOffset);
  openModal(dateKey(monday));
});

render();
