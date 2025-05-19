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

// Define Chat Room Schema
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

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

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
app.get('/messages', (req, res) => {
    res.sendFile(path.join(__dirname, 'messages.html'));
});

let onlineUsers = {};
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);


    socket.on('registerUser', (userId) => {
        socket.userId = userId;
        onlineUsers[userId] = true; // Mark the user as online
        console.log(`User ${userId} is online`);
        io.emit('updateOnlineStatus', onlineUsers); 
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            delete onlineUsers[socket.userId]; // Remove the user from the online list
            console.log(`User ${socket.userId} is offline`);
            io.emit('updateOnlineStatus', onlineUsers); 
        }
    });

    // Load chats for a user
    socket.on('loadChats', async (userId) => {
        const chatRooms = await loadChatsFromDatabase(userId);
        socket.emit('loadExistingChats', chatRooms);
    });

    // Send students to the client
    socket.emit('loadStudents', students);

    // Create a new chat room
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

    // Join a chat room
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

    // Handle sending messages
    socket.on('sendMessage', async ({ chatRoomId, message }) => {
        try {
            const chatRoom = await ChatRoom.findOne({ id: chatRoomId });
            if (!chatRoom) {
                console.error('Chat room not found');
                return;
            }

            // Add the message to the chat room's messages array
            chatRoom.messages.push(message);
            await chatRoom.save();

            // Emit the new message to all clients in the chat room
            io.to(chatRoomId).emit('newMessage', { chatRoomId, message });

            // Notify all clients about the new message
            io.emit('newMessageNotification', { chatRoomId, message });
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
                socket.emit('chatMembersIdsLoaded', []); // Send an empty array if the chat room is not found
                return;
            }

            // Send the student IDs to the client
            socket.emit('chatMembersIdsLoaded', chatRoom.studentIds);
        } catch (error) {
            console.error('Error fetching chat members:', error);
            socket.emit('chatMembersIdsLoaded', []); // Send an empty array in case of an error
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
            const removedMembers = chatRoom.studentIds.filter(id => studentIds.includes(id)); // Only removed members
            chatRoom.studentIds = chatRoom.studentIds.filter(id => !studentIds.includes(id));
            await chatRoom.save();

            console.log(`Members removed from chat room ${chatRoomId}:`, removedMembers);

            // Notify all clients in the room
            io.to(chatRoomId).emit('chatRoomUpdated', chatRoom);

            // Notify removed members
            removedMembers.forEach(memberId => {
                const memberSocket = Array.from(io.sockets.sockets.values()).find(socket => socket.userId === memberId);
                if (memberSocket) {
                    memberSocket.emit('chatRoomRemoved', { chatRoomId });
                }
            });
        } catch (error) {
            console.error('Error removing members from chat room:', error);
        }
    });

    
});

// Start the Server
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    loadStudents(); // Load students when the server starts
});