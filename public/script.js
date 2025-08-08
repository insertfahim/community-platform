function toggleMenu() {
  const navLinks = document.getElementById('nav-links');
  navLinks.classList.toggle('hidden');
}

document.addEventListener('click', function(event) {
  const navbar = document.querySelector('.navbar');
  const navLinks = document.getElementById('nav-links');
  
  if (!navbar.contains(event.target)) {
    navLinks.classList.add('hidden');
  }
});

document.addEventListener('DOMContentLoaded', function() {
  
  window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.image-container img');
    const speed = scrolled * 0.1;
    
    if (parallax) {
      parallax.style.transform = `translateY(${speed}px)`;
    }
  });

  
  const words = document.querySelectorAll('.word');
  words.forEach(word => {
    word.addEventListener('click', function() {
      this.style.animation = 'none';
      this.offsetHeight; // Trigger reflow
      this.style.animation = 'bounce 0.6s ease';
    });
  });
});


const style = document.createElement('style');
style.textContent = `
  @keyframes bounce {
    0%, 20%, 60%, 100% {
      transform: translateY(0) scale(1);
    }
    40% {
      transform: translateY(-20px) scale(1.1);
    }
    80% {
      transform: translateY(-10px) scale(1.05);
    }
  }
`;
document.head.appendChild(style);