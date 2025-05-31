const socket = io('http://localhost:3000');


function getUsernameFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get("username");
}
function getUserIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get("userId");
}

let lastMessages = [];

let usernameElement;
    let loginButton;
    let chatListSidebar;
    let notificationDropdown;
    let chatRoomPanel;
    let newChatRoomButton;

document.addEventListener("DOMContentLoaded", function () {
     usernameElement = document.getElementById("username");
     loginButton = document.getElementById("loginbutton");
     chatListSidebar = document.querySelector(".chat-list-sidebar ul");
     notificationDropdown = document.getElementById("notificationDropdown");
     chatRoomPanel = document.querySelector(".chat-room-panel");
     newChatRoomButton = document.querySelector(".new-chat-button");

    // Get notification elements
    const notificationIndicator = document.getElementById('notificationIndicator');
    const bell = document.getElementById('notificationBell');
    const notificationContainer = bell.closest('.notification-container');

    // Hide notification elements by default
    notificationContainer.style.display = 'none';
    notificationIndicator.style.display = 'none';
    notificationDropdown.innerHTML = '';

    const userId = getUserIdFromQuery();
    const username = getUsernameFromQuery();

    if (userId && username) {
        // User is logged in
        usernameElement.innerText = username;
        loginButton.innerText = "Log out";
        loginButton.onclick = logOut;
        socket.emit('registerUser', userId);
        loadChats(userId);
        enableChatFeatures();
        
        // Show notification container for logged-in users
        notificationContainer.style.display = 'inline-block';
    } else {
        // User is logged out
        usernameElement.innerText = "Logged out";
        loginButton.innerText = "Log in";
        loginButton.onclick = openLoginModal;
        chatListSidebar.innerHTML = "";
        disableChatFeatures();
    }

    const addMemberButton = document.getElementById('addMemberButton');
    if (addMemberButton) {
        addMemberButton.addEventListener('click', () => {
            addMemberToChat();
        });
    }

    const removeMemberButton = document.getElementById('removeMemberButton');
    if (removeMemberButton) {
        removeMemberButton.addEventListener('click', () => {
            removeMemberFromChat();
        });
    }

    if (newChatRoomButton) {
        newChatRoomButton.addEventListener('click', () => {
            openAddMemberModal();
        });
    }

    // Send message
    const sendButton = document.querySelector('.send-button');
    const messageInput = document.querySelector('.message-input');
    console.log('Send button:', sendButton);

    if (sendButton && messageInput) {
        sendButton.addEventListener('click', () => {
            const messageText = messageInput.value.trim();
            if (messageText) {
                const message = {
                    sender: username,
                    text: messageText,
                };
                socket.emit('sendMessage', { chatRoomId: currentChatRoomId, message });
                //displayMessage(message);
                console.log('Message sent:', message);
                messageInput.value = '';
            }
        });
    }

    // Set up notification bell event listeners
    bell.addEventListener('mouseover', () => {
        notificationDropdown.classList.add('show');
        bell.classList.remove('bell-animate');
        notificationIndicator.style.display = 'none';
    });

    let closeTimeout;

    bell.addEventListener('mouseleave', () => {
        closeTimeout = setTimeout(() => {
            notificationDropdown.classList.remove('show');
            bell.classList.remove('bell-animate');
        }, 500);
    });

    notificationDropdown.addEventListener('mouseover', () => {
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
        notificationDropdown.classList.add('show');
    });

    notificationDropdown.addEventListener('mouseleave', () => {
        closeTimeout = setTimeout(() => {
            notificationDropdown.classList.remove('show');
        }, 500);
    });

    // Handle bell click to open the chat room with the new message
    bell.addEventListener('click', () => {
        const chatRoomId = bell.dataset.chatRoomId;
        const message = JSON.parse(bell.dataset.message);

        if (chatRoomId) {
            // Switch to the chat room with the new message
            switchChatRoom(chatRoomId);

            // Clear the notification indicator and animation
            const notificationIndicator = document.getElementById('notificationIndicator');
            notificationIndicator.style.display = 'none';
            bell.classList.remove('bell-animate');

            console.log('Opening chat room with new message:', message);
        }
    });

    // Handle online status updates
    socket.on('updateOnlineStatus', (onlineUsers) => {
        console.log('Online users updated:', onlineUsers);
        const memberList = document.querySelector('.chat-room-members');
        if (memberList) {
            const memberItems = memberList.querySelectorAll('li');
            memberItems.forEach((item) => {
                const userId = item.dataset.userId;
                if (onlineUsers[userId]) {
                    item.classList.add('online');
                    item.classList.remove('offline');
                } else {
                    item.classList.add('offline');
                    item.classList.remove('online');
                }
            });
        }
    });
});

