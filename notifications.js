// Initialize socket connection
const socket = io('http://localhost:3000');

let lastMessages = []; // Store last messages globally

// Hide notification bell and indicator by default when page loads
document.addEventListener('DOMContentLoaded', function() {
    const notificationContainer = document.querySelector('.notification-container');
    const notificationIndicator = document.getElementById('notificationIndicator');
    const bell = document.getElementById('notificationBell');
    const notificationDropdown = document.getElementById('notificationDropdown');
    let closeTimeout;
    
    console.log('DOM Content Loaded - Setting up notifications');
    
    if (notificationContainer) {
        notificationContainer.style.display = 'none';
    }
    if (notificationIndicator) {
        notificationIndicator.style.display = 'none';
    }

    // Set up hover functionality
    notificationContainer.addEventListener('mouseover', () => {
        console.log('Mouse over notification container');
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
        notificationDropdown.style.display = 'block';
        notificationDropdown.classList.add('show');
        bell.classList.remove('bell-animate');
        notificationIndicator.style.display = 'none';
    });

    notificationContainer.addEventListener('mouseleave', (e) => {
        closeTimeout = setTimeout(() => {
            const rect = notificationDropdown.getBoundingClientRect();
            const isOverDropdown = e.clientX >= rect.left && 
                                 e.clientX <= rect.right && 
                                 e.clientY >= rect.top && 
                                 e.clientY <= rect.bottom;
            
            if (!isOverDropdown) {
                notificationDropdown.style.display = 'none';
                notificationDropdown.classList.remove('show');
            }
        }, 500);
    });

    notificationDropdown.addEventListener('mouseover', () => {
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
        notificationDropdown.style.display = 'block';
        notificationDropdown.classList.add('show');
    });

    notificationDropdown.addEventListener('mouseleave', () => {
        closeTimeout = setTimeout(() => {
            notificationDropdown.style.display = 'none';
            notificationDropdown.classList.remove('show');
        }, 500);
    });

    // Check if user is already logged in
    const username = sessionStorage.getItem("username");
    const userId = sessionStorage.getItem("userId");
    console.log('Checking login status:', { username, userId });
    
    if (username && userId) {
        console.log('User is logged in, initializing notification features');
        // Show notification container
        notificationContainer.style.display = 'inline-block';
        
        // Set up bell click event listener
        bell.addEventListener('click', () => {
            console.log('Bell clicked, redirecting to messages');
            if (username && userId) {
                window.location.href = `messages.html?username=${encodeURIComponent(username)}&userId=${encodeURIComponent(userId)}`;
            }
        });

        // Initialize other notification features
        initializeNotificationsAfterLogin(userId);
    }
});

// Function to update notification dropdown
function updateNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.innerHTML = ''; // Clear existing notifications

    lastMessages.forEach(({ chatRoomId, chatName, message }) => {
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        notificationItem.dataset.roomId = chatRoomId;
        notificationItem.innerHTML = `
            <div>
                <strong>${chatName}</strong>
                <p>${message.sender}: ${message.text}</p>
            </div>
        `;
        notificationItem.addEventListener('click', (e) => {
            console.log('Notification item clicked, redirecting to messages with chatRoomId:', chatRoomId);
            e.stopPropagation(); // Prevent bell click event from firing
            const username = sessionStorage.getItem("username");
            const userId = sessionStorage.getItem("userId");
            if (username && userId) {
                window.location.href = `messages.html?username=${encodeURIComponent(username)}&userId=${encodeURIComponent(userId)}&chatRoomId=${chatRoomId}`;
            }
        });
        dropdown.appendChild(notificationItem);
    });
}

// Function to initialize notifications after successful login
function initializeNotificationsAfterLogin(userId) {
    const notificationIndicator = document.getElementById('notificationIndicator');
    const bell = document.getElementById('notificationBell');
    const notificationContainer = bell.closest('.notification-container');
    const notificationDropdown = document.getElementById('notificationDropdown');
    let closeTimeout;

    // Show notification container
    notificationContainer.style.display = 'inline-block';
    notificationIndicator.style.display = 'none';
    notificationDropdown.innerHTML = '';

    // Set up notification bell event listeners
    bell.addEventListener('click', () => {
        console.log('Bell clicked in initializeNotifications');
        const username = sessionStorage.getItem("username");
        const userId = sessionStorage.getItem("userId");
        console.log('Redirecting to messages with:', { username, userId});

        if (username && userId) {
            window.location.href = `messages.html?username=${encodeURIComponent(username)}&userId=${encodeURIComponent(userId)}`;
        }
    });

    // Register user and load chats
    socket.emit('registerUser', userId);
    socket.emit('loadChats', userId);
}

// Listen for existing chats to populate last messages
socket.on('loadExistingChats', (chats) => {
    console.log('Received existing chats:', chats);
    // Sort chats by the timestamp of their last message in descending order
    const sortedChats = chats.sort((a, b) => {
        const aTimestamp = a.lastMessage?.timestamp || 0;
        const bTimestamp = b.lastMessage?.timestamp || 0;
        return bTimestamp - aTimestamp;
    });

    // Get the last three messages
    lastMessages = sortedChats.slice(0, 3).map(chat => ({
        chatRoomId: chat.id,
        chatName: chat.name,
        message: chat.lastMessage || { sender: 'System', text: 'No messages yet' }
    }));

    // Update notification dropdown
    updateNotificationDropdown();
});

// Handle new message notifications
socket.on('newMessageNotification', ({ chatRoomId, message }) => {
    // Update lastMessages array
    const chatListItem = document.querySelector(`.chat-list-item[data-room-id="${chatRoomId}"]`);
    const chatName = chatListItem ? chatListItem.textContent.trim() : 'Unknown Chat';

    // Remove existing message for this chat room if it exists
    lastMessages = lastMessages.filter(msg => msg.chatRoomId !== chatRoomId);

    // Add new message at the beginning
    lastMessages.unshift({
        chatRoomId,
        chatName,
        message
    });

    // Keep only last 3 messages
    lastMessages = lastMessages.slice(0, 3);

    // Update the dropdown
    updateNotificationDropdown();

    // Show notification indicator and animate bell
    const notificationIndicator = document.getElementById('notificationIndicator');
    const bell = document.getElementById('notificationBell');
    notificationIndicator.style.display = 'block';
    bell.classList.add('bell-animate');
});

// Handle offline notifications
socket.on('offlineNotifications', (notifications) => {
    console.log('Received offline notifications:', notifications);
    
    // Sort notifications by timestamp if available
    const sortedNotifications = notifications.sort((a, b) => {
        const aTime = a.message.timestamp ? new Date(a.message.timestamp) : new Date(0);
        const bTime = b.message.timestamp ? new Date(b.message.timestamp) : new Date(0);
        return bTime - aTime;
    });

    // Update lastMessages with offline notifications
    lastMessages = sortedNotifications.slice(0, 3).map(({ chatRoomId, message }) => {
        const chatListItem = document.querySelector(`.chat-list-item[data-room-id="${chatRoomId}"]`);
        const chatName = chatListItem ? chatListItem.textContent.trim() : 'Unknown Chat';
        return {
            chatRoomId,
            chatName,
            message
        };
    });

    // Update the dropdown
    updateNotificationDropdown();
});