// Tab navigation
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Task handling
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const favouriteList = document.getElementById("favouriteList");

function createTaskElement(taskText) {
  const li = document.createElement("li");

  const span = document.createElement("span");
  span.textContent = taskText;
  span.addEventListener("click", () => {
    li.classList.toggle("completed");
    saveTasks();
  });

  const star = document.createElement("span");
  star.textContent = "★";
  star.classList.add("star");
  star.addEventListener("click", () => {
    star.classList.toggle("active");
    updateFavourites();
    saveTasks();
  });

  li.appendChild(span);
  li.appendChild(star);

  return li;
}

function addTask() {
  const text = taskInput.value.trim();
  if (text === "") return;

  const taskEl = createTaskElement(text);
  taskList.appendChild(taskEl);
  taskInput.value = "";

  saveTasks();
}

addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", e => {
  if (e.key === "Enter") addTask();
});

// Favourites
function updateFavourites() {
  favouriteList.innerHTML = "";
  document.querySelectorAll("#taskList li").forEach(li => {
    const star = li.querySelector(".star");
    if (star.classList.contains("active")) {
      favouriteList.appendChild(li.cloneNode(true));
    }
  });
}

// Settings
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Export tasks
document.getElementById("exportBtn").addEventListener("click", () => {
  const tasks = [];
  document.querySelectorAll("#taskList li").forEach(li => {
    tasks.push({
      text: li.querySelector("span").textContent,
      completed: li.classList.contains("completed"),
      favourite: li.querySelector(".star").classList.contains("active")
    });
  });

  const blob = new Blob([JSON.stringify(tasks)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks.json";
  a.click();
});

// Import tasks
document.getElementById("importFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const tasks = JSON.parse(reader.result);
    taskList.innerHTML = "";
    tasks.forEach(t => {
      const taskEl = createTaskElement(t.text);
      if (t.completed) taskEl.classList.add("completed");
      if (t.favourite) taskEl.querySelector(".star").classList.add("active");
      taskList.appendChild(taskEl);
    });
    updateFavourites();
    saveTasks();
  };
  reader.readAsText(file);
});

// Save & Load tasks with localStorage
function saveTasks() {
  const tasks = [];
  document.querySelectorAll("#taskList li").forEach(li => {
    tasks.push({
      text: li.querySelector("span").textContent,
      completed: li.classList.contains("completed"),
      favourite: li.querySelector(".star").classList.contains("active")
    });
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const data = localStorage.getItem("tasks");
  if (!data) return;
  const tasks = JSON.parse(data);
  tasks.forEach(t => {
    const taskEl = createTaskElement(t.text);
    if (t.completed) taskEl.classList.add("completed");
    if (t.favourite) taskEl.querySelector(".star").classList.add("active");
    taskList.appendChild(taskEl);
  });
  updateFavourites();
}

loadTasks();