function logOut() {
        // Notify server about logout
        socket.emit('userLogout');

        sessionStorage.removeItem("username");
        sessionStorage.removeItem("userId");
        usernameElement.innerText = "Logged out";
        loginButton.innerText = "Log in";
        loginButton.onclick = openLoginModal;

        // Clear chats and notifications
        chatListSidebar.innerHTML = "";
        notificationDropdown.innerHTML = "";

        // Hide and reset notification elements
        const notificationIndicator = document.getElementById('notificationIndicator');
        const bell = document.getElementById('notificationBell');
        const notificationContainer = bell.closest('.notification-container');
        notificationContainer.style.display = 'none';
        notificationIndicator.style.display = 'none';
        bell.classList.remove('bell-animate');

        // Clear messages area
        const messagesArea = document.querySelector(".messages-area");
        if (messagesArea) {
            messagesArea.innerHTML = "";
        }

        // Disable chat features
        disableChatFeatures();
    }

    function openLoginModal() {
        const loginModal = document.getElementById("loginModal");
        loginModal.style.display = "block";

        setTimeout(() => {
            loginModal.classList.add("show");
        }, 10);
    }

    // Attach closeLoginModal to the window object to make it globally accessible
    function closeLoginModal () {
        const loginModal = document.getElementById("loginModal");
        loginModal.classList.remove("show");
        loginModal.classList.add("closing");

        setTimeout(() => {
            loginModal.classList.remove("closing");
            loginModal.style.display = "none";
        }, 500);
    };

    function disableChatFeatures() {
        // Hide chat room panel content
        if (chatRoomPanel) {
            chatRoomPanel.style.display = "none";
        }

        // Disable the "New Chat Room" button
        if (newChatRoomButton) {
            newChatRoomButton.disabled = true;
            newChatRoomButton.style.cursor = "not-allowed";
            newChatRoomButton.style.opacity = "0.5";
        }
    }

    function enableChatFeatures() {
        // Show chat room panel content
        if (chatRoomPanel) {
            chatRoomPanel.style.display = "flex";
        }

        // Enable the "New Chat Room" button
        if (newChatRoomButton) {
            newChatRoomButton.disabled = false;
            newChatRoomButton.style.cursor = "pointer";
            newChatRoomButton.style.opacity = "1";
        }
    }

    window.TryLogin = function () {
    const login = document.getElementById("loginInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();
    const loginInput = document.getElementById("loginInput");
    const passwordInput = document.getElementById("passwordInput");

    fetch("http://localhost:80/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                // Reset the page to its initial state
                resetMessagesPage();

                // Set new user data
                sessionStorage.setItem("username", data.username);
                sessionStorage.setItem("userId", data.userId);
                usernameElement.innerText = data.username;
                loginButton.innerText = "Log out";
                loginButton.onclick = logOut;

                // Register user with socket to receive offline notifications
                socket.emit('registerUser', data.userId);

                // Show notification container
                const bell = document.getElementById('notificationBell');
                const notificationContainer = bell.closest('.notification-container');
                const notificationIndicator = document.getElementById('notificationIndicator');
                notificationContainer.style.display = 'inline-block';
                notificationIndicator.style.display = 'none';

                // Clear existing notifications
                const notificationDropdown = document.getElementById('notificationDropdown');
                notificationDropdown.innerHTML = '';

                // Load chats and enable features for the new user
                loadChats(data.userId);
                enableChatFeatures();

                // Close the login modal
                closeLoginModal();
            } else {
                if (data.message === "Wrong password") {
                    showError(passwordInput, "Wrong password");
                } else if (data.message === "Wrong login") {
                    showError(loginInput, "Wrong login!");
                }
            }
        });
};

    function resetMessagesPage() {
    // Clear chat list
    const chatListSidebar = document.querySelector(".chat-list-sidebar ul");
    if (chatListSidebar) {
        chatListSidebar.innerHTML = ""; // Clear all chat list items
    }

    // Reset chat room title
    const chatRoomTitle = document.getElementById("chat-room-title");
    if (chatRoomTitle) {
        chatRoomTitle.innerText = "Select a chat room"; // Reset to default title
    }

    // Clear chat members
    const chatRoomMembers = document.querySelector(".chat-room-members");
    if (chatRoomMembers) {
        chatRoomMembers.innerHTML = "<strong>Members</strong>"; // Reset members section
    }

    // Clear messages area
    const messagesArea = document.querySelector(".messages-area");
    if (messagesArea) {
        messagesArea.innerHTML = ""; // Clear all messages
    }

    // Clear message input field
    const messageInput = document.querySelector(".message-input");
    if (messageInput) {
        messageInput.value = ""; // Clear input field
    }

    // Disable chat features
    disableChatFeatures();
}

    function loadChats(userId) {
        socket.emit("loadChats", userId);
    }

    // Listen for chats loaded from the server
    socket.on("loadExistingChats", (chats) => {
        // Sort chats by the timestamp of their last message in descending order
        const sortedChats = chats.sort((a, b) => {
            const aTimestamp = a.lastMessage?.timestamp || 0;
            const bTimestamp = b.lastMessage?.timestamp || 0;
            return bTimestamp - aTimestamp;
        });

        lastMessages = sortedChats.slice(0, 3).map(chat => ({
        chatRoomId: chat.id,
        chatName: chat.name,
        message: chat.lastMessage || { sender: 'System', text: 'No messages yet' }
    }));
        // Get the top three chats
        const newestChats = sortedChats.slice(0, 3);

        // Populate the notification dropdown
        notificationDropdown.innerHTML = ""; // Clear existing notifications
        newestChats.forEach((chat) => {
            const notificationItem = document.createElement("div");
            notificationItem.className = "notification-item";
            notificationItem.innerHTML = `
                    <strong>${chat.name}</strong>
                    <p>${chat.lastMessage?.sender || "System"}: ${chat.lastMessage?.text || "No messages yet"}</p>
                `;
            notificationItem.addEventListener("click", () => {
                switchChatRoom(chat.id); // Open the chat room when clicked
            });
            notificationDropdown.appendChild(notificationItem);
        });
    });

    function showError(input, message) {
        const errorSpan = input.nextElementSibling;
        errorSpan.textContent = message;
        input.classList.add("input-error");
    }
    // Open login modal
    function openLoginModal() {
        const loginModal = document.getElementById("loginModal");
        loginModal.style.display = "block";

        setTimeout(() => {
            loginModal.classList.add("show");
        }, 10);
    }
    

    function loadChats(userId) {
        socket.emit("loadChats", userId);
    }


    // Listen for chats loaded from the server
    socket.on("loadExistingChats", (chats) => {
        // Sort chats by the timestamp of their last message in descending order
        const sortedChats = chats.sort((a, b) => {
            const aTimestamp = a.lastMessage?.timestamp || 0;
            const bTimestamp = b.lastMessage?.timestamp || 0;
            return bTimestamp - aTimestamp;
        });

        // Get the top three chats
        const newestChats = sortedChats.slice(0, 3);

        // Populate the notification dropdown
        notificationDropdown.innerHTML = ""; // Clear existing notifications
        newestChats.forEach((chat) => {
            const notificationItem = document.createElement("div");
            notificationItem.className = "notification-item";
            notificationItem.innerHTML = `
                    <strong>${chat.name}</strong>
                    <p>${chat.lastMessage?.sender || "System"}: ${chat.lastMessage?.text || "No messages yet"}</p>
                `;
            notificationItem.addEventListener("click", () => {
                switchChatRoom(chat.id); // Open the chat room when clicked
            });
            notificationDropdown.appendChild(notificationItem);
        });
    });

    function showError(input, message) {
        const errorSpan = input.nextElementSibling;
        errorSpan.textContent = message;
        input.classList.add("input-error");
    }


    

