// app.js

// Initialize Socket.io
const socket = io();

// Placeholder for user information (replace with actual user data)
window.username = window.username || 'Anonymous';
window.userAvatar = window.userAvatar || 'https://i.pravatar.cc/40?u=' + window.username;

// Event listener for the submit post button
document.getElementById('submitPost').addEventListener('click', submitPost);

// Fetch and display existing posts on page load
window.onload = fetchPosts;

// Function to fetch and display existing posts
async function fetchPosts() {
    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();
        displayPosts(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        alert('Failed to load posts. Please try again later.');
    }
}

// Function to display posts
function displayPosts(posts) {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = ''; // Clear existing posts

    posts.forEach((post) => {
        const postElement = createPostElement(post);
        postsContainer.appendChild(postElement);
    });
}

// Function to create a post element
function createPostElement(post) {
    const postSection = document.createElement('div');
    postSection.classList.add('post-section');
    postSection.dataset.postId = post._id;

    // Post Header
    const postHeader = document.createElement('div');
    postHeader.classList.add('post-header');

    const authorAvatar = document.createElement('img');
    authorAvatar.src = post.authorAvatar || 'default-avatar.png';
    authorAvatar.alt = post.author;

    const headerText = document.createElement('div');

    const postTitle = document.createElement('div');
    postTitle.classList.add('post-title');
    postTitle.textContent = post.title;

    const postAuthor = document.createElement('div');
    postAuthor.classList.add('post-author');
    postAuthor.textContent = `Posted by ${post.author}`;

    headerText.appendChild(postTitle);
    headerText.appendChild(postAuthor);

    postHeader.appendChild(authorAvatar);
    postHeader.appendChild(headerText);

    // Post Content
    const postContent = document.createElement('div');
    postContent.classList.add('post-content');
    postContent.textContent = post.content;

    // Post Actions
    const postActions = document.createElement('div');
    postActions.classList.add('post-actions');

    const upvoteButton = document.createElement('button');
    upvoteButton.classList.add('upvote-button');
    upvoteButton.textContent = `Upvote (${post.upvotes})`;
    upvoteButton.addEventListener('click', () => handleUpvote(post._id, upvoteButton, downvoteButton));

    const downvoteButton = document.createElement('button');
    downvoteButton.classList.add('downvote-button');
    downvoteButton.textContent = `Downvote (${post.downvotes})`;
    downvoteButton.addEventListener('click', () => handleDownvote(post._id, upvoteButton, downvoteButton));

    postActions.appendChild(upvoteButton);
    postActions.appendChild(downvoteButton);

    // Comments Section
    const postComments = document.createElement('div');
    postComments.classList.add('post-comments');

    // Load comments
    loadComments(post._id, postComments);

    // Comment Form
    const commentForm = document.createElement('div');
    commentForm.classList.add('comment-form');

    const commentInput = document.createElement('input');
    commentInput.type = 'text';
    commentInput.classList.add('comment-input');
    commentInput.placeholder = 'Add a comment...';

    const submitCommentButton = document.createElement('button');
    submitCommentButton.classList.add('submit-comment');
    submitCommentButton.textContent = 'Comment';
    submitCommentButton.addEventListener('click', () => {
        handleSubmitComment(post._id, commentInput, postComments);
    });

    commentForm.appendChild(commentInput);
    commentForm.appendChild(submitCommentButton);

    // Assemble Post Section
    postSection.appendChild(postHeader);
    postSection.appendChild(postContent);
    postSection.appendChild(postActions);
    postSection.appendChild(postComments);
    postSection.appendChild(commentForm);

    return postSection;
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

    const postData = { title, content, author, authorAvatar };

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        });

        const data = await response.json();

        if (response.status === 201) {
            document.getElementById('postTitle').value = '';
            document.getElementById('postContent').value = '';
            // Reload posts
            fetchPosts();
        } else {
            alert(data.message || 'Failed to submit post.');
        }
    } catch (error) {
        console.error('Error submitting post:', error);
        alert('Failed to submit post. Please try again later.');
    }
}

// Handle Upvote
async function handleUpvote(postId, upvoteButton, downvoteButton) {
    try {
        const response = await fetch(`/api/posts/${postId}/upvote`, { method: 'POST' });
        const data = await response.json();
        upvoteButton.textContent = `Upvote (${data.upvotes})`;
        downvoteButton.textContent = `Downvote (${data.downvotes})`;
    } catch (error) {
        console.error('Error upvoting post:', error);
    }
}

// Handle Downvote
async function handleDownvote(postId, upvoteButton, downvoteButton) {
    try {
        const response = await fetch(`/api/posts/${postId}/downvote`, { method: 'POST' });
        const data = await response.json();
        upvoteButton.textContent = `Upvote (${data.upvotes})`;
        downvoteButton.textContent = `Downvote (${data.downvotes})`;
    } catch (error) {
        console.error('Error downvoting post:', error);
    }
}

// Load Comments
async function loadComments(postId, postComments) {
    try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        const comments = await response.json();
        postComments.innerHTML = ''; // Clear existing comments

        comments.forEach((comment) => {
            const commentElement = createCommentElement(comment);
            postComments.appendChild(commentElement);
        });
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Create Comment Element
function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.classList.add('comment');

    const commenterAvatar = document.createElement('img');
    commenterAvatar.src = comment.authorAvatar || 'default-avatar.png';
    commenterAvatar.alt = comment.author;

    const commentContent = document.createElement('div');
    commentContent.classList.add('comment-content');

    const commentAuthor = document.createElement('div');
    commentAuthor.classList.add('comment-author');
    commentAuthor.textContent = comment.author;

    const commentText = document.createElement('div');
    commentText.classList.add('comment-text');
    commentText.textContent = comment.content;

    commentContent.appendChild(commentAuthor);
    commentContent.appendChild(commentText);

    commentDiv.appendChild(commenterAvatar);
    commentDiv.appendChild(commentContent);

    return commentDiv;
}

// Handle Submit Comment
async function handleSubmitComment(postId, commentInput, postComments) {
    const content = commentInput.value.trim();
    if (!content) return;

    const commentData = {
        author: window.username,
        authorAvatar: window.userAvatar,
        content,
    };

    try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commentData),
        });

        if (response.ok) {
            commentInput.value = '';
            // Reload comments
            loadComments(postId, postComments);
        } else {
            const error = await response.json();
            console.error('Error adding comment:', error.message);
            alert('Error: ' + error.message);
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
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