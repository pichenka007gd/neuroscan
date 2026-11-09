export function mountSpotlight(glow) {
  const allowed = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let frame = 0;
  let pointer;
  const hide = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    glow.style.opacity = '0';
  };
  document.addEventListener('pointermove', event => {
    if (!allowed.matches || event.pointerType !== 'mouse') return;
    pointer = { x: event.clientX, y: event.clientY };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      glow.style.transform = `translate3d(${pointer.x - 160}px, ${pointer.y - 160}px, 0)`;
      glow.style.opacity = '1';
    });
  }, { passive: true });
  document.addEventListener('pointerleave', hide);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide, { once: true });
  allowed.addEventListener('change', hide);
}
