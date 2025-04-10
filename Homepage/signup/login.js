document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value
  };

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    alert(result.message);
  } catch (error) {
    alert('Error logging in');
  }
});
