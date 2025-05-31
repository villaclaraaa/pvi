const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');

// Initialize Express app and middleware
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/pvi', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

//Chat Room Schema
const chatRoomSchema = new mongoose.Schema({
    id: String,
    name: String,
    studentIds: [String],
    messages: [
        {
            sender: String,
            text: String,
            timestamp: { type: Date, default: Date.now },
        },
    ],
});

// Offline Notification Schema
const offlineNotificationSchema = new mongoose.Schema({
    userId: String,
    notifications: [{
        chatRoomId: String,
        message: {
            sender: String,
            text: String,
            timestamp: { type: Date, default: Date.now }
        }
    }]
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
const OfflineNotification = mongoose.model('OfflineNotification', offlineNotificationSchema);

let students = [];

async function loadChatsFromDatabase(userId) {
    try {
        const chatRooms = await ChatRoom.find({ studentIds: userId });
        console.log(`Chats loaded from MongoDB for user ${userId}:`, chatRooms);
        return chatRooms;
    } catch (error) {
        console.error('Error loading chats from MongoDB:', error);
        return [];
    }
}

async function loadStudents() {
    try {
        const response = await axios.get('http://localhost/students_load.php');
        students = response.data;
        console.log('Students loaded successfully');
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function generateRoomId() {
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
}

app.use(express.static(path.join(__dirname, '/')));

// Route for the Index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for the Messages page
app.get('/messages', (req, res) => {
    res.sendFile(path.join(__dirname, 'messages.html'));
});

let onlineUsers = {};
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);


    socket.on('registerUser', async (userId) => {
        socket.userId = userId;
        onlineUsers[userId] = true;
        console.log(`User ${userId} is online`);
        io.emit('updateOnlineStatus', onlineUsers);

        // Check for offline notifications
        try {
            const offlineNotifications = await OfflineNotification.findOne({ userId });
            if (offlineNotifications && offlineNotifications.notifications.length > 0) {
                // Send stored notifications to the user
                socket.emit('offlineNotifications', offlineNotifications.notifications);
                // Clear the notifications
                await OfflineNotification.findOneAndUpdate(
                    { userId },
                    { notifications: [] }
                );
            }
        } catch (error) {
            console.error('Error handling offline notifications:', error);
        }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            delete onlineUsers[socket.userId]; // Remove the user from the online list
            console.log(`User ${socket.userId} is offline`);
            io.emit('updateOnlineStatus', onlineUsers);
        }
    });

    // Handle explicit user logout
    socket.on('userLogout', () => {
        if (socket.userId) {
            delete onlineUsers[socket.userId]; // Remove the user from the online list
            console.log(`User ${socket.userId} logged out`);
            io.emit('updateOnlineStatus', onlineUsers);
            socket.userId = null; // Clear the userId from socket
        }
    });

    socket.on('loadChats', async (userId) => {
    const chatRooms = await loadChatsFromDatabase(userId);
    const chatsWithLastMessage = chatRooms.map(chatRoom => ({
        id: chatRoom.id,
        name: chatRoom.name,
        studentIds: chatRoom.studentIds, // Include studentIds
        lastMessage: chatRoom.messages.length > 0
            ? chatRoom.messages[chatRoom.messages.length - 1]
            : { sender: 'System', text: 'No messages yet', timestamp: 0 }
    }));
    socket.emit('loadExistingChats', chatsWithLastMessage);
});

    socket.emit('loadStudents', students);

    socket.on('createChatRoomWithStudents', async ({ roomName, studentIds, userId }) => {
        const newRoomId = generateRoomId();

        if (!studentIds.includes(userId)) {
            studentIds.push(userId);
        }

        const newRoom = {
            id: newRoomId,
            name: roomName,
            studentIds,
            messages: [],
        };

        try {
            const chatRoom = new ChatRoom(newRoom);
            await chatRoom.save();

            console.log('New chat room created:', newRoom);

            // Notify all clients about the new chat room
            io.emit('newChatRoom', newRoom);
            console.log('New chat room emitted to all clients:', newRoom);

            // Load only the chat rooms for the current user
            const chatRooms = await loadChatsFromDatabase(userId);
            console.log('Filtered chat rooms for user:', userId, chatRooms);
            //socket.emit('loadExistingChats', chatRooms);

            // Add the socket to the new room
            socket.join(newRoomId);
        } catch (error) {
            console.error('Error creating chat room:', error.message);
            console.error('Stack trace:', error.stack);
            console.error('New room data:', newRoom);
        }
    });

    socket.on('joinChatRoom', (roomId) => {
        // Leave all other rooms except the socket's own room
        Array.from(socket.rooms).forEach((room) => {
            if (room !== socket.id) {
                socket.leave(room);
            }
        });

        // Join the new room
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('sendMessage', async ({ chatRoomId, message }) => {
        try {
            const chatRoom = await ChatRoom.findOne({ id: chatRoomId });
            if (!chatRoom) {
                console.error('Chat room not found');
                return;
            }

            chatRoom.messages.push(message);
            await chatRoom.save();

            // Emit the new message to all clients in the chat room
            io.to(chatRoomId).emit('newMessage', { chatRoomId, message });

            // Handle notifications for all members
            for (const studentId of chatRoom.studentIds) {
                if (onlineUsers[studentId]) {
                    // User is online - send real-time notification
                    const userSocket = Array.from(io.sockets.sockets.values())
                        .find(s => s.userId === studentId);
                    if (userSocket) {
                        userSocket.emit('newMessageNotification', { chatRoomId, message });
                    }
                } else {
                    // User is offline - store notification
                    try {
                        await OfflineNotification.findOneAndUpdate(
                            { userId: studentId },
                            {
                                $push: {
                                    notifications: { chatRoomId, message }
                                }
                            },
                            { upsert: true }
                        );
                    } catch (error) {
                        console.error('Error storing offline notification:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    // Handle fetching messages for a chat room
    socket.on('getMessages', async (chatRoomId) => {
        try {
            const chatRoom = await ChatRoom.findOne({ id: chatRoomId });

            if (!chatRoom) {
                console.error('Chat room not found');
                return;
            }

            // Send the messages to the client
            socket.emit('messagesLoaded', chatRoom.messages);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    });

    socket.on('getChatMembersIds', async (chatRoomId) => {
        try {
            const chatRoom = await ChatRoom.findOne({ id: chatRoomId });

            if (!chatRoom) {
                console.error('Chat room not found');
                socket.emit('chatMembersIdsLoaded', []);
                return;
            }

            // Send the student IDs to the client
            socket.emit('chatMembersIdsLoaded', chatRoom.studentIds);
        } catch (error) {
            console.error('Error fetching chat members:', error);
            socket.emit('chatMembersIdsLoaded', []);
        }
    });


    socket.on('addMemberToChat', async ({ chatRoomId, studentIds }) => {
        try {
            const chatRoom = await ChatRoom.findOne({ id: chatRoomId });
            if (!chatRoom) {
                console.error('Chat room not found');
                return;
            }

            // Add new members to the chat room
            const newMembers = studentIds.filter(id => !chatRoom.studentIds.includes(id)); // Only new members
            chatRoom.studentIds = [...new Set([...chatRoom.studentIds, ...studentIds])];
            await chatRoom.save();

            console.log(`Members added to chat room ${chatRoomId}:`, newMembers);

            // Notify all clients in the room
            io.to(chatRoomId).emit('chatRoomUpdated', chatRoom);

            // Notify newly added members
            newMembers.forEach(memberId => {
                const memberSocket = Array.from(io.sockets.sockets.values()).find(socket => socket.userId === memberId);
                if (memberSocket) {
                    memberSocket.emit('newChatRoom', chatRoom);
                }
            });
        } catch (error) {
            console.error('Error adding members to chat room:', error);
        }
    });

    socket.on('removeMemberFromChat', async ({ chatRoomId, studentIds }) => {
        try {
            const chatRoom = await ChatRoom.findOne({ id: chatRoomId });
            if (!chatRoom) {
                console.error('Chat room not found');
                return;
            }

            // Remove members from the chat room
            const removedMembers = chatRoom.studentIds.filter(id => studentIds.includes(id));
            chatRoom.studentIds = chatRoom.studentIds.filter(id => !studentIds.includes(id));
            await chatRoom.save();

            console.log(`Members removed from chat room ${chatRoomId}:`, removedMembers);

            // Notify all clients in the room
            io.to(chatRoomId).emit('chatRoomUpdated', chatRoom);

            // Clean up notifications for removed members
            for (const memberId of removedMembers) {
                try {
                    // Remove any stored offline notifications for this chat room
                    await OfflineNotification.updateMany(
                        { userId: memberId },
                        { $pull: { notifications: { chatRoomId: chatRoomId } } }
                    );

                    // Notify the removed member's socket
                    const memberSocket = Array.from(io.sockets.sockets.values())
                        .find(socket => socket.userId === memberId);
                    if (memberSocket) {
                        memberSocket.emit('chatRoomRemoved', { chatRoomId });
                        memberSocket.leave(chatRoomId); // Remove from socket room
                    }
                } catch (error) {
                    console.error(`Error cleaning up notifications for member ${memberId}:`, error);
                }
            }

            // If the chat room is empty (no members left), delete it
            if (chatRoom.studentIds.length === 0) {
                await ChatRoom.deleteOne({ id: chatRoomId });
                console.log(`Empty chat room ${chatRoomId} deleted`);
            }
        } catch (error) {
            console.error('Error removing members from chat room:', error);
        }
    });


});

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    loadStudents();
});