// Task Management Application with User Authentication
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        // Redirect to login page if not logged in
        window.location.href = 'index.html';
        return;
    }

    // DOM Elements
    const welcomeMessage = document.getElementById('welcome-message');
    const userEmail = document.getElementById('user-email');
    const footerUsername = document.getElementById('footer-username');
    const logoutBtn = document.getElementById('logout-btn');
    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const dueDateInput = document.getElementById('due-date');
    const taskPriorityInput = document.getElementById('task-priority');
    const addTaskBtn = document.getElementById('add-task-btn');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const searchInput = document.getElementById('search-input');
    const filterStatusInput = document.getElementById('filter-status');
    const filterPriorityInput = document.getElementById('filter-priority');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const githubLink = document.getElementById('github-link');
    const liveDemoLink = document.getElementById('live-demo-link');

    // Task lists containers
    const todoList = document.getElementById('todo-list');
    const inProgressList = document.getElementById('inprogress-list');
    const completedList = document.getElementById('completed-list');

    // Stats elements
    const totalTasksEl = document.getElementById('total-tasks');
    const todoTasksEl = document.getElementById('todo-tasks');
    const inProgressTasksEl = document.getElementById('inprogress-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');

    // State variables
    let tasks = [];
    let isEditing = false;
    let currentEditId = null;
    let deleteTaskId = null;

    // Set user information
    welcomeMessage.textContent = `Welcome, ${currentUser.username}!`;
    userEmail.textContent = currentUser.email;
    footerUsername.textContent = currentUser.username;

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.min = today;

    // Initialize the application
    function init() {
        // Load tasks for current user
        loadUserTasks();

        // Update stats
        updateStats();

        // Set up GitHub and Live Demo links
        githubLink.href = 'https://github.com/your-username/task-manager';
        liveDemoLink.href = 'https://your-username.github.io/task-manager/';

        // Set up event listeners
        setupEventListeners();

        // Show welcome message
        showToast(`Welcome back, ${currentUser.username}!`, 'success');
    }

    // Set up event listeners
    function setupEventListeners() {
        // Logout button
        logoutBtn.addEventListener('click', handleLogout);

        // Form submission
        taskForm.addEventListener('submit', handleFormSubmit);

        // Cancel edit
        cancelEditBtn.addEventListener('click', cancelEdit);

        // Search and filter
        searchInput.addEventListener('input', filterTasks);
        filterStatusInput.addEventListener('change', filterTasks);
        filterPriorityInput.addEventListener('change', filterTasks);
        clearFiltersBtn.addEventListener('click', clearFilters);

        // Delete modal
        confirmDeleteBtn.addEventListener('click', confirmDelete);
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);

        // Close modal when clicking outside
        window.addEventListener('click', function (event) {
            if (event.target === deleteModal) {
                closeDeleteModal();
            }
        });
    }

    // Handle logout
    function handleLogout() {
        // Clear current user session
        localStorage.removeItem('currentUser');

        // Redirect to login page
        window.location.href = 'index.html';
    }

    // Get tasks for current user
    function loadUserTasks() {
        // Get all tasks from localStorage
        const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];

        // Filter tasks for current user
        tasks = allTasks.filter(task => task.userId === currentUser.userId);

        // Clear task lists
        todoList.innerHTML = '';
        inProgressList.innerHTML = '';
        completedList.innerHTML = '';

        // Add empty state if no tasks
        if (tasks.length === 0) {
            showEmptyState();
            return;
        }

        // Sort tasks by creation date (newest first)
        tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Display tasks
        tasks.forEach(task => {
            createTaskElement(task);
        });
    }

    // Create a task element and add it to the appropriate column
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-card ${task.status}`;
        taskElement.setAttribute('data-id', task.id);

        // Format date for display
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'No due date';

        // Priority badge class
        const priorityClass = `priority-${task.priority}`;

        // Status movement buttons based on current status
        let statusButtons = '';

        switch (task.status) {
            case 'todo':
                statusButtons = `
                    <button class="btn-icon move-to-progress-btn" title="Move to In Progress">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button class="btn-icon complete-btn" title="Mark Complete">
                        <i class="fas fa-check"></i>
                    </button>
                `;
                break;
            case 'inprogress':
                statusButtons = `
                    <button class="btn-icon move-back-btn" title="Move back to To Do">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <button class="btn-icon complete-btn" title="Mark Complete">
                        <i class="fas fa-check"></i>
                    </button>
                `;
                break;
            case 'completed':
                statusButtons = `
                    <button class="btn-icon reopen-btn" title="Reopen Task">
                        <i class="fas fa-redo"></i>
                    </button>
                `;
                break;
        }

        // Task HTML
        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-actions">
                    <button class="btn-icon edit-btn" title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-btn" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${statusButtons}
                </div>
            </div>
            <div class="task-description">${escapeHtml(task.description || 'No description')}</div>
            <div class="task-footer">
                <div class="task-due-date">
                    <i class="far fa-calendar"></i> ${dueDate}
                </div>
                <div class="task-priority ${priorityClass}">
                    ${task.priority}
                </div>
            </div>
        `;

        // Add event listeners to buttons
        const editBtn = taskElement.querySelector('.edit-btn');
        const deleteBtn = taskElement.querySelector('.delete-btn');
        const moveToProgressBtn = taskElement.querySelector('.move-to-progress-btn');
        const moveBackBtn = taskElement.querySelector('.move-back-btn');
        const completeBtn = taskElement.querySelector('.complete-btn');
        const reopenBtn = taskElement.querySelector('.reopen-btn');

        editBtn.addEventListener('click', () => editTask(task.id));
        deleteBtn.addEventListener('click', () => openDeleteModal(task.id));

        if (moveToProgressBtn) {
            moveToProgressBtn.addEventListener('click', () => moveTaskToProgress(task.id));
        }

        if (moveBackBtn) {
            moveBackBtn.addEventListener('click', () => moveTaskToTodo(task.id));
        }

        if (completeBtn) {
            completeBtn.addEventListener('click', () => markAsComplete(task.id));
        }

        if (reopenBtn) {
            reopenBtn.addEventListener('click', () => reopenTask(task.id));
        }

        // Make task draggable
        taskElement.setAttribute('draggable', true);
        taskElement.addEventListener('dragstart', handleDragStart);

        // Add to appropriate column based on status
        switch (task.status) {
            case 'todo':
                todoList.appendChild(taskElement);
                break;
            case 'inprogress':
                inProgressList.appendChild(taskElement);
                break;
            case 'completed':
                completedList.appendChild(taskElement);
                break;
        }

        // Add drop zone event listeners to columns
        setupDropZones();
    }

    // Handle form submission
    function handleFormSubmit(e) {
        e.preventDefault();

        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const dueDate = dueDateInput.value;
        const priority = taskPriorityInput.value;

        if (!title) {
            showToast('Task title is required!', 'error');
            taskTitleInput.focus();
            return;
        }

        if (isEditing) {
            // Update existing task
            updateTask(currentEditId, title, description, dueDate, priority);
            showToast('Task updated successfully!', 'success');
        } else {
            // Add new task
            addTask(title, description, dueDate, priority);
            showToast('Task added successfully!', 'success');
        }

        // Reset form
        resetForm();
    }

    // Add a new task for current user
    function addTask(title, description, dueDate, priority) {
        const newTask = {
            id: Date.now().toString(),
            userId: currentUser.userId,
            title,
            description,
            dueDate,
            priority,
            status: 'todo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Get all tasks from localStorage
        const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];

        // Add new task
        allTasks.push(newTask);

        // Save to localStorage
        localStorage.setItem('tasks', JSON.stringify(allTasks));

        // Update local tasks array
        tasks.push(newTask);

        // Create task element
        createTaskElement(newTask);

        // Update stats
        updateStats();

        // Remove empty state if present
        removeEmptyState();
    }

    // Update an existing task
    function updateTask(id, title, description, dueDate, priority) {
        // Get all tasks from localStorage
        const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];

        const taskIndex = allTasks.findIndex(task => task.id === id && task.userId === currentUser.userId);

        if (taskIndex !== -1) {
            allTasks[taskIndex] = {
                ...allTasks[taskIndex],
                title,
                description,
                dueDate,
                priority,
                updatedAt: new Date().toISOString()
            };

            // Save to localStorage
            localStorage.setItem('tasks', JSON.stringify(allTasks));

            // Update local tasks
            tasks = allTasks.filter(task => task.userId === currentUser.userId);

            // Reload tasks
            loadUserTasks();

            // Update stats
            updateStats();

            // Reset editing state
            isEditing = false;
            currentEditId = null;
            cancelEditBtn.style.display = 'none';
            addTaskBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
        }
    }

    // Edit a task
    function editTask(id) {
        const task = tasks.find(task => task.id === id);

        if (task) {
            // Fill form with task data
            taskTitleInput.value = task.title;
            taskDescriptionInput.value = task.description || '';
            dueDateInput.value = task.dueDate || '';
            taskPriorityInput.value = task.priority;

            // Change button to "Update Task"
            isEditing = true;
            currentEditId = id;
            addTaskBtn.innerHTML = '<i class="fas fa-save"></i> Update Task';
            cancelEditBtn.style.display = 'flex';

            // Scroll to form
            document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });

            showToast('Editing task: ' + task.title, 'info');
        }
    }

    // Cancel edit mode
    function cancelEdit() {
        resetForm();
        showToast('Edit cancelled', 'info');
    }

    // Move task from To Do to In Progress
    function moveTaskToProgress(id) {
        updateTaskStatus(id, 'inprogress', 'Task moved to In Progress!');
    }

    // Move task from In Progress back to To Do
    function moveTaskToTodo(id) {
        updateTaskStatus(id, 'todo', 'Task moved back to To Do!');
    }

    // Mark a task as complete
    function markAsComplete(id) {
        updateTaskStatus(id, 'completed', 'Task marked as complete!');
    }

    // Reopen a completed task
    function reopenTask(id) {
        updateTaskStatus(id, 'todo', 'Task reopened!');
    }

    // Update task status
    function updateTaskStatus(id, newStatus, successMessage) {
        // Get all tasks from localStorage
        const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];

        const taskIndex = allTasks.findIndex(task => task.id === id && task.userId === currentUser.userId);

        if (taskIndex !== -1 && allTasks[taskIndex].status !== newStatus) {
            allTasks[taskIndex].status = newStatus;
            allTasks[taskIndex].updatedAt = new Date().toISOString();

            // Save to localStorage
            localStorage.setItem('tasks', JSON.stringify(allTasks));

            // Update local tasks
            tasks = allTasks.filter(task => task.userId === currentUser.userId);

            // Reload tasks
            loadUserTasks();

            // Update stats
            updateStats();

            showToast(successMessage, 'success');
        }
    }

    // Open delete confirmation modal
    function openDeleteModal(id) {
        deleteTaskId = id;
        deleteModal.style.display = 'flex';
    }

    // Close delete modal
    function closeDeleteModal() {
        deleteModal.style.display = 'none';
        deleteTaskId = null;
    }

    // Confirm and delete task
    function confirmDelete() {
        if (deleteTaskId) {
            // Get all tasks from localStorage
            const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];

            // Filter out the task to delete
            const updatedTasks = allTasks.filter(task =>
                !(task.id === deleteTaskId && task.userId === currentUser.userId)
            );

            // Save to localStorage
            localStorage.setItem('tasks', JSON.stringify(updatedTasks));

            // Update local tasks
            tasks = updatedTasks.filter(task => task.userId === currentUser.userId);

            // Reload tasks
            loadUserTasks();

            // Update stats
            updateStats();

            showToast('Task deleted successfully', 'success');
            closeDeleteModal();
        }
    }

    // Filter tasks based on search and filter criteria
    function filterTasks() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusFilter = filterStatusInput.value;
        const priorityFilter = filterPriorityInput.value;

        // Get all task cards
        const taskCards = document.querySelectorAll('.task-card');

        taskCards.forEach(card => {
            const taskId = card.getAttribute('data-id');
            const task = tasks.find(t => t.id === taskId);

            if (!task) return;

            const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                task.description.toLowerCase().includes(searchTerm);
            const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

            if (matchesSearch && matchesStatus && matchesPriority) {
                card.style.display = 'block';
                // Animate appearance
                card.style.animation = 'fadeIn 0.5s ease';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Clear all filters
    function clearFilters() {
        searchInput.value = '';
        filterStatusInput.value = 'all';
        filterPriorityInput.value = 'all';
        filterTasks();
        showToast('Filters cleared', 'info');
    }

    // Update task statistics
    function updateStats() {
        const total = tasks.length;
        const todo = tasks.filter(task => task.status === 'todo').length;
        const inProgress = tasks.filter(task => task.status === 'inprogress').length;
        const completed = tasks.filter(task => task.status === 'completed').length;

        // Animate the counter
        animateCounter(totalTasksEl, total);
        animateCounter(todoTasksEl, todo);
        animateCounter(inProgressTasksEl, inProgress);
        animateCounter(completedTasksEl, completed);
    }

    // Animate counter from current value to target
    function animateCounter(element, target) {
        const current = parseInt(element.textContent) || 0;
        const increment = target > current ? 1 : -1;
        let currentValue = current;

        const timer = setInterval(() => {
            currentValue += increment;
            element.textContent = currentValue;

            if (currentValue === target) {
                clearInterval(timer);
            }
        }, 30);
    }

    // Show empty state when no tasks
    function showEmptyState() {
        const emptyStateHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks yet. Add your first task above!</p>
            </div>
        `;

        todoList.innerHTML = emptyStateHTML;
        inProgressList.innerHTML = '';
        completedList.innerHTML = '';
    }

    // Remove empty state
    function removeEmptyState() {
        if (tasks.length > 0) {
            const emptyState = todoList.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }
        }
    }

    // Reset form to default state
    function resetForm() {
        taskForm.reset();
        isEditing = false;
        currentEditId = null;
        cancelEditBtn.style.display = 'none';
        addTaskBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';

        // Set min date to today
        dueDateInput.min = today;
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        toastMessage.textContent = message;

        // Set color based on type
        switch (type) {
            case 'success':
                toast.style.backgroundColor = '#2ec4b6';
                break;
            case 'error':
                toast.style.backgroundColor = '#f72585';
                break;
            case 'info':
                toast.style.backgroundColor = '#4361ee';
                break;
        }

        toast.style.display = 'block';

        // Hide after 3 seconds
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Drag and drop functionality
    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
        e.dataTransfer.effectAllowed = 'move';

        // Add visual feedback
        setTimeout(() => {
            e.target.style.opacity = '0.4';
        }, 0);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('tasks-list')) {
            e.target.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
        }
    }

    function handleDragLeave(e) {
        if (e.target.classList.contains('tasks-list')) {
            e.target.style.backgroundColor = '';
        }
    }

    function handleDrop(e) {
        e.preventDefault();

        // Reset background color
        if (e.target.classList.contains('tasks-list')) {
            e.target.style.backgroundColor = '';
        }

        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = e.target.getAttribute('data-status');
        const draggedElement = document.querySelector(`[data-id="${taskId}"]`);

        if (draggedElement && newStatus) {
            // Get all tasks from localStorage
            const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];

            // Update task status
            const taskIndex = allTasks.findIndex(task =>
                task.id === taskId && task.userId === currentUser.userId
            );

            if (taskIndex !== -1 && allTasks[taskIndex].status !== newStatus) {
                allTasks[taskIndex].status = newStatus;
                allTasks[taskIndex].updatedAt = new Date().toISOString();

                // Save to localStorage
                localStorage.setItem('tasks', JSON.stringify(allTasks));

                // Update local tasks
                tasks = allTasks.filter(task => task.userId === currentUser.userId);

                // Reload tasks
                loadUserTasks();

                // Update stats
                updateStats();

                // Show appropriate message based on status change
                let message = '';
                switch (newStatus) {
                    case 'todo':
                        message = 'Task moved to To Do';
                        break;
                    case 'inprogress':
                        message = 'Task moved to In Progress';
                        break;
                    case 'completed':
                        message = 'Task marked as complete';
                        break;
                }
                showToast(message, 'success');
            }

            // Reset opacity
            draggedElement.style.opacity = '1';
        }
    }

    // Set up drop zones for drag and drop
    function setupDropZones() {
        const taskLists = document.querySelectorAll('.tasks-list');

        taskLists.forEach(list => {
            list.addEventListener('dragover', handleDragOver);
            list.addEventListener('dragenter', handleDragEnter);
            list.addEventListener('dragleave', handleDragLeave);
            list.addEventListener('drop', handleDrop);
        });
    }

    // Initialize the application
    init();
});