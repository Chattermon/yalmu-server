// app.js

// Initialize Socket.io
const socket = io();

// Placeholder for user information (replace with actual user data)
window.username = window.username || 'Anonymous';
window.userAvatar = window.userAvatar || 'https://i.pravatar.cc/40?u=' + window.username;

// Event listener for the submit post button
document.getElementById('submitPost').addEventListener('click', submitPost);

// Fetch and display existing posts on page load
window.onload = function () {
  fetchPosts();
  // Optionally, load the poll when the page loads
  // loadPoll();
};

// Store user votes in localStorage
let userVotes = JSON.parse(localStorage.getItem('userVotes')) || { posts: {}, comments: {} };
let pollUserVotes = JSON.parse(localStorage.getItem('pollVotes')) || {};

// Function to update localStorage for post and comment votes
function saveUserVotes() {
  localStorage.setItem('userVotes', JSON.stringify(userVotes));
}

// Function to update localStorage for poll votes
function savePollUserVotes() {
  localStorage.setItem('pollVotes', JSON.stringify(pollUserVotes));
}

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

  const headerLeft = document.createElement('div');
  headerLeft.classList.add('header-left');

  const authorAvatar = document.createElement('img');
  authorAvatar.src = post.authorAvatar || 'default-avatar.png';
  authorAvatar.alt = post.author;
  authorAvatar.classList.add('avatar');

  const authorInfo = document.createElement('div');
  authorInfo.classList.add('author-info');

  const postAuthor = document.createElement('span');
  postAuthor.classList.add('post-author');
  postAuthor.textContent = post.author;

  const dotSeparator = document.createElement('span');
  dotSeparator.classList.add('dot-separator');
  dotSeparator.textContent = '·';

  const postTime = document.createElement('span');
  postTime.classList.add('post-time');
  postTime.textContent = formatTime(post.timestamp);

  authorInfo.appendChild(postAuthor);
  authorInfo.appendChild(dotSeparator);
  authorInfo.appendChild(postTime);

  headerLeft.appendChild(authorAvatar);
  headerLeft.appendChild(authorInfo);

  postHeader.appendChild(headerLeft);

  // Post Title
  const postTitle = document.createElement('div');
  postTitle.classList.add('post-title');
  postTitle.textContent = post.title;

  // Post Content
  const postContent = document.createElement('div');
  postContent.classList.add('post-content');
  postContent.textContent = post.content;

  // Post Actions
  const postActions = document.createElement('div');
  postActions.classList.add('post-actions');

  const upvoteButton = document.createElement('button');
  upvoteButton.classList.add('vote-button', 'upvote-button');
  upvoteButton.innerHTML = `<i class="${userVotes.posts[post._id] === 1 ? 'fas' : 'far'} fa-thumbs-up"></i><span>${post.upvotes}</span>`;

  const downvoteButton = document.createElement('button');
  downvoteButton.classList.add('vote-button', 'downvote-button');
  downvoteButton.innerHTML = `<i class="${userVotes.posts[post._id] === -1 ? 'fas' : 'far'} fa-thumbs-down"></i><span>${post.downvotes}</span>`;

  // Attach event listeners after both buttons are defined
  upvoteButton.addEventListener('click', () => handlePostVote(post._id, 1, upvoteButton, downvoteButton));
  downvoteButton.addEventListener('click', () => handlePostVote(post._id, -1, upvoteButton, downvoteButton));

  // Apply 'voted' class if user has voted
  if (userVotes.posts[post._id] === 1) {
    upvoteButton.classList.add('voted');
  } else if (userVotes.posts[post._id] === -1) {
    downvoteButton.classList.add('voted');
  }

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
  postSection.appendChild(postTitle);
  postSection.appendChild(postContent);
  postSection.appendChild(postActions);
  postSection.appendChild(postComments);
  postSection.appendChild(commentForm);

  return postSection;
}

