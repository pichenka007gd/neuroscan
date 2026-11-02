import * as THREE from 'three';
import { NRRDLoader } from 'three/addons/loaders/NRRDLoader.js';
import './viewer.css';

const ROI = new THREE.Vector3(0.43, 0.25, 0.12);
const LIMIT = 55000;

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
  void main() {
    vIntensity = intensity;
    vPosition = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(pointScale / -mv.z, 1.0, 3.8);
    gl_Position = projectionMatrix * mv;
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
    <div class="scan-heading"><span class="scan-live-dot"></span><div><strong>Томографическое исследование</strong><span>3D-реконструкция</span></div><span class="scan-series">Демонстрационный объём<br>256 × 256 × 113</span></div>
    <div class="scan-status" role="status"><span class="scan-spinner"></span>Загружаем объём томографии<span>Реальные данные · 6,8 МБ</span></div>
    <div class="scan-wipe" aria-hidden="true"><span>‹ ›</span></div>
    <div class="scan-side-labels" aria-hidden="true"><span>ИСХОДНЫЕ ДАННЫЕ</span><span>С АНАЛИЗОМ ИИ</span></div>
    <div class="scan-annotation" hidden><div class="scan-roi-box"></div><div class="scan-roi-label"><strong>Зона внимания</strong><span>Демо-оценка · 94,8%</span><small>Условная область · не диагноз</small></div></div>
    <div class="scan-coordinates" aria-hidden="true"><span>S</span><span>L</span><span>R</span><span>I</span></div>
    <div class="scan-bottom"><div class="scan-toolbar"><div class="scan-mode" role="group" aria-label="Режим просмотра"><button type="button" data-mode="3d" aria-pressed="true">3D</button><button type="button" data-mode="slice" aria-pressed="false">Срез</button></div><span class="scan-hint">Поворот: потяните или нажмите стрелки</span><div class="scan-actions"><button type="button" class="scan-pause" aria-label="Приостановить вращение" aria-pressed="false">Ⅱ</button><button type="button" class="scan-reset" aria-label="Сбросить ракурс и сравнение">↺</button></div></div><label class="scan-range-label"><span>Без анализа</span><input class="scan-range" type="range" min="0" max="100" value="47" aria-label="Граница сравнения: исходные данные слева, симуляция анализа справа"><span>С анализом</span></label><div class="scan-disclaimer">Демонстрационные данные. Не для клинического применения.</div></div>
  `;
  const stage = container.querySelector('.scan-stage');
  const status = container.querySelector('.scan-status');
  const range = container.querySelector('.scan-range');
  const wipe = container.querySelector('.scan-wipe');
  const annotation = container.querySelector('.scan-annotation');
  const box = container.querySelector('.scan-roi-box');
  const pause = container.querySelector('.scan-pause');
  const hint = container.querySelector('.scan-hint');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new AbortController();
  let renderer;
  let frame = 0;
  let visible = true;
  let disposed = false;
  let paused = motion.matches;
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
    renderer.domElement.setAttribute('aria-label', 'Облако точек томографического исследования. Стрелки поворачивают объём и приостанавливают вращение. Мятная область — синтетическая демонстрация, не диагноз.');
    stage.append(renderer.domElement);
    const volume = await new NRRDLoader().loadAsync(`${import.meta.env.BASE_URL}data/I.nrrd`);
    if (disposed) return cleanup;
    const sampled = sampleVolume(volume);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(sampled.positions, 3));
    geometry.setAttribute('intensity', new THREE.BufferAttribute(sampled.intensities, 1));
    const uniforms = { split: { value: 0.47 }, resolution: { value: 1 }, roi: { value: ROI }, pointScale: { value: 9 } };
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
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, cameraTarget.x, 0.14);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, cameraTarget.y, 0.14);
      if (Math.abs(camera.position.x - cameraTarget.x) < 0.0005) camera.position.x = cameraTarget.x;
      if (Math.abs(camera.position.y - cameraTarget.y) < 0.0005) camera.position.y = cameraTarget.y;
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      container.dataset.cameraX = camera.position.x.toFixed(4);
      container.dataset.cameraY = camera.position.y.toFixed(4);
    };
    const cameraSettling = () => Math.abs(camera.position.x - cameraTarget.x) > 0.0005 || Math.abs(camera.position.y - cameraTarget.y) > 0.0005;
    const draw = () => {
      if (disposed) return;
      renderer.render(scene, camera);
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
      annotation.style.clipPath = `inset(-200px -400px -200px ${Math.max(0, width * uniforms.split.value - minX)}px)`;
    };
    const tick = time => {
      frame = 0;
      if (!visible || document.hidden || disposed) return;
      if (!paused && mode === '3d') group.rotation.y += Math.min((time - (lastTime || time)) / 1000, 0.05) * 0.11;
      lastTime = time;
      moveCamera();
      draw();
      if ((!paused && mode === '3d') || cameraSettling()) frame = requestAnimationFrame(tick);
    };
    const synchronize = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      if (!visible || document.hidden || disposed) return;
      draw();
      if ((!paused && mode === '3d') || cameraSettling()) frame = requestAnimationFrame(tick);
    };
    const updatePause = () => {
      pause.setAttribute('aria-pressed', String(paused));
      pause.setAttribute('aria-label', paused ? 'Включить вращение' : 'Приостановить вращение');
      pause.textContent = paused ? '▷' : 'Ⅱ';
    };
    const resetSplit = () => {
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
    on(wipe, 'pointerdown', event => {
      event.preventDefault();
      wiping = true;
      wipe.setPointerCapture(event.pointerId);
      moveWipe(event);
    });
    on(wipe, 'pointermove', event => { if (wiping) moveWipe(event); });
    on(wipe, 'pointerup', () => { wiping = false; });
    on(wipe, 'pointercancel', () => { wiping = false; });
    on(range, 'input', resetSplit);
    on(pause, 'click', () => { paused = !paused; updatePause(); synchronize(); });
    on(container.querySelector('.scan-reset'), 'click', () => {
      group.rotation.set(0.24, -0.55, 0);
      cameraTarget.set(0, 0);
      range.value = '47';
      resetSplit();
    });
    container.querySelectorAll('[data-mode]').forEach(button => on(button, 'click', () => {
      mode = button.dataset.mode;
      container.dataset.mode = mode;
      cloud.visible = mode === '3d';
      slice.visible = mode === 'slice';
      pause.disabled = mode === 'slice';
      hint.textContent = mode === 'slice' ? `Аксиальный срез · ${sliceZ + 1} / ${nz}` : 'Поворот: потяните или нажмите стрелки';
      container.querySelectorAll('[data-mode]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      synchronize();
    }));
    on(renderer.domElement, 'pointerdown', event => {
      if (mode !== '3d') return;
      drag = { x: event.clientX, y: event.clientY };
      cameraTarget.set(0, 0);
      renderer.domElement.setPointerCapture(event.pointerId);
      paused = true; updatePause(); synchronize();
    });
    on(renderer.domElement, 'pointermove', event => {
      if (!drag) {
        if (event.pointerType !== 'mouse' || motion.matches || mode !== '3d') return;
        const bounds = stage.getBoundingClientRect();
        cameraTarget.set(((event.clientX - bounds.left) / bounds.width * 2 - 1) * 0.16, -((event.clientY - bounds.top) / bounds.height * 2 - 1) * 0.10);
        if (!frame) synchronize();
        return;
      }
      group.rotation.y += (event.clientX - drag.x) * 0.007;
      group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + (event.clientY - drag.y) * 0.005, -0.7, 0.7);
      drag = { x: event.clientX, y: event.clientY };
      synchronize();
    });
    on(renderer.domElement, 'pointerup', () => { drag = null; });
    on(renderer.domElement, 'pointercancel', () => { drag = null; });
    on(renderer.domElement, 'pointerleave', () => {
      cameraTarget.set(0, 0);
      if (!frame) synchronize();
    });
    on(renderer.domElement, 'keydown', event => {
      if (mode !== '3d' || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      paused = true;
      if (event.key === 'ArrowLeft') group.rotation.y -= 0.08;
      if (event.key === 'ArrowRight') group.rotation.y += 0.08;
      if (event.key === 'ArrowUp') group.rotation.x = Math.max(-0.7, group.rotation.x - 0.08);
      if (event.key === 'ArrowDown') group.rotation.x = Math.min(0.7, group.rotation.x + 0.08);
      updatePause();
      synchronize();
    });
    on(document, 'visibilitychange', synchronize);
    on(motion, 'change', event => {
      if (event.matches) {
        paused = true;
        cameraTarget.set(0, 0);
        camera.position.x = 0;
        camera.position.y = 0;
        moveCamera();
        updatePause();
        synchronize();
      }
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
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = Math.max(3.7, 3.9 / camera.aspect);
      camera.updateProjectionMatrix();
      uniforms.resolution.value = width * renderer.getPixelRatio();
      uniforms.pointScale.value = Math.min(width, height) * renderer.getPixelRatio() * 0.02;
      synchronize();
    });
    resizeObserver.observe(stage);
    observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; synchronize(); });
    observer.observe(container);
    container.dataset.state = 'loaded';
    container.dataset.points = String(sampled.count);
    renderer.domElement.dataset.loaded = 'true';
    renderer.domElement.dataset.points = String(sampled.count);
    status.hidden = true;
    updatePause();
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
