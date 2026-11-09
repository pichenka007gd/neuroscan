import * as THREE from 'three';
import { NRRDLoader } from 'three/addons/loaders/NRRDLoader.js';
import './viewer.css';

const ROI = new THREE.Vector3(0.43, 0.25, 0.12);
const LIMIT = 55000;
const ANALYSIS = 'Обнаружено локальное изменение интенсивности. Требуется оценка специалиста.';
const ROTATION_HINT = 'Потяните для поворота · Пробел: пауза';

export function sampleVolume(volume, limit = LIMIT) {
  const [nx, ny, nz] = volume.dimensions;
  if (!volume.data?.length || !volume.spacing || !Number.isInteger(limit) || limit < 1) {
    throw new Error('Некорректные данные томографии');
  }
  let eligible = 0;
  for (const value of volume.data) if (value > 800) eligible++;
  if (!eligible) throw new Error('В объёме не найдены данные для реконструкции');
  const count = Math.min(limit, eligible);
  const positions = new Float32Array(count * 3);
  const intensities = new Float32Array(count);
  let index = 0;
  let remaining = eligible;
  let seed = 4271;
  for (let z = 0; z < nz; z++) {
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const value = volume.data[x + nx * (y + ny * z)];
        if (value <= 800) continue;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const select = seed / 4294967296 < (count - index) / remaining--;
        if (!select) continue;
        positions[index * 3] = -(x - (nx - 1) / 2) * volume.spacing[0] / 105;
        positions[index * 3 + 1] = -(z - (nz - 1) / 2) * volume.spacing[2] / 105;
        positions[index * 3 + 2] = (y - (ny - 1) / 2) * volume.spacing[1] / 105;
        intensities[index++] = Math.min(1, Math.max(0.15, (value - 650) / 900));
      }
    }
  }
  return { positions, intensities, count };
}

const vertexShader = `
  attribute float intensity;
  varying float vIntensity;
  varying vec3 vPosition;
  uniform float pointScale;
  uniform vec2 pointer;
  uniform vec2 viewport;
  uniform float pointerStrength;
  void main() {
    vIntensity = intensity;
    vPosition = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(pointScale / -mv.z, 1.0, 3.8);
    vec4 clip = projectionMatrix * mv;
    vec2 screen = (clip.xy / clip.w * 0.5 + 0.5) * viewport;
    vec2 delta = screen - pointer;
    float distance = length(delta);
    float influence = 1.0 - smoothstep(0.0, 64.0, distance);
    vec2 push = delta / max(distance, 1.0) * influence * influence * pointerStrength * 18.0;
    clip.xy += push / viewport * 2.0 * clip.w;
    gl_Position = clip;
  }
`;

const fragmentShader = `
  uniform float split;
  uniform float resolution;
  uniform vec3 roi;
  varying float vIntensity;
  varying vec3 vPosition;
  void main() {
    float radius = length(gl_PointCoord - 0.5);
    if (radius > 0.5) discard;
    float after = step(split, gl_FragCoord.x / resolution);
    float focus = 1.0 - smoothstep(0.10, 0.29, length((vPosition - roi) * vec3(1.0, 1.1, 1.0)));
    vec3 original = mix(vec3(0.29, 0.42, 0.5), vec3(0.83, 0.92, 0.97), vIntensity);
    vec3 analyzed = mix(original * 0.57, vec3(0.40, 1.0, 0.77), focus);
    gl_FragColor = vec4(mix(original, analyzed, after), (0.27 + vIntensity * 0.52 + focus * after * 0.2) * (1.0 - smoothstep(0.30, 0.5, radius)));
  }
`;

