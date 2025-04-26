document.getElementById("startGame").addEventListener("click", function() {
  document.getElementById("homepage").style.display = "none"; 
  document.getElementById("gameplay").style.display = "block"; 
});

document.getElementById('sign-up-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    username: document.getElementById('username').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };

  if (!data.username || !data.email || !data.password) {
    alert("All fields are required!");
    return;
  }

  const backendURL = "https://eldyn-io.onrender.com/signup";

  try {
    const response = await fetch(backendURL, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    alert(result.message);
  } catch (error) {
    alert('Error registering user');
  }
});
