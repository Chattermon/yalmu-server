// public/admin.js

// Fetch posts and display them with admin controls
async function fetchPosts() {
    try {
      const response = await fetch('/api/posts');
      const posts = await response.json();
      displayPosts(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }
  
  function displayPosts(posts) {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = '';
  
    posts.forEach((post) => {
      const postDiv = document.createElement('div');
      postDiv.classList.add('post');
  
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
  
  async function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await fetch(`/admin/posts/${postId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          alert('Post deleted successfully.');
          fetchPosts();
        } else {
          const error = await response.json();
          alert('Error deleting post: ' + error.message);
        }
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  }
  
  // Initialize
  fetchPosts();
  