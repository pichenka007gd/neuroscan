export function mountSpotlight(glow) {
  const allowed = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let frame = 0;
  let pointer;
  let position;
  let lastTime = 0;
  const follow = time => {
    frame = 0;
    const delta = Math.min(50, time - (lastTime || time - 16));
    const ease = 1 - Math.exp(-delta / 85);
    position.x += (pointer.x - position.x) * ease;
    position.y += (pointer.y - position.y) * ease;
    lastTime = time;
    const distance = Math.hypot(pointer.x - position.x, pointer.y - position.y);
    if (distance < .5) position = { ...pointer };
    glow.style.transform = `translate3d(${position.x - 320}px, ${position.y - 320}px, 0)`;
    glow.style.opacity = '1';
    if (distance >= .5) frame = requestAnimationFrame(follow);
  };
  const hide = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    glow.style.opacity = '0';
  };
  document.addEventListener('pointermove', event => {
    if (!allowed.matches || event.pointerType !== 'mouse') return;
    pointer = { x: event.clientX, y: event.clientY };
    if (!position) position = { ...pointer };
    if (frame) return;
    lastTime = 0;
    frame = requestAnimationFrame(follow);
  }, { passive: true });
  document.addEventListener('pointerleave', hide);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide, { once: true });
  allowed.addEventListener('change', hide);
}
