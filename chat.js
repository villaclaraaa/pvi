const socket = io('http://localhost:3000'); 


function getUsernameFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get("username");
}
function getUserIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get("userId");
}

document.addEventListener("DOMContentLoaded", function () {

    const userId = getUserIdFromQuery();
    if (userId) {
        socket.emit('registerUser', userId); 
    }

    let username = getUsernameFromQuery();
    if (username) {
        sessionStorage.setItem("username", username); // Ensure it's stored in session storage
        document.getElementById('username').innerText = username;
        const userId = getUserIdFromQuery();
        console.log('User ID:', userId);
        socket.emit('loadChats', userId); // Load chats for the user
    } else {
        alert("Username not found. Please log in again.");
        window.location.href = "/";
    }

    
    // Attach event listener to the "+" button in chat-room-members
    const addMemberButton = document.getElementById('addMemberButton');
    if (addMemberButton) {
        addMemberButton.addEventListener('click', () => {
            addMemberToChat();
        });
    }

    // Attach event listener to the "-" button in chat-room-members
    const removeMemberButton = document.getElementById('removeMemberButton');
    if (removeMemberButton) {
        removeMemberButton.addEventListener('click', () => {
            removeMemberFromChat();
        });
    }

    // Attach event listener to the new chat button in chat-list-header
    const newChatRoomButton = document.querySelector('.chat-list-header button');
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

    const bell = document.getElementById('notificationBell');
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

            // Optionally scroll to the new message or highlight it
            console.log('Opening chat room with new message:', message);
        }
    });
});

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

            // Add the "-" button to open the remove member modal
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
                removeMemberFromChat(); // Open the remove member modal
            });
            memberList.appendChild(removeMemberButton);

            // Add the "+" button to open the add member modal
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
                addMemberToChat(); // Open the add member modal
            });
            memberList.appendChild(addMemberButton);

            // Add each member to the list
            studentIds.forEach((studentId) => {
                const student = allStudents.find(s => s.id === studentId);
                if (student) {
                    const listItem = document.createElement('li');
                    listItem.dataset.userId = student.id;
                    listItem.textContent = `${student.firstName} ${student.lastName}`;
                    listItem.classList.add(onlineUsers[student.id] ? 'online' : 'offline');
                    memberList.appendChild(listItem);
                }
            });
        }
    });
}

socket.on('newMessageNotification', ({ chatRoomId, message }) => {
    if (chatRoomId !== currentChatRoomId) {
        // Trigger the bell animation
        const notificationIndicator = document.getElementById('notificationIndicator');
        notificationIndicator.style.display = 'block'; // Show the notification indicator

        const bell = document.getElementById('notificationBell');
        bell.classList.add('bell-animate'); // Add animation class

        // Store the chatRoomId and message for when the bell is clicked
        bell.dataset.chatRoomId = chatRoomId;
        bell.dataset.message = JSON.stringify(message);
    }
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
        console.log("added message:", message); 
        
        messageDiv.innerHTML = `<strong>${message.sender}</strong> ${message.text}`;
        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight; // Scroll to bottom
    }
}

// Function to open the add member modal
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
        modal.remove(); // Close the modal
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

// Function to create a new chat room
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

// Function to remove a member from the chat
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