export async function mountViewer(container) {
  if (!container) throw new Error('Контейнер томографии не найден');
  container.classList.add('scan-viewer');
  container.dataset.state = 'loading';
  container.innerHTML = `
    <div class="scan-stage" aria-label="Интерактивная реконструкция томографии"></div>
    <div class="scan-heading"><span class="scan-mark" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/></svg></span><div><strong>Исследование</strong><span>NeuroScan Vision</span></div><span class="scan-series">3D</span></div>
    <div class="scan-status" role="status"><span class="scan-spinner"></span>Загрузка исследования…</div>
    <div class="scan-wipe" aria-hidden="true"><span>‹ ›</span></div>
    <div class="scan-side-labels" aria-hidden="true"><span>ИСХОДНЫЕ ДАННЫЕ</span><span>С АНАЛИЗОМ ИИ</span></div>
    <div class="scan-annotation" hidden><button type="button" class="scan-roi-box" aria-label="Область внимания: показать симуляцию анализа" aria-expanded="false"><span>Область внимания</span></button></div>
    <div class="scan-analysis" hidden><div class="analysis-heading"><span class="analysis-document" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg></span><span class="scan-analysis-eyebrow">Черновик ИИ</span><span class="analysis-demo">Демо</span></div><div class="analysis-signal" aria-hidden="true"><span class="analysis-preview"><img src="${import.meta.env.BASE_URL}showcase/slice-66.png" alt="" width="64" height="64"><svg viewBox="0 0 64 64" fill="none"><path d="M32 24h-8v8m24 0v-8h-8m-16 16v8h8m8 0h8v-8" stroke="currentColor" stroke-width="1.5"/></svg></span><span>Область внимания<span class="analysis-progress"></span></span></div><strong>Отклонение от нормы · 18,6%</strong><p><span class="scan-analysis-accessible">${ANALYSIS}</span><span class="scan-analysis-text" aria-hidden="true"></span></p><small><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m7 12 3 3 7-7"/><circle cx="12" cy="12" r="9"/></svg>Требует проверки врачом</small></div>
    <div class="scan-coordinates" aria-hidden="true"><span>S</span><span>L</span><span>R</span><span>I</span></div>
    <div class="scan-bottom"><div class="scan-toolbar"><div class="scan-mode" role="group" aria-label="Режим просмотра"><button type="button" data-mode="3d" aria-pressed="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 8 5v8l-8 5-8-5V8Zm0 9 8-4m-8 4L4 8m8 4v9"/></svg>3D</button><button type="button" data-mode="slice" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/></svg>Срез</button></div><span class="scan-hint">Потяните для поворота</span></div><label class="scan-range-label"><span>Без анализа</span><input class="scan-range" type="range" min="0" max="100" value="47" aria-label="Граница сравнения: исходные данные слева, симуляция анализа справа"><span>С анализом</span></label></div>
  `;
  const stage = container.querySelector('.scan-stage');
  const status = container.querySelector('.scan-status');
  const range = container.querySelector('.scan-range');
  const wipe = container.querySelector('.scan-wipe');
  const annotation = container.querySelector('.scan-annotation');
  const box = container.querySelector('.scan-roi-box');
  const analysis = container.querySelector('.scan-analysis');
  const analysisText = container.querySelector('.scan-analysis-text');
  const hint = container.querySelector('.scan-hint');
  hint.textContent = ROTATION_HINT;
  hint.id = `${container.id || 'scan-viewer'}-motion-hint`;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new AbortController();
  let renderer;
  let frame = 0;
  let visible = true;
  let disposed = false;
  let analysisOpen = false;
  let motionPaused = false;
  let revealTimer = 0;
  let leaveTimer = 0;
  let mode = '3d';
  let lastTime = 0;
  let drag = null;
  const cameraTarget = new THREE.Vector2();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 5.5);
  const group = new THREE.Group();
  group.rotation.set(0.24, -0.55, 0);
  scene.add(group);
  const resources = [];
  let observer;
  let resizeObserver;
  const cleanup = () => {
    disposed = true;
    clearTimeout(revealTimer);
    clearTimeout(leaveTimer);
    analysis.hidden = true;
    box.setAttribute('aria-expanded', 'false');
    container.dataset.analysisState = 'closed';
    cancelAnimationFrame(frame);
    listeners.abort();
    observer?.disconnect();
    resizeObserver?.disconnect();
    resources.forEach(resource => resource.dispose());
    renderer?.dispose();
    renderer?.domElement.remove();
  };
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x0c151c, 0);
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', 'Облако точек томографического исследования. Стрелки поворачивают объём, Пробел приостанавливает или возобновляет движение. Мятная область — синтетическая демонстрация, не диагноз.');
    renderer.domElement.setAttribute('aria-describedby', hint.id);
    renderer.domElement.setAttribute('aria-keyshortcuts', 'Space ArrowLeft ArrowRight ArrowUp ArrowDown');
    stage.append(renderer.domElement);
    const volume = await new NRRDLoader().loadAsync(`${import.meta.env.BASE_URL}data/I.nrrd`);
    if (disposed) return cleanup;
    const sampled = sampleVolume(volume);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(sampled.positions, 3));
    geometry.setAttribute('intensity', new THREE.BufferAttribute(sampled.intensities, 1));
    const uniforms = { split: { value: 0.47 }, resolution: { value: 1 }, roi: { value: ROI }, pointScale: { value: 9 }, pointer: { value: new THREE.Vector2(-10000, -10000) }, viewport: { value: new THREE.Vector2(1, 1) }, pointerStrength: { value: 0 } };
    let pointerTargetStrength = 0;
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const cloud = new THREE.Points(geometry, material);
    group.add(cloud);
    resources.push(geometry, material);

    const [nx, ny, nz] = volume.dimensions;
    const sliceZ = Math.round((nz - 1) / 2 - ROI.y * 105 / volume.spacing[2]);
    const pixels = new Uint8Array(nx * ny * 4);
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const target = (nx - 1 - x + nx * y) * 4;
        const value = volume.data[x + nx * (y + ny * sliceZ)];
        const gray = Math.max(0, Math.min(255, value / 1400 * 255));
        pixels.set([gray * 0.84, gray * 0.93, gray, 255], target);
      }
    }
    const texture = new THREE.DataTexture(pixels, nx, ny);
    texture.needsUpdate = true;
    const sliceGeometry = new THREE.PlaneGeometry(nx * volume.spacing[0] / 105, ny * volume.spacing[1] / 105);
    const sliceMaterial = new THREE.ShaderMaterial({
      uniforms: { image: { value: texture }, split: uniforms.split, resolution: uniforms.resolution },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `uniform sampler2D image; uniform float split; uniform float resolution; varying vec2 vUv; void main(){vec3 color=texture2D(image,vUv).rgb;float after=step(split,gl_FragCoord.x/resolution);float focus=1.0-smoothstep(0.045,0.105,length(vUv-vec2(0.688,0.553)));gl_FragColor=vec4(mix(color,mix(color*0.62,vec3(0.4,1.0,0.77),focus*0.8),after),1.0);}`,
    });
    const slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
    slice.visible = false;
    scene.add(slice);
    resources.push(texture, sliceGeometry, sliceMaterial);

    const projected = new THREE.Vector3();
    const corner = new THREE.Vector3();
    let stageWidth = 1;
    let stageHeight = 1;
    const moveCamera = () => {
      uniforms.pointerStrength.value = THREE.MathUtils.lerp(uniforms.pointerStrength.value, pointerTargetStrength, .18);
      if (Math.abs(uniforms.pointerStrength.value - pointerTargetStrength) < .001) uniforms.pointerStrength.value = pointerTargetStrength;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, cameraTarget.x, 0.14);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, cameraTarget.y, 0.14);
      if (Math.abs(camera.position.x - cameraTarget.x) < 0.0005) camera.position.x = cameraTarget.x;
      if (Math.abs(camera.position.y - cameraTarget.y) < 0.0005) camera.position.y = cameraTarget.y;
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      container.dataset.cameraX = camera.position.x.toFixed(4);
      container.dataset.cameraY = camera.position.y.toFixed(4);
    };
    const cameraSettling = () => Math.abs(camera.position.x - cameraTarget.x) > 0.0005 || Math.abs(camera.position.y - cameraTarget.y) > 0.0005 || Math.abs(uniforms.pointerStrength.value - pointerTargetStrength) > .0005;
    const rotating = () => !motion.matches && !motionPaused && !drag && !analysisOpen && mode === '3d';
    const draw = () => {
      if (disposed) return;
      renderer.render(scene, camera);
      container.dataset.rotationY = group.rotation.y.toFixed(4);
      container.dataset.rotationX = group.rotation.x.toFixed(4);
      container.dataset.rotating = String(rotating());
      container.dataset.motionPaused = String(motionPaused);
      container.dataset.pointerStrength = uniforms.pointerStrength.value.toFixed(4);
      const width = stageWidth;
      const height = stageHeight;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      group.updateMatrixWorld();
      for (const x of [-0.17, 0.17]) for (const y of [-0.16, 0.16]) for (const z of [-0.15, 0.15]) {
        corner.set(ROI.x + x, ROI.y + y, ROI.z + z);
        if (mode === '3d') projected.copy(corner).applyMatrix4(group.matrixWorld);
        else projected.set(corner.x, corner.z, 0);
        projected.project(camera);
        const px = (projected.x + 1) * width / 2;
        const py = (1 - projected.y) * height / 2;
        minX = Math.min(minX, px); maxX = Math.max(maxX, px);
        minY = Math.min(minY, py); maxY = Math.max(maxY, py);
      }
      annotation.style.left = `${minX}px`;
      annotation.style.top = `${minY}px`;
      box.style.width = `${maxX - minX}px`;
      box.style.height = `${maxY - minY}px`;
      annotation.hidden = uniforms.split.value >= 1 || maxX <= width * uniforms.split.value;
      annotation.style.clipPath = `inset(-34px -140px -24px ${Math.max(0, width * uniforms.split.value - minX)}px)`;
      if (annotation.hidden && analysisOpen) closeAnalysis();
    };
    const tick = time => {
      frame = 0;
      if (!visible || document.hidden || disposed) return;
      if (rotating()) group.rotation.y += Math.min((time - (lastTime || time)) / 1000, 0.05) * 0.11;
      lastTime = time;
      moveCamera();
      draw();
      if (rotating() || cameraSettling()) frame = requestAnimationFrame(tick);
    };
    const synchronize = () => {
      if (!visible || document.hidden || disposed) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
        return;
      }
      draw();
      if ((rotating() || cameraSettling()) && !frame) {
        lastTime = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const closeAnalysis = () => {
      clearTimeout(revealTimer);
      clearTimeout(leaveTimer);
      analysisOpen = false;
      pointerTargetStrength = 0;
      analysis.hidden = true;
      box.setAttribute('aria-expanded', 'false');
      container.dataset.analysisState = 'closed';
    };
    const openAnalysis = () => {
      clearTimeout(leaveTimer);
      if (analysisOpen || annotation.hidden || drag || wiping) return;
      analysisOpen = true;
      pointerTargetStrength = uniforms.pointerStrength.value;
      analysis.hidden = false;
      box.setAttribute('aria-expanded', 'true');
      cameraTarget.set(camera.position.x, camera.position.y);
      let count = motion.matches ? ANALYSIS.length : 0;
      const reveal = () => {
        analysisText.textContent = ANALYSIS.slice(0, count);
        container.dataset.analysisState = count === ANALYSIS.length ? 'complete' : 'generating';
        if (count < ANALYSIS.length) {
          count = Math.min(ANALYSIS.length, count + 3);
          revealTimer = setTimeout(reveal, 28);
        }
      };
      reveal();
      synchronize();
    };
    const resetSplit = () => {
      closeAnalysis();
      uniforms.split.value = Number(range.value) / 100;
      container.style.setProperty('--scan-split', `${range.value}%`);
      range.setAttribute('aria-valuetext', `${range.value}% исходных данных, ${100 - Number(range.value)}% симуляции анализа`);
      synchronize();
    };
    const on = (element, event, callback) => element.addEventListener(event, callback, { signal: listeners.signal });
    let wiping = false;
    const moveWipe = event => {
      const bounds = stage.getBoundingClientRect();
      range.value = String(Math.round(THREE.MathUtils.clamp((event.clientX - bounds.left) / bounds.width, 0, 1) * 100));
      resetSplit();
    };
    on(wipe.querySelector('span'), 'pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      wiping = true;
      wipe.setPointerCapture(event.pointerId);
      moveWipe(event);
    });
    on(wipe, 'pointermove', event => { if (wiping) moveWipe(event); });
    on(wipe, 'pointerup', () => { wiping = false; });
    on(wipe, 'pointercancel', () => { wiping = false; });
    on(wipe, 'lostpointercapture', () => { wiping = false; });
    on(range, 'input', resetSplit);
    const scheduleClose = () => {
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        if (document.activeElement === box || box.matches(':hover') || analysis.matches(':hover')) return;
        closeAnalysis();
        synchronize();
      }, 160);
    };
    on(box, 'pointerenter', event => { if (event.pointerType !== 'touch') openAnalysis(); });
    on(box, 'pointerleave', scheduleClose);
    on(box, 'focus', openAnalysis);
    on(box, 'blur', scheduleClose);
    on(box, 'click', openAnalysis);
    on(analysis, 'pointerenter', () => clearTimeout(leaveTimer));
    on(analysis, 'pointerleave', scheduleClose);
    on(container, 'keydown', event => {
      if (event.key === 'Escape' && analysisOpen) { closeAnalysis(); synchronize(); }
    });
    on(container, 'pointerdown', event => {
      if (analysisOpen && !annotation.contains(event.target) && !analysis.contains(event.target)) closeAnalysis();
    });
    container.querySelectorAll('[data-mode]').forEach(button => on(button, 'click', () => {
      mode = button.dataset.mode;
      closeAnalysis();
      container.dataset.mode = mode;
      cloud.visible = mode === '3d';
      slice.visible = mode === 'slice';
      cameraTarget.set(0, 0);
      hint.textContent = mode === 'slice' ? `Аксиальный срез · ${sliceZ + 1} / ${nz}` : motionPaused ? 'Движение остановлено · Пробел продолжает' : ROTATION_HINT;
      container.querySelectorAll('[data-mode]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      synchronize();
    }));
    on(renderer.domElement, 'pointerdown', event => {
      if (mode !== '3d' || event.button !== 0 || drag) return;
      closeAnalysis();
      drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
      cameraTarget.set(0, 0);
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.focus({ preventScroll: true });
      synchronize();
    });
    on(renderer.domElement, 'pointermove', event => {
      if (!drag) {
        if (event.pointerType !== 'mouse' || motion.matches || mode !== '3d' || analysisOpen) return;
        const bounds = stage.getBoundingClientRect();
        uniforms.pointer.value.set(event.clientX - bounds.left, bounds.height - (event.clientY - bounds.top));
        pointerTargetStrength = 1;
        if (!motionPaused) cameraTarget.set(((event.clientX - bounds.left) / bounds.width * 2 - 1) * 0.16, -((event.clientY - bounds.top) / bounds.height * 2 - 1) * 0.10);
        if (!frame) { lastTime = 0; frame = requestAnimationFrame(tick); }
        return;
      }
      if (event.pointerId !== drag.id) return;
      group.rotation.y += (event.clientX - drag.x) * 0.007;
      group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + (event.clientY - drag.y) * 0.005, -0.7, 0.7);
      drag.x = event.clientX;
      drag.y = event.clientY;
      synchronize();
    });
    const endDrag = event => {
      if (!drag || event.pointerId !== drag.id) return;
      drag = null;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      synchronize();
    };
    on(renderer.domElement, 'pointerup', endDrag);
    on(renderer.domElement, 'pointercancel', endDrag);
    on(renderer.domElement, 'lostpointercapture', endDrag);
    on(renderer.domElement, 'pointerleave', () => {
      if (!analysisOpen) pointerTargetStrength = 0;
      if (!analysisOpen && !motionPaused) cameraTarget.set(0, 0);
      if (!frame) synchronize();
    });
    on(renderer.domElement, 'keydown', event => {
      if (mode === '3d' && event.key === ' ') {
        event.preventDefault();
        if (event.repeat) return;
        motionPaused = !motionPaused;
        cameraTarget.set(camera.position.x, camera.position.y);
        hint.textContent = motionPaused ? 'Движение остановлено · Пробел продолжает' : ROTATION_HINT;
        synchronize();
        return;
      }
      if (mode !== '3d' || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      closeAnalysis();
      cameraTarget.set(0, 0);
      if (event.key === 'ArrowLeft') group.rotation.y -= 0.08;
      if (event.key === 'ArrowRight') group.rotation.y += 0.08;
      if (event.key === 'ArrowUp') group.rotation.x = Math.max(-0.7, group.rotation.x - 0.08);
      if (event.key === 'ArrowDown') group.rotation.x = Math.min(0.7, group.rotation.x + 0.08);
      synchronize();
    });
    on(document, 'visibilitychange', () => {
      if (document.hidden) { closeAnalysis(); drag = null; }
      synchronize();
    });
    on(motion, 'change', event => {
      if (event.matches) {
        pointerTargetStrength = 0;
        uniforms.pointerStrength.value = 0;
        clearTimeout(revealTimer);
        clearTimeout(leaveTimer);
        if (analysisOpen) { analysisText.textContent = ANALYSIS; container.dataset.analysisState = 'complete'; }
        cameraTarget.set(0, 0);
        camera.position.x = 0;
        camera.position.y = 0;
        moveCamera();
      }
      synchronize();
    });
    on(renderer.domElement, 'webglcontextlost', event => {
      event.preventDefault();
      cleanup();
      container.dataset.state = 'error';
      annotation.hidden = true;
      status.hidden = false;
      status.textContent = 'Графический контекст потерян. Обновите страницу, чтобы загрузить томографию снова.';
      container.querySelectorAll('button, input').forEach(control => { control.disabled = true; });
    });
    resizeObserver = new ResizeObserver(() => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (!width || !height) return;
      stageWidth = width;
      stageHeight = height;
      uniforms.viewport.value.set(width, height);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = Math.max(3.7, 3.9 / camera.aspect);
      camera.updateProjectionMatrix();
      uniforms.resolution.value = width * renderer.getPixelRatio();
      uniforms.pointScale.value = Math.min(width, height) * renderer.getPixelRatio() * 0.02;
      synchronize();
    });
    resizeObserver.observe(stage);
    observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      container.dataset.sceneVisible = String(visible);
      if (!visible) { closeAnalysis(); drag = null; }
      synchronize();
    });
    observer.observe(stage);
    container.dataset.state = 'loaded';
    container.dataset.points = String(sampled.count);
    renderer.domElement.dataset.loaded = 'true';
    renderer.domElement.dataset.points = String(sampled.count);
    status.hidden = true;
    moveCamera();
    closeAnalysis();
    resetSplit();
  } catch (error) {
    cleanup();
    container.dataset.state = 'error';
    status.hidden = false;
    status.textContent = 'Не удалось открыть томографию. Проверьте подключение и поддержку WebGL в браузере.';
    container.querySelectorAll('button, input').forEach(control => { control.disabled = true; });
    console.error('NeuroScan tomography viewer:', error);
  }
  return cleanup;
}
