'use strict';
const modeToggle = document.getElementById("modeToggle");
const body = document.body;

modeToggle.addEventListener("click", () => {
  body.classList.toggle("light-mode");
  body.classList.toggle("dark-mode");
  modeToggle.textContent = body.classList.contains("light-mode") ? "🌙" : "☀️";
});
