/**
 * KnowledgeFieldShader
 * -----------------------------------------------------------------------
 * هذا هو التنفيذ الفعلي (WebGL حقيقي، GPU-driven) لما كان مجرد وصف نصي
 * في برومبت "Axion Studio" (Swirl + ChromaFlow + FlutedGlass + FilmGrain).
 *
 * بدل استدعاء مكتبة خارجية (`shaders` npm package) غير مضمونة الصيانة،
 * تم كتابة fragment shader مخصص هنا بثلاث طبقات تركيبية، بنفس الروح
 * البصرية لكن بهوية تعليمية:
 *
 *   1) Swirl   → "حقل المعرفة": دوامة عضوية بطيئة (fBm noise) تمثل
 *                تدفق الأفكار، بدل الدوامة الزخرفية البحتة.
 *   2) ChromaFlow → نقاط طاقة تتبع حركة الماوس (تمثيل تفاعل المتعلم
 *                مع المحتوى) بلون برتقالي العلامة التجارية.
 *   3) FilmGrain → خشونة فيلم خفيفة لإحساس سينمائي راقٍ، وليس مسطحاً.
 *
 * الأداء: شيدر واحد، draw call واحد، بدون مكتبات خارجية، ~3KB من الكود.
 * يتوقف الرسم تلقائياً عند خروج العنصر من الشاشة (IntersectionObserver)
 * لتفادي استهلاك GPU غير الضروري في الأقسام البعيدة عن مجال الرؤية.
 */
import { useEffect, useRef } from 'react';
import { getDevicePerfTier, getMaxDprForTier, getFrameSkipForTier } from '../../lib/devicePerf';