let currentChatRoomId = null; // Track the current chat room
let allStudents = [];
let studentIdsInCurrentChat = [];

// Listen for existing chat rooms
socket.on('loadExistingChats', (chats) => {
    const chatListSidebar = document.querySelector('.chat-list-sidebar ul');
    if (chatListSidebar) {
        chatListSidebar.innerHTML = ''; // Clear existing list

        chats.forEach(chat => {
            const listItem = document.createElement('li');
            listItem.className = 'chat-list-item';
            listItem.dataset.roomId = chat.id;
            listItem.innerHTML = `<div class="user-icon"></div>${chat.name}`;
            listItem.addEventListener('click', () => {
                switchChatRoom(chat.id);
            });
            chatListSidebar.appendChild(listItem);
        });
    }
});

// Listen for students
socket.on('loadStudents', (students) => {
    console.log('Students received:', students);
    allStudents = students; // Store students
});

// Switch chat rooms
function switchChatRoom(roomId) {
    currentChatRoomId = roomId;
    socket.emit('joinChatRoom', roomId);
    const chatListItems = document.querySelectorAll('.chat-list-item');
    chatListItems.forEach((item) => {
        item.classList.remove('active');
        if (item.dataset.roomId === roomId) {
            item.classList.add('active');
        }
    });
    // Update chat room header 
    const chatRoomHeader = document.querySelector('.chat-room-header h3');
    // Find the selected chat item
    const selectedChat = document.querySelector(`.chat-list-item[data-room-id="${roomId}"]`);
    if (selectedChat) {
        chatRoomHeader.innerText = selectedChat.innerText;
    } else {
        chatRoomHeader.innerText = "Select a chat room"; // Default header
    }
    loadMessages(roomId);
    loadChatMembersIds(roomId);
    console.log(studentIdsInCurrentChat);
}

