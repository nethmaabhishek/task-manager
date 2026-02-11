// Authentication System - Fixed Login Issue
document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authError = document.getElementById('auth-error');

    // Form inputs
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const registerUsername = document.getElementById('register-username');
    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    const registerConfirmPassword = document.getElementById('register-confirm-password');

    // Simple password hashing function (for demonstration - not production secure)
    function hashPassword(password) {
        // Simple hash for demonstration purposes
        // In a real application, use proper hashing like bcrypt
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    // Initialize users in localStorage if not exists
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            {
                id: '1',
                username: 'student123',
                email: 'student@example.com',
                password: hashPassword('password123'), // Store hashed password
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
        console.log('Default users initialized');
    }

    // Check localStorage structure
    console.log('Users in localStorage:', JSON.parse(localStorage.getItem('users')));

    // Tab switching
    loginTab.addEventListener('click', function () {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        hideError();
    });

    registerTab.addEventListener('click', function () {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        hideError();
    });

    // Show error message
    function showError(message) {
        authError.textContent = message;
        authError.classList.add('show');
        console.error('Auth Error:', message);
    }

    // Hide error message
    function hideError() {
        authError.classList.remove('show');
    }

    // Validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    function isValidPassword(password) {
        return password.length >= 6;
    }

    // Login form submission
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = loginUsername.value.trim();
        const password = loginPassword.value.trim();

        console.log('Login attempt:', { username, password });

        if (!username || !password) {
            showError('Please fill in all fields');
            return;
        }

        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        console.log('Available users:', users);

        // Hash the input password for comparison
        const hashedPassword = hashPassword(password);
        console.log('Hashed password:', hashedPassword);

        // Find user - compare hashed passwords
        const user = users.find(u => u.username === username && u.password === hashedPassword);

        if (user) {
            console.log('Login successful for user:', user.username);

            // Create session
            const session = {
                userId: user.id,
                username: user.username,
                email: user.email,
                loggedInAt: new Date().toISOString()
            };

            // Save session to localStorage
            localStorage.setItem('currentUser', JSON.stringify(session));
            console.log('Session saved:', session);

            // Initialize empty tasks for new user if needed
            initializeUserTasks(user.id);

            // Redirect to app page
            window.location.href = 'app.html';
        } else {
            console.log('Login failed - user not found or password incorrect');
            showError('Invalid username or password');
        }
    });

    // Initialize tasks for a new user
    function initializeUserTasks(userId) {
        const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];

        // Check if user already has tasks
        const userTasks = allTasks.filter(task => task.userId === userId);

        if (userTasks.length === 0) {
            console.log('Initializing sample tasks for new user:', userId);

            // Add sample tasks for new users
            const sampleTasks = [
                {
                    id: Date.now().toString(),
                    userId: userId,
                    title: 'Welcome to TaskMaster!',
                    description: 'This is your first task. Edit or delete it to get started.',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
                    priority: 'medium',
                    status: 'todo',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: (Date.now() + 1).toString(),
                    userId: userId,
                    title: 'Explore the Features',
                    description: 'Try adding, editing, and organizing your tasks.',
                    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
                    priority: 'low',
                    status: 'inprogress',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];

            // Add to all tasks
            allTasks.push(...sampleTasks);
            localStorage.setItem('tasks', JSON.stringify(allTasks));
        }
    }

    // Register form submission
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = registerUsername.value.trim();
        const email = registerEmail.value.trim();
        const password = registerPassword.value.trim();
        const confirmPassword = registerConfirmPassword.value.trim();

        console.log('Registration attempt:', { username, email, password });

        // Validation
        if (!username || !email || !password || !confirmPassword) {
            showError('Please fill in all fields');
            return;
        }

        if (username.length < 3) {
            showError('Username must be at least 3 characters long');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        if (!isValidPassword(password)) {
            showError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Check if username already exists
        if (users.some(u => u.username === username)) {
            showError('Username already exists');
            return;
        }

        // Check if email already exists
        if (users.some(u => u.email === email)) {
            showError('Email already registered');
            return;
        }

        // Create new user with hashed password
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashPassword(password), // Store hashed password
            createdAt: new Date().toISOString()
        };

        console.log('New user created:', newUser);

        // Add user to users array
        users.push(newUser);

        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Users saved to localStorage');

        // Create session
        const session = {
            userId: newUser.id,
            username: newUser.username,
            email: newUser.email,
            loggedInAt: new Date().toISOString()
        };

        localStorage.setItem('currentUser', JSON.stringify(session));
        console.log('Session created:', session);

        // Initialize tasks for new user
        initializeUserTasks(newUser.id);

        // Show success message
        showToast('Registration successful! Redirecting...', 'success');

        // Redirect to app page after short delay
        setTimeout(() => {
            window.location.href = 'app.html';
        }, 1500);
    });

    // Show toast notification
    function showToast(message, type = 'info') {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('auth-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'auth-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                background: #4361ee;
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                display: none;
                animation: slideInRight 0.3s ease;
            `;
            document.body.appendChild(toast);

            // Add animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        toast.textContent = message;

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

    // Check if user is already logged in (redirect to app if true)
    function checkExistingSession() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            console.log('Existing session found:', JSON.parse(currentUser));
            window.location.href = 'app.html';
        } else {
            console.log('No existing session found');
        }
    }

    // Debug function to check localStorage
    function debugLocalStorage() {
        console.log('=== localStorage Debug ===');
        console.log('Users:', JSON.parse(localStorage.getItem('users')));
        console.log('Current User:', JSON.parse(localStorage.getItem('currentUser')));
        console.log('Tasks:', JSON.parse(localStorage.getItem('tasks')));
        console.log('==========================');
    }

    // Add debug button for testing (remove in production)
    function addDebugButton() {
        const debugBtn = document.createElement('button');
        debugBtn.textContent = 'Debug localStorage';
        debugBtn.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            padding: 5px 10px;
            background: #333;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            z-index: 1000;
            opacity: 0.7;
        `;
        debugBtn.onclick = debugLocalStorage;
        document.body.appendChild(debugBtn);
    }

    // Initialize
    checkExistingSession();
    addDebugButton();

    // Add console message for debugging
    console.log('Authentication system initialized');
});