const VERTEX_SHADER = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// OCTAVE_COUNT بيتحدد وقت التشغيل (اتشال منها القيمة الثابتة 5) حسب
// فئة أداء الجهاز — 5 على الأجهزة القوية، أقل على الضعيفة، لأن كل
// "octave" في fbm معناه تكرار كامل لدالة noise (4 هاش) على كل بكسل في
// الشاشة، ده أكبر تكلفة فعلية في الشيدر ده.
const FRAGMENT_SHADER = `
  precision highp float;
  #define OCTAVE_COUNT __OCTAVE_COUNT__
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform vec3 u_colorBase;
  uniform vec3 u_colorAccent;

  // ===== fBm noise (organic swirl) =====
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < OCTAVE_COUNT; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // ===== film grain =====
  float grain(vec2 uv, float t) {
    return fract(sin(dot(uv * t, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 aspectUv = uv;
    aspectUv.x *= u_resolution.x / u_resolution.y;

    // --- Layer 1: Swirl (knowledge field) ---
    float t = u_time * 0.045;
    vec2 swirlUv = aspectUv * 1.8;
    float angle = fbm(swirlUv + t) * 6.2831;
    vec2 swirled = swirlUv + vec2(cos(angle), sin(angle)) * 0.35;
    float swirlField = fbm(swirled + t * 0.5);

    vec3 color = mix(u_colorBase * 0.85, u_colorBase * 1.15, swirlField);

    // --- Layer 2: ChromaFlow (interactive energy near cursor) ---
    vec2 mouseUv = u_mouse;
    mouseUv.x *= u_resolution.x / u_resolution.y;
    float dist = distance(aspectUv, mouseUv);
    float glow = smoothstep(0.45, 0.0, dist);
    color = mix(color, u_colorAccent, glow * 0.35);

    // subtle secondary pulse ring for depth
    float ring = smoothstep(0.5, 0.46, dist) - smoothstep(0.46, 0.42, dist);
    color += u_colorAccent * ring * 0.15;

    // --- Layer 3: Film grain ---
    float g = grain(uv, u_time * 60.0);
    color += (g - 0.5) * 0.035;

    // gentle vignette so edges recede, content stays readable
    float vignette = smoothstep(1.1, 0.3, distance(uv, vec2(0.5)));
    color *= mix(0.55, 1.0, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

interface KnowledgeFieldShaderProps {
  /** RGB 0-1 base color of the knowledge field (defaults to deep navy) */
  colorBase?: [number, number, number];
  /** RGB 0-1 accent color for the cursor energy glow (defaults to brand orange) */
  colorAccent?: [number, number, number];
  className?: string;
}

export default function KnowledgeFieldShader({
  colorBase = [0.04, 0.08, 0.14],
  colorAccent = [0.98, 0.45, 0.13],
  className = '',
}: KnowledgeFieldShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) {
      // Graceful degradation: no WebGL support → leave a static gradient
      // (handled by the CSS fallback background on the wrapping element).
      return;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    // بنحدد عدد الـ octaves في الـ noise حسب فئة أداء الجهاز قبل ما
    // نجمع الشيدر: 3 على الأجهزة الضعيفة (توفير حقيقي في شغل GPU لكل
    // بكسل)، 4 على المتوسطة، 5 (زي الأصل) على القوية.
    const tier = getDevicePerfTier();
    const octaveCount = tier === 'low' ? 3 : tier === 'mid' ? 4 : 5;
    const fragmentShaderSource = FRAGMENT_SHADER.replace('__OCTAVE_COUNT__', String(octaveCount));
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // full-screen triangle strip (2 triangles)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const u_resolution = gl.getUniformLocation(program, 'u_resolution');
    const u_time = gl.getUniformLocation(program, 'u_time');
    const u_mouse = gl.getUniformLocation(program, 'u_mouse');
    const u_colorBase = gl.getUniformLocation(program, 'u_colorBase');
    const u_colorAccent = gl.getUniformLocation(program, 'u_colorAccent');

    gl.uniform3f(u_colorBase, colorBase[0], colorBase[1], colorBase[2]);
    gl.uniform3f(u_colorAccent, colorAccent[0], colorAccent[1], colorAccent[2]);

    function resize() {
      if (!canvas) return;
      // كان الحد الأقصى لـ DPR ثابت (2) لكل الأجهزة. دلوقتي بيتحدد حسب
      // فئة الجهاز: 1 على الضعيف (أقل عدد بكسل يترسم = أقل شغل)، حتى
      // 2 على القوي (زي الأصل بالظبط).
      const dpr = Math.min(window.devicePixelRatio || 1, getMaxDprForTier(tier));
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      gl!.viewport(0, 0, canvas.width, canvas.height);
      gl!.uniform2f(u_resolution, canvas.width, canvas.height);
    }

    // لو الـ resize بيتفعّل بسبب سحب slider التكبير/التصغير، ResizeObserver
    // بيطلق عشرات المرات في الثانية — كل مرة فيها إعادة حجم canvas +
    // gl.viewport (شغل GPU حقيقي). بنأجل الرسم الفعلي لحد ما السحب
    // يستقر (debounce قصير جدًا 60ms) عشان الشاشة تفضل سلسة أثناء السحب،
    // مع أول resize فوري عادي عند التحميل.
    let resizeDebounceId: ReturnType<typeof setTimeout> | null = null;
    function debouncedResize() {
      if (resizeDebounceId) clearTimeout(resizeDebounceId);
      resizeDebounceId = setTimeout(resize, 60);
    }

    const resizeObserver = new ResizeObserver(debouncedResize);
    resizeObserver.observe(canvas);
    resize();

    function handlePointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height,
      };
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Pause rendering when off-screen — saves GPU/battery on long pages.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(canvas);

    // على الأجهزة الضعيفة بنرسم كل فريم تاني بس (frameSkip = 2) — نص
    // معدل الفريم مش محسوس بصريًا في تأثير خلفية بطيء زي ده، لكنه
    // بيوفر نص شغل الـ GPU فعليًا.
    const frameSkip = getFrameSkipForTier(tier);
    let frameCounter = 0;
    const start = performance.now();
    function render() {
      rafRef.current = requestAnimationFrame(render);
      if (!visibleRef.current) return; // skip GPU work off-screen
      frameCounter++;
      if (frameCounter % frameSkip !== 0) return;
      const elapsed = (performance.now() - start) / 1000;
      gl!.uniform1f(u_time, elapsed);
      gl!.uniform2f(u_mouse, mouseRef.current.x, mouseRef.current.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }
    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (resizeDebounceId) clearTimeout(resizeDebounceId);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
    };
    // colorBase/colorAccent intentionally excluded from deps: shader is
    // recreated only on mount, color uniforms are set once at init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
