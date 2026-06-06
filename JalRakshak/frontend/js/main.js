// ===== JALRAKSHAK — MAIN JS =====

// Scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.module-section').forEach(section => {
  section.style.opacity = '0';
  section.style.transform = 'translateY(30px)';
  section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(section);
});

// Smooth nav link scroll
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href.startsWith('#')) {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Utilities
function lerp(a, b, t) { return a + (b - a) * t; }
function randomInRange(min, max) { return Math.random() * (max - min) + min; }

function animateValue(id, from, to, duration, suffix = '') {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    el.textContent = Math.round(lerp(from, to, eased)) + suffix;
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function setBarWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(100, pct) + '%';
}

// Init all modules on DOM load
window.addEventListener('DOMContentLoaded', () => {
  initRainMap();
  initTwinCanvas();
  initTractorCanvas();
  initGauge();
  initSatGrid();
  updateTranspiration();
});
const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");

        themeToggle.textContent =
            document.body.classList.contains("light-mode")
                ? "☀️"
                : "🌙";
    });
}
const chatBtn = document.getElementById("chatBtn");
const chatBox = document.getElementById("chatBox");

chatBtn.onclick = () => {

    if(chatBox.style.display==="block"){
        chatBox.style.display="none";
    }
    else{
        chatBox.style.display="block";
    }

};


function reply(command){

    let response="";

    switch(command){

        case "Water Status":
            response="💧 Soil moisture is 72%. Irrigation not required.";
            break;

        case "Weather Forecast":
            response="🌦 No rainfall expected in next 24 hours.";
            break;

        case "Disease Detection":
            response="🌿 No disease symptoms detected.";
            break;

        case "Start Irrigation":
            response="🚿 Irrigation system activated.";
            break;

    }

    document.querySelector(".bot-message").innerHTML=response;

}
