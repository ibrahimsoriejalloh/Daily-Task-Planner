document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task');
    const timeInput = document.getElementById('time');
    const dateInput = document.getElementById('date');
    const priorityInput = document.getElementById('priority');
    const alertSoundInput = document.getElementById('alert-sound');
    const addTaskButton = document.getElementById('add-task');
    const taskList = document.getElementById('tasks');
    const clearAllButton = document.getElementById('clear-all');
    const searchInput = document.getElementById('search');
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');
    const closeAlertButton = document.getElementById('close-alert');

    let tasks = [];
    let countdownIntervals = {}; 
    let currentAlertSound = null; 
    let activeAlertTaskId = null; // To track which task triggered the alert

    // Add Task
    addTaskButton.addEventListener('click', () => {
        const task = taskInput.value.trim();
        const time = timeInput.value;
        const date = dateInput.value;
        const priority = priorityInput.value;
        const alertSound = alertSoundInput.value;

        if (task && time && date) {
            const newTask = {
                id: Date.now(),
                task,
                time,
                date,
                priority,
                alertSound,
                completed: false,
                alertTriggered: false // Track if the alert was triggered already
            };

            tasks.push(newTask);
            renderTasks();
            taskInput.value = '';
            timeInput.value = '';
            dateInput.value = '';
            priorityInput.value = 'low';

            showAlert(`Task "${task}" added successfully!`);

            // Start countdown for the new task
            startCountdown(newTask.id, `${date}T${time}`, alertSound);
        } else {
            showAlert('Please fill in all fields.');
        }
    });

    // Search Tasks
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const filteredTasks = tasks.filter(task => task.task.toLowerCase().includes(searchTerm));
        renderTasks(filteredTasks);
    });

    // Clear All Tasks
    clearAllButton.addEventListener('click', () => {
        tasks = [];
        renderTasks();
        Object.values(countdownIntervals).forEach(interval => clearInterval(interval));
        countdownIntervals = {};
    });

    // Render Tasks
    function renderTasks(taskArray = tasks) {
        taskList.innerHTML = '';
        taskArray.forEach(task => {
            const li = document.createElement('li');
            li.className = task.completed ? 'completed' : '';
            const taskTime = new Date(`${task.date}T${task.time}`).getTime();
            const now = new Date().getTime();
            const timeLeft = taskTime - now;

            li.innerHTML = `
                <div class="task-info">
                    <span>${task.task} (${task.time} on ${task.date}) - Priority: ${task.priority}</span>
                    <div class="countdown" id="countdown-${task.id}">${timeLeft > 0 ? `Time Left: ${formatTime(timeLeft)}` : "Time's Up!"}</div>
                </div>
                <div class="actions">
                    <button class="edit" onclick="editTask(${task.id})">Edit</button>
                    <button class="done" onclick="toggleComplete(${task.id})">${task.completed ? 'Undo' : 'Done'}</button>
                    <button class="delete" onclick="deleteTask(${task.id})">Delete</button>
                </div>
            `;
            taskList.appendChild(li);

            // Start countdown if time is left
            if (timeLeft > 0 && !countdownIntervals[task.id]) {
                startCountdown(task.id, `${task.date}T${task.time}`, task.alertSound);
            }
        });
    }

    // Start Countdown
    function startCountdown(taskId, taskDateTime, alertSound) {
        const countdownElement = document.getElementById(`countdown-${taskId}`);
        const taskTime = new Date(taskDateTime).getTime();

        countdownIntervals[taskId] = setInterval(() => {
            const now = new Date().getTime();
            const timeLeft = taskTime - now;
            const task = tasks.find(t => t.id === taskId);

            if (timeLeft > 0) {
                countdownElement.textContent = `Time Left: ${formatTime(timeLeft)}`;
            } else {
                clearInterval(countdownIntervals[taskId]);
                delete countdownIntervals[taskId];
                countdownElement.textContent = "Time's Up!";

                if (task && !task.alertTriggered) { 
                    task.alertTriggered = true; // Prevent repeated alerts
                    playAlertSound(alertSound);
                    showAlert(`Time's up for task: "${task.task}"!`);
                    activeAlertTaskId = taskId;
                }
            }
        }, 1000);
    }

    // Play Alert Sound
    function playAlertSound(soundFile) {
        if (currentAlertSound) {
            currentAlertSound.pause();
            currentAlertSound.currentTime = 0; 
        }
        currentAlertSound = new Audio(soundFile);
        currentAlertSound.play();
    }

    // Show Custom Alert
    function showAlert(message) {
        alertMessage.textContent = message;
        alertModal.style.display = 'flex';
    }

    // Close Custom Alert
    closeAlertButton.addEventListener('click', () => {
        if (currentAlertSound) {
            currentAlertSound.pause();
            currentAlertSound.currentTime = 0;
            currentAlertSound = null;
        }

        alertModal.style.display = 'none';

        // Prevent further alerts for the task that triggered this alert
        if (activeAlertTaskId !== null) {
            let task = tasks.find(t => t.id === activeAlertTaskId);
            if (task) {
                task.alertTriggered = true;
            }
            activeAlertTaskId = null;
        }
    });

    // Format Time Left
    function formatTime(milliseconds) {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    // Edit Task
    window.editTask = (id) => {
        const task = tasks.find(task => task.id === id);
        if (task) {
            const newTask = prompt('Edit your task:', task.task);
            if (newTask !== null) {
                task.task = newTask.trim();
                renderTasks();
            }
        }
    };

    // Toggle Complete
    window.toggleComplete = (id) => {
        const task = tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            renderTasks();
            showAlert(`Task "${task.task}" marked as ${task.completed ? 'completed' : 'incomplete'}!`);
        }
    };

    // Delete Task
    window.deleteTask = (id) => {
        tasks = tasks.filter(task => task.id !== id);
        renderTasks();
        if (countdownIntervals[id]) {
            clearInterval(countdownIntervals[id]);
            delete countdownIntervals[id];
        }
        showAlert('Task deleted successfully!');
    };
});