// Listen for new chat rooms
socket.on('newChatRoom', (room) => {
    console.log('New chat room received:', room);
    const chatListSidebar = document.querySelector('.chat-list-sidebar ul');
    if (chatListSidebar) {
        const listItem = document.createElement('li');
        listItem.className = 'chat-list-item';
        listItem.dataset.roomId = room.id;
        listItem.innerHTML = `<div class="user-icon"></div>${room.name}`;
        listItem.addEventListener('click', () => {
            switchChatRoom(room.id);
        });
        chatListSidebar.appendChild(listItem);
        console.log('New chat room added to sidebar:', room.name);
    }
});

socket.on('chatRoomRemoved', ({ chatRoomId }) => {
    console.log('Chat room removed:', chatRoomId);
    const chatListSidebar = document.querySelector('.chat-list-sidebar ul');
    if (chatListSidebar) {
        const listItem = chatListSidebar.querySelector(`.chat-list-item[data-room-id="${chatRoomId}"]`);
        if (listItem) {
            listItem.remove();
            console.log('Chat room removed from sidebar:', chatRoomId);
        }
    }
});

// Listen for new messages
socket.on('newMessage', (data) => {
    console.log('New message received:', data);
    const { chatRoomId, message } = data;
    if (chatRoomId === currentChatRoomId) {
        displayMessage(message);
    }
});