// Function to format timestamp
function formatTime(timestamp) {
  const time = new Date(timestamp);
  const now = new Date();
  const diff = (now - time) / 1000; // Difference in seconds

  if (diff < 60) {
    return 'Just now';
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diff / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
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

// Handle Post Vote
async function handlePostVote(postId, voteValue, upvoteButton, downvoteButton) {
  const currentVote = userVotes.posts[postId] || 0;

  if (currentVote === voteValue) {
    alert(`You have already ${voteValue === 1 ? 'upvoted' : 'downvoted'} this post.`);
    return;
  }

  const voteType = voteValue === 1 ? 'upvote' : 'downvote';

  try {
    const response = await fetch(`/api/posts/${postId}/${voteType}`, { method: 'POST' });
    const data = await response.json();

    if (response.ok) {
      // Update UI
      upvoteButton.querySelector('span').textContent = data.upvotes;
      downvoteButton.querySelector('span').textContent = data.downvotes;

      // Update buttons
      if (voteValue === 1) {
        upvoteButton.classList.add('voted');
        upvoteButton.querySelector('i').classList.replace('far', 'fas');
        downvoteButton.classList.remove('voted');
        downvoteButton.querySelector('i').classList.replace('fas', 'far');
      } else {
        downvoteButton.classList.add('voted');
        downvoteButton.querySelector('i').classList.replace('far', 'fas');
        upvoteButton.classList.remove('voted');
        upvoteButton.querySelector('i').classList.replace('fas', 'far');
      }

      // Save vote
      userVotes.posts[postId] = voteValue;
      saveUserVotes();
    } else {
      alert(data.message || 'Failed to vote on post.');
    }
  } catch (error) {
    console.error('Error voting on post:', error);
  }
}

// Load Comments
async function loadComments(postId, postComments) {
  try {
    const response = await fetch(`/api/posts/${postId}/comments`);
    const comments = await response.json();
    postComments.innerHTML = ''; // Clear existing comments

    comments.forEach((comment) => {
      const commentElement = createCommentElement(comment, postId);
      postComments.appendChild(commentElement);
    });
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

// Create Comment Element
function createCommentElement(comment, postId) {
  const commentDiv = document.createElement('div');
  commentDiv.classList.add('comment');
  commentDiv.dataset.commentId = comment._id;

  // Comment Header
  const commentHeader = document.createElement('div');
  commentHeader.classList.add('comment-header');

  const commenterAvatar = document.createElement('img');
  commenterAvatar.src = comment.authorAvatar || 'default-avatar.png';
  commenterAvatar.alt = comment.author;
  commenterAvatar.classList.add('avatar');

  const commenterInfo = document.createElement('div');
  commenterInfo.classList.add('commenter-info');

  const commentAuthor = document.createElement('span');
  commentAuthor.classList.add('comment-author');
  commentAuthor.textContent = comment.author;

  const dotSeparator = document.createElement('span');
  dotSeparator.classList.add('dot-separator');
  dotSeparator.textContent = '·';

  const commentTime = document.createElement('span');
  commentTime.classList.add('comment-time');
  commentTime.textContent = formatTime(comment.timestamp);

  commenterInfo.appendChild(commentAuthor);
  commenterInfo.appendChild(dotSeparator);
  commenterInfo.appendChild(commentTime);

  commentHeader.appendChild(commenterAvatar);
  commentHeader.appendChild(commenterInfo);

  // Comment Content
  const commentText = document.createElement('div');
  commentText.classList.add('comment-text');
  commentText.textContent = comment.content;

  // Comment Actions
  const commentActions = document.createElement('div');
  commentActions.classList.add('comment-actions');

  const upvoteButton = document.createElement('button');
  upvoteButton.classList.add('vote-button', 'upvote-button');
  upvoteButton.innerHTML = `<i class="${userVotes.comments[comment._id] === 1 ? 'fas' : 'far'} fa-thumbs-up"></i><span>${comment.upvotes}</span>`;

  const downvoteButton = document.createElement('button');
  downvoteButton.classList.add('vote-button', 'downvote-button');
  downvoteButton.innerHTML = `<i class="${userVotes.comments[comment._id] === -1 ? 'fas' : 'far'} fa-thumbs-down"></i><span>${comment.downvotes}</span>`;

  // Attach event listeners after both buttons are defined
  upvoteButton.addEventListener('click', () => handleCommentVote(postId, comment._id, 1, upvoteButton, downvoteButton));
  downvoteButton.addEventListener('click', () => handleCommentVote(postId, comment._id, -1, upvoteButton, downvoteButton));

  // Apply 'voted' class if user has voted
  if (userVotes.comments[comment._id] === 1) {
    upvoteButton.classList.add('voted');
  } else if (userVotes.comments[comment._id] === -1) {
    downvoteButton.classList.add('voted');
  }

  commentActions.appendChild(upvoteButton);
  commentActions.appendChild(downvoteButton);

  // Assemble Comment Div
  commentDiv.appendChild(commentHeader);
  commentDiv.appendChild(commentText);
  commentDiv.appendChild(commentActions);

  return commentDiv;
}

// Handle Comment Vote
async function handleCommentVote(postId, commentId, voteValue, upvoteButton, downvoteButton) {
  const currentVote = userVotes.comments[commentId] || 0;

  if (currentVote === voteValue) {
    alert(`You have already ${voteValue === 1 ? 'upvoted' : 'downvoted'} this comment.`);
    return;
  }

  const voteType = voteValue === 1 ? 'upvote' : 'downvote';

  try {
    const response = await fetch(`/api/posts/${postId}/comments/${commentId}/${voteType}`, { method: 'POST' });
    const data = await response.json();

    if (response.ok) {
      // Update UI
      upvoteButton.querySelector('span').textContent = data.upvotes;
      downvoteButton.querySelector('span').textContent = data.downvotes;

      // Update buttons
      if (voteValue === 1) {
        upvoteButton.classList.add('voted');
        upvoteButton.querySelector('i').classList.replace('far', 'fas');
        downvoteButton.classList.remove('voted');
        downvoteButton.querySelector('i').classList.replace('fas', 'far');
      } else {
        downvoteButton.classList.add('voted');
        downvoteButton.querySelector('i').classList.replace('far', 'fas');
        upvoteButton.classList.remove('voted');
        upvoteButton.querySelector('i').classList.replace('fas', 'far');
      }

      // Save vote
      userVotes.comments[commentId] = voteValue;
      saveUserVotes();
    } else {
      alert(data.message || 'Failed to vote on comment.');
    }
  } catch (error) {
    console.error('Error voting on comment:', error);
  }
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
document.getElementById('sendButton').addEventListener('click', function () {
  sendMessage(document.getElementById('chatInput'));
});

document.getElementById('sendButtonPopup').addEventListener('click', function () {
  sendMessage(document.getElementById('chatInputPopup'));
});

// Event listeners for Enter key
document.getElementById('chatInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    sendMessage(document.getElementById('chatInput'));
  }
});

document.getElementById('chatInputPopup').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    sendMessage(document.getElementById('chatInputPopup'));
  }
});

