'use strict';
const modeToggle = document.getElementById("modeToggle");
const body = document.body;

modeToggle.addEventListener("click", () => {
  body.classList.toggle("light-mode");
  body.classList.toggle("dark-mode");
  modeToggle.textContent = body.classList.contains("light-mode") ? "🌙" : "☀️";
});
////login 
const loginForm = document.getElementById("loginForm")
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const username = document.getElementById("username").value
    const password = document.getElementById("password").value

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Login successful!")
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(data.user))
        // Redirect to dashboard or home
        window.location.href = "/dashboard.html"
      } else {
        alert(data.message || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      alert("An error occurred during login")
    }
  })
}

// Signup form handling
const signupForm = document.getElementById("signupForm")
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const username = document.getElementById("username").value
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const userType = document.getElementById("userType").value

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, userType }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Registration successful! Please login.")
        window.location.href = "/login.html"
      } else {
        alert(data.message || "Registration failed")
      }
    } catch (error) {
      console.error("Registration error:", error)
      alert("An error occurred during registration")
    }
  })
}
 