// Function to load messages for a chat room
function loadMessages(chatRoomId) {
    socket.emit('getMessages', chatRoomId);
}
function loadChatMembersIds(chatRoomId) {
    socket.emit('getChatMembersIds', chatRoomId);

    // Listen for the response from the server
    socket.on('chatMembersIdsLoaded', (studentIds) => {
        console.log('Student IDs in current chat:', studentIds);
        studentIdsInCurrentChat = studentIds; // Assign the IDs to the global variable

        const memberList = document.querySelector('.chat-room-members');
        if (memberList) {
            memberList.innerHTML = '<strong>Members</strong>'; // Clear existing members

            // Add each member to the list
            studentIds.forEach((studentId) => {
                const student = allStudents.find(s => s.id === studentId);
                if (student) {
                    const listItem = document.createElement('li');
                    listItem.dataset.userId = student.id;
                    listItem.textContent = `${student.firstName} ${student.lastName}`;
                    // Set initial online status
                    if (onlineUsers[student.id]) {
                        listItem.classList.add('online');
                    } else {
                        listItem.classList.add('offline');
                    }
                    memberList.appendChild(listItem);
                }
            });

            // Add member management buttons
            const removeMemberButton = document.createElement('button');
            removeMemberButton.textContent = '-';
            removeMemberButton.style.cssText = `
                margin-left: 10px;
                padding: 5px 8px;
                border: 1px solid #ccc;
                border-radius: 5px;
                cursor: pointer;
            `;
            removeMemberButton.addEventListener('click', () => {
                removeMemberFromChat();
            });
            memberList.appendChild(removeMemberButton);

            const addMemberButton = document.createElement('button');
            addMemberButton.textContent = '+';
            addMemberButton.style.cssText = `
                margin-left: 5px;
                padding: 5px 8px;
                border: 1px solid #ccc;
                border-radius: 5px;
                cursor: pointer;
            `;
            addMemberButton.addEventListener('click', () => {
                addMemberToChat();
            });
            memberList.appendChild(addMemberButton);
        }
    });
}

socket.on('newMessageNotification', ({ chatRoomId, message }) => {
    const dropdown = document.getElementById('notificationDropdown');
    let notificationItem = dropdown.querySelector(`.notification-item[data-room-id="${chatRoomId}"]`);

    // Find the chat name
    const chatListItem = document.querySelector(`.chat-list-item[data-room-id="${chatRoomId}"]`);
    const chatName = chatListItem ? chatListItem.textContent.trim() : 'Unknown Chat';

    // Update the content of the notification item
    if (!notificationItem) {
        // If the chat is not already in the dropdown, create a new notification item
        notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        notificationItem.dataset.roomId = chatRoomId;
        notificationItem.addEventListener('click', () => {
            switchChatRoom(chatRoomId);
        });
        dropdown.appendChild(notificationItem);
    }

    notificationItem.innerHTML = `
        <strong>${chatName}</strong>
        <p>${message.sender}: ${message.text}</p>
    `;

    // If the user is already in the chat room, stop further processing
    if (chatRoomId === currentChatRoomId) {
        return;
    }

    // Ensure the dropdown contains only the last three messages
    const notificationItems = dropdown.querySelectorAll('.notification-item');
    if (notificationItems.length > 3) {
        dropdown.removeChild(notificationItems[0]); // Remove the oldest notification
    }

    // Show the notification indicator and start the bell animation
    const notificationIndicator = document.getElementById('notificationIndicator');
    const bell = document.getElementById('notificationBell');
    notificationIndicator.style.display = 'block'; // Show the red circle
    bell.classList.add('bell-animate'); // Start the bell animation

    // Store the chatRoomId and message for when the bell is clicked
    bell.dataset.chatRoomId = chatRoomId;
    bell.dataset.message = JSON.stringify(message);
});

socket.on('messagesLoaded', (messages) => {
    const messagesArea = document.querySelector('.messages-area');
    if (messagesArea) {
        messagesArea.innerHTML = ''; // Clear existing messages
        messages.forEach((message) => {
            displayMessage(message);
        });
    }
});

// Function to display a message
function displayMessage(message) {
    const messagesArea = document.querySelector('.messages-area');
    if (messagesArea) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        if (message.sender === getUsernameFromQuery()) {
            messageDiv.classList.add('me');
        }
        //console.log("added message:", message);

        messageDiv.innerHTML = `<strong>${message.sender}</strong> ${message.text}`;
        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight; // Scroll to bottom
    }
}

