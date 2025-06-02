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
    const oldDropdown = document.getElementById('notificationDropdown');
    
    // Create new dropdown
    const newDropdown = document.createElement('div');
    newDropdown.id = 'notificationDropdown';
    newDropdown.className = oldDropdown.className;

    // Add each chat in the lastMessages array to the new dropdown
    // Insert at the beginning of the dropdown to maintain newest-first order
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
        // Insert at the beginning instead of appending
        if (newDropdown.firstChild) {
            newDropdown.insertBefore(notificationItem, newDropdown.firstChild);
        } else {
            newDropdown.appendChild(notificationItem);
        }
    });

    // Add mouseover/mouseleave event listeners
    let closeTimeout;
    
    newDropdown.addEventListener('mouseover', () => {
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
        newDropdown.classList.add('show');
    });

    newDropdown.addEventListener('mouseleave', () => {
        closeTimeout = setTimeout(() => {
            newDropdown.classList.remove('show');
        }, 500);
    });

    // Replace old dropdown with new one
    oldDropdown.parentNode.replaceChild(newDropdown, oldDropdown);

    // Re-add bell event listeners
    const bell = document.getElementById('notificationBell');
    if (bell) {
        bell.addEventListener('mouseover', () => {
            newDropdown.classList.add('show');
            bell.classList.remove('bell-animate');
            const notificationIndicator = document.getElementById('notificationIndicator');
            if (notificationIndicator) {
                notificationIndicator.style.display = 'none';
            }
        });

        bell.addEventListener('mouseleave', () => {
            closeTimeout = setTimeout(() => {
                newDropdown.classList.remove('show');
                bell.classList.remove('bell-animate');
            }, 500);
        });
    }
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
    const sortedChats = [...chats]; // Create a copy of the array
    for(let i = 0; i < sortedChats.length; i++) {
        for(let j = 0; j < sortedChats.length - i - 1; j++) {
            const timestamp1 = sortedChats[j].lastMessage?.timestamp || 0;
            const timestamp2 = sortedChats[j + 1].lastMessage?.timestamp || 0;
            if(timestamp1 < timestamp2) {
                // Swap elements
                const temp = sortedChats[j];
                sortedChats[j] = sortedChats[j + 1];
                sortedChats[j + 1] = temp;
            }
        }
    }

    // Take the first three chats and create lastMessages entries
    sortedChats.slice(0, 3).forEach(chat => {
        const newMessage = {
            chatRoomId: chat.id,
            chatName: chat.name,
            message: chat.lastMessage || { sender: 'System', text: 'No messages yet' }
        };
        
        const existingMessageIndex = lastMessages.findIndex(msg => msg.chatRoomId === chat.id);
        if (existingMessageIndex !== -1) {
            // If chat exists, remove it
            lastMessages.splice(existingMessageIndex, 1);
        }
        
        // Add new message to start and maintain max size
        lastMessages.unshift(newMessage);
        if (lastMessages.length > 3) {
            lastMessages.pop();
        }
    });

    // Update notification dropdown
    updateNotificationDropdown();
});

// Handle new message notifications
socket.on('newMessageNotification', ({ chatRoomId, message }) => {
    const chatListItem = document.querySelector(`.chat-list-item[data-room-id="${chatRoomId}"]`);
    const chatName = chatListItem ? chatListItem.textContent.trim() : 'Unknown Chat';

    const existingMessageIndex = lastMessages.findIndex(msg => msg.chatRoomId === chatRoomId);
    const newMessage = {
        chatRoomId,
        chatName,
        message
    };

    if (existingMessageIndex !== -1) {
        // If chat exists, remove it
        lastMessages.splice(existingMessageIndex, 1);
    }

    // Add new message to start and maintain max size
    lastMessages.unshift(newMessage);
    if (lastMessages.length > 3) {
        lastMessages.pop();
    }

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
    
    if (notifications && notifications.length > 0) {
        // Sort offline notifications by timestamp
        const sortedNotifications = notifications.sort((a, b) => {
            const aTime = a.message.timestamp ? new Date(a.message.timestamp) : new Date(0);
            const bTime = b.message.timestamp ? new Date(b.message.timestamp) : new Date(0);
            return bTime - aTime;
        });

        // Process each sorted notification
        sortedNotifications.forEach(({ chatRoomId, message }) => {
            const chatListItem = document.querySelector(`.chat-list-item[data-room-id="${chatRoomId}"]`);
            const chatName = chatListItem ? chatListItem.textContent.trim() : 'Unknown Chat';
            
            const existingMessageIndex = lastMessages.findIndex(msg => msg.chatRoomId === chatRoomId);
            const newMessage = {
                chatRoomId,
                chatName,
                message
            };

            if (existingMessageIndex !== -1) {
                // If chat exists, remove it
                lastMessages.splice(existingMessageIndex, 1);
            }

            // Add new message to start and maintain max size
            lastMessages.unshift(newMessage);
            if (lastMessages.length > 3) {
                lastMessages.pop();
            }
        });

        // Update the dropdown
        updateNotificationDropdown();

        // Show notification indicator
        const notificationIndicator = document.getElementById('notificationIndicator');
        const bell = document.getElementById('notificationBell');
        notificationIndicator.style.display = 'block';
        bell.classList.add('bell-animate');
    }
});