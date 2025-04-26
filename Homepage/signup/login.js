document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validate input before sending request
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    alert("All fields are required!");
    return;
  }

  // Prepare the data object
  const data = { username, password };
  const backendURL = "https://eldyn-io.onrender.com/login"; // Update if necessary

  try {
    const response = await fetch(backendURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error("Login failed. Please check your credentials.");
    }

    const result = await response.json();
    alert(result.message);
  } catch (error) {
    alert(error.message || 'Error logging in');
  }
});