// Chat Button and Popup
const chatButton = document.getElementById('chatButton');
const chatPopup = document.getElementById('chatPopup');

chatButton.addEventListener('click', function (event) {
  event.stopPropagation();
  chatPopup.style.display = chatPopup.style.display === 'flex' ? 'none' : 'flex';
});

// Close chat popup when clicking outside
document.addEventListener('click', function (event) {
  if (!chatPopup.contains(event.target) && !chatButton.contains(event.target)) {
    chatPopup.style.display = 'none';
  }
});

// Prevent clicks inside chat popup from closing it
chatPopup.addEventListener('click', function (event) {
  event.stopPropagation();
});

// Hamburger Icon and Vertical Navbar
const hamburgerIcon = document.getElementById('hamburgerIcon');
const verticalNavbarContainer = document.getElementById('verticalNavbarContainer');

hamburgerIcon.addEventListener('click', function (event) {
  event.stopPropagation();
  verticalNavbarContainer.style.display = verticalNavbarContainer.style.display === 'block' ? 'none' : 'block';
});

// Close vertical navbar when clicking outside
document.addEventListener('click', function (event) {
  if (!verticalNavbarContainer.contains(event.target) && !hamburgerIcon.contains(event.target)) {
    verticalNavbarContainer.style.display = 'none';
  }
});

