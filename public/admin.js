// public/admin.js

// Function to fetch and display posts
async function fetchPosts() {
    try {
      const response = await fetch('/admin/posts');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const posts = await response.json();
      displayPosts(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      document.getElementById('postsContainer').innerHTML =
        '<p class="error-message">Error loading posts.</p>';
    }
  }
  
  // Function to display posts in the admin dashboard
  function displayPosts(posts) {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = '';
  
    if (posts.length === 0) {
      postsContainer.innerHTML = '<p class="no-data">No posts available.</p>';
      return;
    }
  
    posts.forEach((post) => {
      const postDiv = document.createElement('div');
      postDiv.classList.add('item');
  
      const title = document.createElement('h4');
      title.textContent = post.title;
  
      const content = document.createElement('p');
      content.textContent = post.content;
  
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete Post';
      deleteButton.addEventListener('click', () => deletePost(post._id));
  
      postDiv.appendChild(title);
      postDiv.appendChild(content);
      postDiv.appendChild(deleteButton);
  
      postsContainer.appendChild(postDiv);
    });
  }
  
  // Function to delete a post
  async function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await fetch(`/admin/posts/${postId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          alert('Post deleted successfully.');
          fetchPosts(); // Refresh the list of posts
        } else {
          const errorData = await response.json();
          alert('Error deleting post: ' + errorData.message);
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('An error occurred while deleting the post.');
      }
    }
  }
  
  // Function to fetch and display polls
  async function fetchPolls() {
    try {
      const response = await fetch('/admin/polls');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const polls = await response.json();
      displayPolls(polls);
    } catch (error) {
      console.error('Error fetching polls:', error);
      document.getElementById('pollsContainer').innerHTML =
        '<p class="error-message">Error loading polls.</p>';
    }
  }
  
  // Function to display polls in the admin dashboard
  function displayPolls(polls) {
    const pollsContainer = document.getElementById('pollsContainer');
    pollsContainer.innerHTML = '';
  
    if (polls.length === 0) {
      pollsContainer.innerHTML = '<p class="no-data">No polls available.</p>';
      return;
    }
  
    polls.forEach((poll) => {
      const pollDiv = document.createElement('div');
      pollDiv.classList.add('item');
  
      const question = document.createElement('h4');
      question.textContent = poll.question;
  
      const optionsList = document.createElement('ul');
      poll.options.forEach((option) => {
        const optionItem = document.createElement('li');
        optionItem.textContent = `${option.option}: ${option.votes} votes`;
        optionsList.appendChild(optionItem);
      });
  
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete Poll';
      deleteButton.addEventListener('click', () => deletePoll(poll._id));
  
      pollDiv.appendChild(question);
      pollDiv.appendChild(optionsList);
      pollDiv.appendChild(deleteButton);
  
      pollsContainer.appendChild(pollDiv);
    });
  }
  
  // Function to delete a poll
  async function deletePoll(pollId) {
    if (confirm('Are you sure you want to delete this poll?')) {
      try {
        const response = await fetch(`/admin/polls/${pollId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          alert('Poll deleted successfully.');
          fetchPolls(); // Refresh the list of polls
        } else {
          const errorData = await response.json();
          alert('Error deleting poll: ' + errorData.message);
        }
      } catch (error) {
        console.error('Error deleting poll:', error);
        alert('An error occurred while deleting the poll.');
      }
    }
  }
  
  // Initialize the dashboard by fetching posts and polls
  fetchPosts();
  fetchPolls();
  