function openAddMemberModal() {
    const modal = document.createElement('div');
    modal.id = 'addMemberModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 5px;
        width: 50%;
        max-width: 600px;
        position: relative;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
    `;
    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    // Add an input field for the chat name
    const chatNameInput = document.createElement('input');
    chatNameInput.type = 'text';
    chatNameInput.placeholder = 'Enter chat name';
    chatNameInput.style.cssText = `
        width: 100%;
        margin-bottom: 10px;
        padding: 10px;
        font-size: 16px;
        border: 1px solid #ccc;
        border-radius: 5px;
    `;

    const studentList = document.createElement('ul');
    studentList.style.listStyleType = 'none';
    studentList.style.padding = '0';

    allStudents.forEach(student => {
        // Skip the current user
        if (student.firstName + " " + student.lastName == getUsernameFromQuery()) {
            return;
        }

        const listItem = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = student.id;
        const label = document.createElement('label');
        label.textContent = `${student.firstName} ${student.lastName}`;
        listItem.appendChild(checkbox);
        listItem.appendChild(label);
        studentList.appendChild(listItem);
    });

    const createChatButton = document.createElement('button');
    createChatButton.textContent = 'Create Chat';
    createChatButton.style.cssText = `
        margin-top: 10px;
        padding: 10px 20px;
        font-size: 16px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    `;
    createChatButton.addEventListener('click', () => {
        console.log('Create chat button clicked');
        const selectedStudentIds = Array.from(studentList.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        // Use the entered chat name or generate one from selected students
        const chatName = chatNameInput.value.trim() || selectedStudentIds.map(studentId => {
            const student = allStudents.find(s => s.id === studentId);
            return student ? `${student.firstName} ${student.lastName}` : '';
        }).join(', ');

        if (selectedStudentIds.length > 0) {
            createChatRoom(chatName, selectedStudentIds);
            modal.remove();
        } else {
            alert('Please select at least one member to create a chat room.');
        }
    });

    modalContent.appendChild(closeButton); // Add the close button to the modal
    modalContent.appendChild(chatNameInput); // Add the chat name input field
    modalContent.appendChild(studentList);
    modalContent.appendChild(createChatButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

function createChatRoom(chatName, studentIds) {

    console.log('Creating chat room with name:', chatName);
    socket.emit('createChatRoomWithStudents', { roomName: chatName, studentIds: studentIds, userId: getUserIdFromQuery() });
}

function addMemberToChat() {
    const modal = document.createElement('div');
    modal.id = 'addMemberModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 5px;
        width: 50%;
        max-width: 600px;
        position: relative;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
    `;
    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    const studentList = document.createElement('ul');
    studentList.style.listStyleType = 'none';
    studentList.style.padding = '0';

    allStudents.forEach(student => {
        if (currentChatRoomId && !studentIdsInCurrentChat.includes(student.id)) {
            const listItem = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = student.id;
            const label = document.createElement('label');
            label.textContent = `${student.firstName} ${student.lastName}`;
            listItem.appendChild(checkbox);
            listItem.appendChild(label);
            studentList.appendChild(listItem);
        }
    });

    const addButton = document.createElement('button');
    addButton.textContent = 'Add';
    addButton.style.cssText = `
        margin-top: 10px;
        padding: 10px 20px;
        font-size: 16px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    `;
    addButton.addEventListener('click', () => {
        const selectedStudentIds = Array.from(studentList.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        if (selectedStudentIds.length > 0) {
            socket.emit('addMemberToChat', { chatRoomId: currentChatRoomId, studentIds: selectedStudentIds });
            modal.remove();
        } else {
            alert('Please select at least one member to add.');
        }
    });

    modalContent.appendChild(closeButton);
    modalContent.appendChild(studentList);
    modalContent.appendChild(addButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

function removeMemberFromChat() {
    const modal = document.createElement('div');
    modal.id = 'removeMemberModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 5px;
        width: 50%;
        max-width: 600px;
        position: relative;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
    `;
    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    const memberList = document.createElement('ul');
    memberList.style.listStyleType = 'none';
    memberList.style.padding = '0';

    studentIdsInCurrentChat.forEach(studentId => {
        const student = allStudents.find(s => s.id === studentId);
        if (student) {
            const listItem = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = student.id;
            const label = document.createElement('label');
            label.textContent = `${student.firstName} ${student.lastName}`;
            listItem.appendChild(checkbox);
            listItem.appendChild(label);
            memberList.appendChild(listItem);
        }
    });

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.style.cssText = `
        margin-top: 10px;
        padding: 10px 20px;
        font-size: 16px;
        background-color: #ff4d4d;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    `;
    removeButton.addEventListener('click', () => {
        const selectedStudentIds = Array.from(memberList.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        if (selectedStudentIds.length > 0) {
            socket.emit('removeMemberFromChat', { chatRoomId: currentChatRoomId, studentIds: selectedStudentIds });
            modal.remove();
        } else {
            alert('Please select at least one member to remove.');
        }
    });

    modalContent.appendChild(closeButton);
    modalContent.appendChild(memberList);
    modalContent.appendChild(removeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

socket.on('chatRoomUpdated', (updatedChatRoom) => {
    console.log('Chat room updated:', updatedChatRoom);
    if (updatedChatRoom.id === currentChatRoomId) {
        loadChatMembersIds(currentChatRoomId);
    }
});

let onlineUsers = {};
socket.on('updateOnlineStatus', (updatedOnlineUsers) => {
    console.log('Online users:', updatedOnlineUsers);
    onlineUsers = updatedOnlineUsers;

    const memberList = document.querySelector('.chat-room-members');
    if (memberList) {
        const memberItems = memberList.querySelectorAll('li');
        memberItems.forEach((item) => {
            const userId = item.dataset.userId;
            if (onlineUsers[userId]) {
                item.classList.add('online');
                item.classList.remove('offline');
            } else {
                item.classList.add('offline');
                item.classList.remove('online');
            }
        });
    }
});


function updateNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');

    // Clear the dropdown
    dropdown.innerHTML = '';

    // Add each chat in the lastMessages array to the dropdown
    lastMessages.forEach(({ chatRoomId, chatName, message }) => {
        let notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        notificationItem.dataset.roomId = chatRoomId;

        notificationItem.innerHTML = `
            <strong>${chatName}</strong>
            <p>${message.sender}: ${message.text}</p>
        `;

        notificationItem.addEventListener('click', () => {
            switchChatRoom(chatRoomId);
            const notificationIndicator = document.getElementById('notificationIndicator');
            notificationIndicator.style.display = 'none'; // Hide the red circle
        });

        dropdown.appendChild(notificationItem);
    });
}

// Listen for offline notifications when user comes online
socket.on('offlineNotifications', (notifications) => {
    console.log('Received offline notifications:', notifications);
    
    // Sort notifications by timestamp if available
    const sortedNotifications = notifications.sort((a, b) => {
        const aTime = a.message.timestamp ? new Date(a.message.timestamp) : new Date(0);
        const bTime = b.message.timestamp ? new Date(b.message.timestamp) : new Date(0);
        return bTime - aTime;
    });

    // Keep only the last 3 notifications
    const recentNotifications = sortedNotifications.slice(0, 3);

    // Update the notification dropdown with offline messages
    const dropdown = document.getElementById('notificationDropdown');
    recentNotifications.forEach(({ chatRoomId, message }) => {
        // Find the chat name
        const chatListItem = document.querySelector(`.chat-list-item[data-room-id="${chatRoomId}"]`);
        const chatName = chatListItem ? chatListItem.textContent.trim() : 'Unknown Chat';

        let notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        notificationItem.dataset.roomId = chatRoomId;
        notificationItem.innerHTML = `
            <strong>${chatName}</strong>
            <p>${message.sender}: ${message.text}</p>
        `;
        notificationItem.addEventListener('click', () => {
            switchChatRoom(chatRoomId);
        });
        dropdown.appendChild(notificationItem);
    });

    // If there are any notifications, show the notification indicator
    if (recentNotifications.length > 0) {
        const notificationIndicator = document.getElementById('notificationIndicator');
        const bell = document.getElementById('notificationBell');
        notificationIndicator.style.display = 'block';
        bell.classList.add('bell-animate');
    }
});