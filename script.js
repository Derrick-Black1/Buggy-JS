let todoItems = [];

const STORAGE_KEY = "taskflow-todo-items";
let currentFilter = "all";

function loadItems() {
    try {
        const savedItems = localStorage.getItem(STORAGE_KEY);
        const parsedItems = savedItems ? JSON.parse(savedItems) : [];
        todoItems = Array.isArray(parsedItems)
            ? parsedItems.filter(item =>
                item &&
                typeof item.text === "string" &&
                typeof item.completed === "boolean"
              )
            : [];
    } catch (error) {
        console.warn("Could not load saved tasks:", error);
        todoItems = [];
    }
}

function saveItems() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todoItems));
    } catch (error) {
        console.warn("Could not save tasks:", error);
        showStatus("Your browser could not save this task.");
    }
}

function showStatus(message) {
    const status = document.getElementById("statusMessage");
    if (status) status.textContent = message;
}

function addItem() {
    const input = document.getElementById("todoInput");
    if (!input) return;

    const newItem = input.value.trim();

    if (newItem !== "") {
        todoItems.push({
            id: (window.crypto && crypto.randomUUID)
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            text: newItem,
            completed: false
        });

        input.value = "";
        saveItems();
        currentFilter = "all";
        setActiveFilter("all");
        updateList();
        input.focus();
        showStatus(`Added task: ${newItem}`);
    } else {
        input.focus();
        showStatus("Please enter a to-do item.");
    }
}

function updateList() {
    const list = document.getElementById("todoList");
    if (!list) return;

    list.innerHTML = "";

    const visibleItems = todoItems
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => {
            if (currentFilter === "active") return !item.completed;
            if (currentFilter === "completed") return item.completed;
            return true;
        });

    if (visibleItems.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-state";

        const icon = document.createElement("span");
        icon.className = "empty-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "✦";

        const heading = document.createElement("strong");
        const message = document.createElement("span");

        if (todoItems.length === 0) {
            heading.textContent = "Your list is clear.";
            message.textContent = "Add a task above to get started.";
        } else if (currentFilter === "active") {
            heading.textContent = "All caught up!";
            message.textContent = "You have no active tasks.";
        } else if (currentFilter === "completed") {
            heading.textContent = "Nothing completed yet.";
            message.textContent = "Completed tasks will appear here.";
        } else {
            heading.textContent = "No tasks to show.";
            message.textContent = "Try another filter.";
        }

        empty.append(icon, heading, message);
        list.appendChild(empty);
    } else {
        visibleItems.forEach(({ item, index }) => {
            const listItem = document.createElement("li");
            listItem.className = `todo-item${item.completed ? " completed" : ""}`;

            const completeButton = document.createElement("button");
            completeButton.type = "button";
            completeButton.className = "complete-toggle";
            completeButton.setAttribute("aria-label",
                item.completed ? `Mark ${item.text} as active` : `Complete ${item.text}`);
            completeButton.setAttribute("aria-pressed", String(item.completed));
            completeButton.textContent = item.completed ? "✓" : "";
            completeButton.addEventListener("click", () => toggleItem(index));

            const taskText = document.createElement("span");
            taskText.className = "task-text";
            taskText.textContent = item.text;

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-button";
            deleteButton.setAttribute("aria-label", `Delete ${item.text}`);
            deleteButton.textContent = "×";
            deleteButton.addEventListener("click", () => removeItem(index));

            listItem.append(completeButton, taskText, deleteButton);
            list.appendChild(listItem);
        });
    }

    const remaining = todoItems.filter(item => !item.completed).length;
    const countLabel = remaining === 1 ? "1 task remaining" : `${remaining} tasks remaining`;
    document.getElementById("taskCount").textContent = countLabel;

    const total = todoItems.length;
    document.getElementById("totalCount").textContent =
        `${total} total ${total === 1 ? "task" : "tasks"}`;

    document.getElementById("clearCompleted").disabled =
        !todoItems.some(item => item.completed);
}

function removeItem(index) {
    if (!Number.isInteger(index) || index < 0 || index >= todoItems.length) {
        return;
    }

    const removed = todoItems[index].text;
    todoItems.splice(index, 1);
    saveItems();
    updateList();
    showStatus(`Deleted task: ${removed}`);
}

function toggleItem(index) {
    if (!Number.isInteger(index) || index < 0 || index >= todoItems.length) {
        return;
    }

    todoItems[index].completed = !todoItems[index].completed;
    saveItems();
    updateList();
    showStatus(todoItems[index].completed ? "Task completed." : "Task marked active.");
}

function setActiveFilter(filter) {
    document.querySelectorAll(".filter-button").forEach(button => {
        const isActive = button.dataset.filter === filter;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("todoForm");
    const input = document.getElementById("todoInput");
    const clearButton = document.getElementById("clearCompleted");

    loadItems();
    updateList();

    form.addEventListener("submit", event => {
        event.preventDefault();
        addItem();
    });

    document.querySelectorAll(".filter-button").forEach(button => {
        button.addEventListener("click", () => {
            currentFilter = button.dataset.filter;
            setActiveFilter(currentFilter);
            updateList();
        });
    });

    clearButton.addEventListener("click", () => {
        const completedCount = todoItems.filter(item => item.completed).length;
        if (completedCount === 0) return;

        todoItems = todoItems.filter(item => !item.completed);
        saveItems();
        updateList();
        showStatus(`Cleared ${completedCount} completed ${completedCount === 1 ? "task" : "tasks"}.`);
    });

    input.focus();
});