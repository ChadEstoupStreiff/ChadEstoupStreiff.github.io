const images = [
    "https://picsum.photos/id/237/200/200",
    "https://picsum.photos/id/238/200/200"
  ];

  // Preload
  images.forEach(u => { const im = new Image(); im.src = u; });

  const el = document.getElementById("badgeImg");
  let idx = 0;

  setInterval(() => {
    idx = 1 - idx;          // toggles 0 ↔ 1
    el.style.opacity = 0;   // quick fade
    requestAnimationFrame(() => {
      el.src = images[idx];
      el.onload = () => (el.style.opacity = 1);
    });
  }, 1000);