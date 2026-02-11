// Task Management Application
document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
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

    // Task lists containers
    const todoList = document.getElementById('todo-list');
    const inProgressList = document.getElementById('inprogress-list');
    const completedList = document.getElementById('completed-list');

    // Stats elements
    const totalTasksEl = document.getElementById('total-tasks');
    const todoTasksEl = document.getElementById('todo-tasks');
    const inProgressTasksEl = document.getElementById('inprogress-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');

    // GitHub and Live Demo links
    const githubLink = document.getElementById('github-link');
    const liveDemoLink = document.getElementById('live-demo-link');

    // State variables
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let isEditing = false;
    let currentEditId = null;
    let deleteTaskId = null;

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.min = today;

    // Initialize the application
    function init() {
        // Load tasks from localStorage
        loadTasks();

        // Update stats
        updateStats();

        // Set up GitHub and Live Demo links (replace with your actual links)
        githubLink.href = 'https://github.com/your-username/task-manager';
        liveDemoLink.href = 'https://your-username.github.io/task-manager/';

        // Set up event listeners
        setupEventListeners();

        // Show welcome message
        showToast('Welcome to TaskMaster! Your tasks are loaded.', 'success');

        // Add some sample tasks if empty
        if (tasks.length === 0) {
            addSampleTasks();
        }
    }

    // Set up event listeners
    function setupEventListeners() {
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

    // Load tasks from localStorage and display them
    function loadTasks() {
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
                    ${task.status !== 'completed' ?
                `<button class="btn-icon complete-btn" title="Mark Complete">
                            <i class="fas fa-check"></i>
                        </button>` : ''
            }
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
        const completeBtn = taskElement.querySelector('.complete-btn');

        editBtn.addEventListener('click', () => editTask(task.id));
        deleteBtn.addEventListener('click', () => openDeleteModal(task.id));

        if (completeBtn) {
            completeBtn.addEventListener('click', () => markAsComplete(task.id));
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

    // Add a new task
    function addTask(title, description, dueDate, priority) {
        const newTask = {
            id: Date.now().toString(),
            title,
            description,
            dueDate,
            priority,
            status: 'todo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        tasks.push(newTask);
        saveTasks();
        createTaskElement(newTask);
        updateStats();

        // Remove empty state if present
        removeEmptyState();
    }

    // Update an existing task
    function updateTask(id, title, description, dueDate, priority) {
        const taskIndex = tasks.findIndex(task => task.id === id);

        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title,
                description,
                dueDate,
                priority,
                updatedAt: new Date().toISOString()
            };

            saveTasks();
            loadTasks();
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

    // Mark a task as complete
    function markAsComplete(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);

        if (taskIndex !== -1) {
            tasks[taskIndex].status = 'completed';
            tasks[taskIndex].updatedAt = new Date().toISOString();

            saveTasks();
            loadTasks();
            updateStats();

            showToast('Task marked as complete!', 'success');
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
            tasks = tasks.filter(task => task.id !== deleteTaskId);
            saveTasks();
            loadTasks();
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

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
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
            // Update task status
            const taskIndex = tasks.findIndex(task => task.id === taskId);

            if (taskIndex !== -1 && tasks[taskIndex].status !== newStatus) {
                tasks[taskIndex].status = newStatus;
                tasks[taskIndex].updatedAt = new Date().toISOString();

                saveTasks();
                loadTasks();
                updateStats();

                showToast(`Task moved to ${newStatus}`, 'success');
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

    // Add sample tasks for demonstration
    function addSampleTasks() {
        const sampleTasks = [
            {
                id: '1',
                title: 'Complete Web Technologies Assignment',
                description: 'Finish the Task Management Web Application for ICT 1209',
                dueDate: '2026-02-14',
                priority: 'high',
                status: 'inprogress',
                createdAt: '2026-02-01T10:30:00Z',
                updatedAt: '2026-02-01T10:30:00Z'
            },
            {
                id: '2',
                title: 'Study for Final Exams',
                description: 'Review chapters 5-8 for the upcoming exams',
                dueDate: '2026-03-10',
                priority: 'high',
                status: 'todo',
                createdAt: '2026-02-02T14:20:00Z',
                updatedAt: '2026-02-02T14:20:00Z'
            },
            {
                id: '3',
                title: 'Buy Groceries',
                description: 'Milk, eggs, bread, fruits, and vegetables',
                dueDate: '2026-02-05',
                priority: 'medium',
                status: 'todo',
                createdAt: '2026-02-03T09:15:00Z',
                updatedAt: '2026-02-03T09:15:00Z'
            },
            {
                id: '4',
                title: 'Meeting with Project Group',
                description: 'Discuss the progress of the final year project',
                dueDate: '2026-02-04',
                priority: 'medium',
                status: 'completed',
                createdAt: '2026-01-30T16:45:00Z',
                updatedAt: '2026-02-01T11:20:00Z'
            },
            {
                id: '5',
                title: 'Read Research Paper',
                description: 'Read the latest paper on AI in web development',
                dueDate: '2026-02-07',
                priority: 'low',
                status: 'completed',
                createdAt: '2026-01-31T13:10:00Z',
                updatedAt: '2026-02-02T15:30:00Z'
            }
        ];

        tasks.push(...sampleTasks);
        saveTasks();
        loadTasks();
        updateStats();
    }

    // Initialize the application
    init();
});