// Prevent clicks inside vertical navbar from closing it
verticalNavbarContainer.addEventListener('click', function (event) {
  event.stopPropagation();
});

// -----------------------------------
// Poll Functionality
// -----------------------------------

// Event listener for the poll button
document.getElementById('pollButton').addEventListener('click', openPollPopup);

// Event listener for the close button in the poll popup
document.getElementById('closePollPopup').addEventListener('click', closePollPopup);

// Function to open the poll popup
async function openPollPopup() {
  try {
    const response = await fetch('/api/polls');
    if (response.ok) {
      const poll = await response.json();
      displayPoll(poll);
      document.getElementById('pollPopup').style.display = 'block';
    } else if (response.status === 404) {
      alert('No active poll at the moment.');
    } else {
      const error = await response.json();
      console.error('Error fetching poll:', error.message);
    }
  } catch (error) {
    console.error('Error fetching poll:', error);
  }
}

// Function to close the poll popup
function closePollPopup() {
  document.getElementById('pollPopup').style.display = 'none';
}

// Close the poll popup when clicking outside of it
window.addEventListener('click', function (event) {
  const pollPopup = document.getElementById('pollPopup');
  if (event.target == pollPopup) {
    pollPopup.style.display = 'none';
  }
});

// Function to display the poll
function displayPoll(poll) {
  const pollQuestion = document.getElementById('pollQuestion');
  const pollOptionsContainer = document.getElementById('pollOptions');
  const pollMessage = document.getElementById('pollMessage');
  const pollContent = document.getElementById('pollContent');

  pollQuestion.textContent = poll.question;
  pollOptionsContainer.innerHTML = '';
  pollMessage.style.display = 'none';
  pollContent.style.display = 'block';

  // Check if user has already voted
  const hasVoted = pollUserVotes[poll._id] !== undefined;

  poll.options.forEach((option, index) => {
    const optionDiv = document.createElement('div');
    optionDiv.classList.add('poll-option');
    if (hasVoted) {
      optionDiv.classList.add('disabled');
      if (pollUserVotes[poll._id] === index) {
        optionDiv.classList.add('selected');
      }
    }
    optionDiv.dataset.optionIndex = index;

    const optionText = document.createElement('span');
    optionText.classList.add('option-text');
    optionText.textContent = option.text;

    const optionVotes = document.createElement('span');
    optionVotes.classList.add('option-votes');
    if (hasVoted) {
      optionVotes.textContent = `${option.votes} votes`;
    } else {
      optionVotes.textContent = '';
    }

    optionDiv.appendChild(optionText);
    optionDiv.appendChild(optionVotes);

    if (!hasVoted) {
      optionDiv.addEventListener('click', () => submitPollVote(poll._id, index));
    }

    pollOptionsContainer.appendChild(optionDiv);
  });
}

// Function to submit poll vote
async function submitPollVote(pollId, optionIndex) {
  try {
    const response = await fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionIndex }),
    });

    if (response.ok) {
      // Save the vote in localStorage
      pollUserVotes[pollId] = optionIndex;
      savePollUserVotes();

      // Display thank you message and close popup after some time
      const pollMessage = document.getElementById('pollMessage');
      const pollContent = document.getElementById('pollContent');
      pollContent.style.display = 'none';
      pollMessage.style.display = 'block';

      // Reload the poll to show updated results
      loadPoll();

      setTimeout(() => {
        closePollPopup();
      }, 2000);
    } else {
      const error = await response.json();
      console.error('Error submitting vote:', error.message);
      alert('Error: ' + error.message);
    }
  } catch (error) {
    console.error('Error submitting vote:', error);
  }
}

// Function to load the poll (optional if needed)
async function loadPoll() {
  try {
    const response = await fetch('/api/polls');
    if (response.ok) {
      const poll = await response.json();
      displayPoll(poll);
    } else if (response.status === 404) {
      console.log('No active poll at the moment.');
      document.getElementById('pollButtonContainer').style.display = 'none';
    } else {
      const error = await response.json();
      console.error('Error fetching poll:', error.message);
    }
  } catch (error) {
    console.error('Error fetching poll:', error);
  }
}

// -----------------------------------
// End of app.js
// -----------------------------------
