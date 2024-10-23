// Initialize Socket.io
const socket = io();

// Function to fetch and display existing posts
async function fetchPosts() {
    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();

        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = '';

        posts.forEach((post) => {
            displayPost(post);
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        alert('Failed to load posts. Please try again later.');
    }
}

// Function to submit a new post
async function submitPost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const author = window.username;
    const authorAvatar = window.userAvatar;

    if (!title || !content) {
        alert('Please fill in both the title and content.');
        return;
    }

    const newPost = { title, content, author, authorAvatar };

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newPost),
        });

        const data = await response.json();

        if (response.status === 201) {
            displayPost(data, true);
            document.getElementById('postTitle').value = '';
            document.getElementById('postContent').value = '';
        } else {
            alert(data.message || 'Failed to submit post.');
        }
    } catch (error) {
        console.error('Error submitting post:', error);
        alert('Failed to submit post. Please try again later.');
    }
}

// Function to display a single post
function displayPost(post, isNewPost = false) {
    const postsContainer = document.getElementById('postsContainer');

    // Create post elements
    const postSection = document.createElement('div');
    postSection.classList.add('post-section');

    const postHeader = document.createElement('div');
    postHeader.classList.add('post-header');
    postHeader.innerHTML = `
        <img src="Unknown.jpeg" alt="Alluoo">
        Posted on Alluoo
    `;

    const postTitle = document.createElement('div');
    postTitle.classList.add('post-title');
    postTitle.textContent = post.title;

    const postContent = document.createElement('div');
    postContent.classList.add('post-content');
    postContent.textContent = post.content;

    const postAuthor = document.createElement('div');
    postAuthor.classList.add('post-author');
    postAuthor.innerHTML = `
        <img src="${post.authorAvatar}" alt="${post.author}'s avatar">
        <div>${post.author}</div>
    `;

    const postTimeAgo = document.createElement('div');
    postTimeAgo.classList.add('post-time-ago');
    postTimeAgo.textContent = timeSince(new Date(post.timestamp)) + ' ago';

    // Append elements to the post section
    postSection.appendChild(postHeader);
    postSection.appendChild(postTitle);
    postSection.appendChild(postContent);
    postSection.appendChild(postAuthor);
    postSection.appendChild(postTimeAgo);

    if (isNewPost) {
        // Insert the new post at the top
        postsContainer.insertBefore(postSection, postsContainer.firstChild);
    } else {
        // Append the post to the container
        postsContainer.appendChild(postSection);
    }
}

// Function to calculate time since the post was made
function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);

    if (interval >= 1) {
        return interval + ' year' + (interval > 1 ? 's' : '');
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval + ' month' + (interval > 1 ? 's' : '');
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval + ' day' + (interval > 1 ? 's' : '');
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval + ' hour' + (interval > 1 ? 's' : '');
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval + ' minute' + (interval > 1 ? 's' : '');
    }
    return Math.floor(seconds) + ' second' + (seconds > 1 ? 's' : '');
}

// Chat Functionality

// Listen for incoming chat messages
socket.on('chatMessage', (msg) => {
    addChatMessage(msg);
});

// Send message function
function sendMessage(inputElement) {
    const messageText = inputElement.value.trim();
    if (messageText === '') return;

    const message = {
        author: window.username,
        avatar: window.userAvatar,
        text: messageText,
        timestamp: new Date(),
    };

    // Emit the message to the server
    socket.emit('chatMessage', message);

    // Add the message to the UI
    addChatMessage(message);

    // Clear input
    inputElement.value = '';
}

// Function to add a chat message to the UI
function addChatMessage(message) {
    const chatMessagesDesktop = document.getElementById('chatMessages');
    const chatMessagesPopup = document.getElementById('chatMessagesPopup');

    const chatMessageDesktop = createChatMessageElement(message);
    const chatMessagePopup = createChatMessageElement(message);

    if (chatMessagesDesktop) {
        chatMessagesDesktop.appendChild(chatMessageDesktop);
        chatMessagesDesktop.scrollTop = chatMessagesDesktop.scrollHeight;
    }

    if (chatMessagesPopup) {
        chatMessagesPopup.appendChild(chatMessagePopup);
        chatMessagesPopup.scrollTop = chatMessagesPopup.scrollHeight;
    }
}

// Function to create a chat message element
function createChatMessageElement(message) {
    const chatMessage = document.createElement('div');
    chatMessage.classList.add('chat-message');

    const isOwnMessage = message.author === window.username;

    if (isOwnMessage) {
        chatMessage.classList.add('own-message');
    }

    const userIcon = document.createElement('img');
    userIcon.src = isOwnMessage ? window.userAvatar : message.avatar;
    userIcon.alt = isOwnMessage ? 'You' : message.author;

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');

    const messageUser = document.createElement('div');
    messageUser.classList.add('message-user');
    messageUser.textContent = isOwnMessage ? 'You' : message.author;

    const messageTextDiv = document.createElement('div');
    messageTextDiv.classList.add('message-text');
    messageTextDiv.textContent = message.text;

    // Assemble message
    messageContent.appendChild(messageUser);
    messageContent.appendChild(messageTextDiv);
    chatMessage.appendChild(userIcon);
    chatMessage.appendChild(messageContent);

    return chatMessage;
}

// Event listeners for send buttons
document.getElementById('sendButton').addEventListener('click', function() {
    sendMessage(document.getElementById('chatInput'));
});

document.getElementById('sendButtonPopup').addEventListener('click', function() {
    sendMessage(document.getElementById('chatInputPopup'));
});

// Event listeners for Enter key
document.getElementById('chatInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage(document.getElementById('chatInput'));
    }
});

document.getElementById('chatInputPopup').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage(document.getElementById('chatInputPopup'));
    }
});

// Chat Button and Popup
const chatButton = document.getElementById('chatButton');
const chatPopup = document.getElementById('chatPopup');

chatButton.addEventListener('click', function(event) {
    event.stopPropagation();
    chatPopup.style.display = chatPopup.style.display === 'flex' ? 'none' : 'flex';
});

// Close chat popup when clicking outside
document.addEventListener('click', function(event) {
    if (!chatPopup.contains(event.target) && !chatButton.contains(event.target)) {
        chatPopup.style.display = 'none';
    }
});

// Prevent clicks inside chat popup from closing it
chatPopup.addEventListener('click', function(event) {
    event.stopPropagation();
});

// Hamburger Icon and Vertical Navbar
const hamburgerIcon = document.getElementById('hamburgerIcon');
const verticalNavbarContainer = document.getElementById('verticalNavbarContainer');

hamburgerIcon.addEventListener('click', function(event) {
    event.stopPropagation();
    verticalNavbarContainer.style.display = verticalNavbarContainer.style.display === 'block' ? 'none' : 'block';
});

// Close vertical navbar when clicking outside
document.addEventListener('click', function(event) {
    if (!verticalNavbarContainer.contains(event.target) && !hamburgerIcon.contains(event.target)) {
        verticalNavbarContainer.style.display = 'none';
    }
});

// Prevent clicks inside vertical navbar from closing it
verticalNavbarContainer.addEventListener('click', function(event) {
    event.stopPropagation();
});

// Event listener for the submit post button
document.getElementById('submitPost').addEventListener('click', submitPost);

// Initial fetch of posts when the page loads
window.onload = fetchPosts;
