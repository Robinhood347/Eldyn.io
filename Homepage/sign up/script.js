document.getElementById('sign-up-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    username: document.getElementById('username').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };

  try {
    const response = await fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    alert(result.message);
  } catch (error) {
    alert('Error registering user');
  }
});
