import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './HeroLanding.css';

const POND_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261104_160514_d8369d6e-d8ba-4532-9751-b32e0c8aaf75.mp4';
const KOI_GLB_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261104_151843_47d87652-1c40-465c-b0d6-cd94c22a9d3e.glb';

const BID_REQUEST_CODE = `{
  "chien_dich": "serum_phuc_hoi_b5_2026",
  "nganh_hang": "My pham & Cham soc da",
  "thuat_toan": "four_memory_hybrid",
  "ung_vien_koc": [{
    "handle": "@chaukikii",
    "nen_tang": "TIKTOK",
    "diem_phu_hop": 98.4,
    "rate_card_vnd": 25000000,
    "tich_xanh": { "da_xac_minh": true }
  }]
}`;

// Deterministic seeded generator (section 8.2)
function makeSeries(n: number, seed: number, base: number, amp: number, trend: number): number[] {
  let s = seed;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    const v =
      base +
      (trend * i) / (n - 1) +
      Math.sin(i * 0.9 + seed) * amp * 0.5 +
      (r - 0.5) * amp;
    out.push(v);
  }
  return out;
}

function buildCubicPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const q = pts[i - 1];
    const p = pts[i];
    const midX = ((q.x + p.x) * 0.5).toFixed(2);
    d += ` C ${midX} ${q.y.toFixed(2)}, ${midX} ${p.y.toFixed(2)}, ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  return d;
}

function buildSparkline(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => ({
    x: (i * 200) / 13,
    y: 28 - ((v - min) / span) * 24,
  }));
  const line = buildCubicPath(pts);
  const area = `${line} L 200 30 L 0 30 Z`;
  return { line, area };
}

const ChevronSvg = () => (
  <svg className="nl-chev" viewBox="0 0 10 10" fill="none">
    <path d="M2 3.5 l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRightSvg = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <path d="M2 8 h11 M9 4 l4 4 -4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function HeroLanding() {
  const pageRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const dayLayerRef = useRef<HTMLDivElement>(null);
  const violetLayerRef = useRef<HTMLDivElement>(null);
  const nightLayerRef = useRef<HTMLDivElement>(null);
  const pondVideoRef = useRef<HTMLVideoElement>(null);
  const pondCanvasRef = useRef<HTMLCanvasElement>(null);
  const koiCanvasRef = useRef<HTMLCanvasElement>(null);

  const heroLine1Ref = useRef<HTMLSpanElement>(null);
  const heroLine2Ref = useRef<HTMLSpanElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroBtnsRef = useRef<HTMLDivElement>(null);
  const scrollCardRef = useRef<HTMLButtonElement>(null);

  const studioRef = useRef<HTMLElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);
  const packsRef = useRef<HTMLElement>(null);
  const usesRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLElement>(null);
  const codeBlockRef = useRef<HTMLDivElement>(null);

  const [typedCode, setTypedCode] = useState('');

  // Deterministic charts data
  const charts = useMemo(() => {
    const sp1 = buildSparkline(makeSeries(14, 3, 20, 7, 10));
    const sp2 = buildSparkline(makeSeries(14, 7, 18, 6, 9));
    const sp3 = buildSparkline(makeSeries(14, 11, 22, 6, -6));
    const sp4 = buildSparkline(makeSeries(14, 5, 12, 4, 14));

    const spendRaw = makeSeries(30, 2, 90, 26, 60);
    const winRaw = makeSeries(30, 9, 70, 22, 30);
    const maxVal = Math.max(...spendRaw, ...winRaw) + 10;

    const spendPts = spendRaw.map((v, i) => ({
      x: (i * 600) / 29,
      y: 190 - 12 - (v / maxVal) * 160,
    }));
    const winPts = winRaw.map((v, i) => ({
      x: (i * 600) / 29,
      y: 190 - 12 - (v / maxVal) * 160,
    }));

    const spendLine = buildCubicPath(spendPts);
    const spendArea = `${spendLine} L 600 178 L 0 178 Z`;
    const winLine = buildCubicPath(winPts);
    const winArea = `${winLine} L 600 178 L 0 178 Z`;
    const marker = spendPts[22];

    return {
      sparks: [sp1, sp2, sp3, sp4],
      spendLine,
      spendArea,
      winLine,
      winArea,
      marker,
    };
  }, []);

  // Main lifecycle: scaling unit --u, entrance timeline, scroll crossfade, reveal observer, WebGL pond lens, Three.js 3D Koi
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'InfluencerMatch — Nền tảng Kết nối KOC & Thương hiệu bằng AI';
    // Keep animations enabled regardless of Windows OS "Show animations" toggle
    const reducedMotion = false;

    // Ensure html & body are scrollable (override any global overflow: hidden)
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const prevHtmlOverflow = htmlEl.style.overflowY;
    const prevHtmlMaxH = htmlEl.style.maxHeight;
    const prevHtmlH = htmlEl.style.height;
    const prevBodyOverflow = bodyEl.style.overflowY;
    const prevBodyMaxH = bodyEl.style.maxHeight;
    const prevBodyH = bodyEl.style.height;

    htmlEl.style.overflowY = 'auto';
    htmlEl.style.maxHeight = 'none';
    htmlEl.style.height = 'auto';
    bodyEl.style.overflowY = 'auto';
    bodyEl.style.maxHeight = 'none';
    bodyEl.style.height = 'auto';

    const getScrollY = () =>
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    // 1. Scaling system (--u)
    const updateUnit = () => {
      const cw = document.documentElement.clientWidth || window.innerWidth;
      const u = cw > 820 ? cw / 1440 : cw / 390;
      document.documentElement.style.setProperty('--u', `${u}px`);
    };
    updateUnit();

    // Shared pointer state (section 9 & 11)
    const pointer = {
      u: 0.5,
      v: 0.5,
      tx: 0,
      ty: 0,
      inside: false,
    };

    const onPointerMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const u = e.clientX / w;
      const v = 1 - e.clientY / h;
      pointer.u = u;
      pointer.v = v;
      pointer.tx = u * 2 - 1;
      pointer.ty = v * 2 - 1;
      pointer.inside = true;
    };

    const onPointerLeave = () => {
      pointer.inside = false;
      pointer.tx = 0;
      pointer.ty = 0;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);

    // 2. Hero Entrance Web Animations timeline (section 10)
    const pageEl = pageRef.current;
    let failsafeTimer: number | undefined;
    if (pageEl) {
      if (reducedMotion) {
        pageEl.classList.remove('anim');
      } else {
        const easing = 'cubic-bezier(0.2, 0.75, 0.2, 1)';
        const animSpecs: Array<{
          el: HTMLElement | null;
          from: Keyframe;
          to: Keyframe;
          delay: number;
          duration: number;
        }> = [
          {
            el: navRef.current,
            from: { opacity: 0, transform: 'translateY(-14px)' },
            to: { opacity: 1, transform: 'none' },
            delay: 0,
            duration: 900,
          },
          {
            el: heroLine1Ref.current,
            from: { opacity: 0, transform: 'translateY(105%)' },
            to: { opacity: 1, transform: 'none' },
            delay: 250,
            duration: 1100,
          },
          {
            el: heroLine2Ref.current,
            from: { opacity: 0, transform: 'translateY(105%)' },
            to: { opacity: 1, transform: 'none' },
            delay: 370,
            duration: 1100,
          },
          {
            el: heroSubRef.current,
            from: { opacity: 0, transform: 'translateY(12px)' },
            to: { opacity: 1, transform: 'none' },
            delay: 620,
            duration: 900,
          },
          {
            el: heroBtnsRef.current,
            from: { opacity: 0, transform: 'translateY(14px)' },
            to: { opacity: 1, transform: 'none' },
            delay: 740,
            duration: 900,
          },
          {
            el: scrollCardRef.current,
            from: { opacity: 0, transform: 'translateY(40px) scale(0.96)' },
            to: { opacity: 1, transform: 'none' },
            delay: 880,
            duration: 1100,
          },
        ];

        animSpecs.forEach(({ el, from, to, delay, duration }) => {
          if (el && el.animate) {
            el.animate([from, to], {
              delay,
              duration,
              easing,
              fill: 'backwards',
            });
          }
        });

        requestAnimationFrame(() => {
          pageEl.classList.remove('anim');
        });
        failsafeTimer = window.setTimeout(() => {
          pageEl.classList.remove('anim');
        }, 3000);
      }
    }

    // 3. Scroll reveal IntersectionObserver (section 7)
    const revealEls = pageEl ? Array.from(pageEl.querySelectorAll('.nl-reveal')) : [];
    let revealObserver: IntersectionObserver | null = null;
    if (reducedMotion) {
      revealEls.forEach((el) => el.classList.add('in'));
    } else if ('IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealEls.forEach((el) => revealObserver!.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('in'));
    }

    // 4. Scroll Crossfade (section 5)
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const smoothstep = (a: number, b: number, v: number) => {
      const t = clamp((v - a) / (b - a || 1), 0, 1);
      return t * t * (3 - 2 * t);
    };

    let videoReady = false;
    const videoEl = pondVideoRef.current;

    const updateCrossfade = () => {
      const h = window.innerHeight || 1;
      const y = getScrollY();
      const toViolet = smoothstep(0.15 * h, 1.05 * h, y);

      if (dayLayerRef.current) {
        dayLayerRef.current.style.opacity = String(1 - toViolet);
        dayLayerRef.current.style.transform = `scale(${1 + 0.08 * toViolet}) translateY(${-0.06 * y}px)`;
      }

      const endTop = endRef.current ? endRef.current.offsetTop : document.documentElement.scrollHeight - h;
      const toNight = smoothstep(endTop - 1.1 * h, endTop - 0.1 * h, y);

      if (violetLayerRef.current) {
        violetLayerRef.current.style.opacity = String(toViolet * (1 - toNight));
      }
      if (nightLayerRef.current) {
        nightLayerRef.current.style.opacity = String(toNight);
      }
      if (navRef.current) {
        navRef.current.classList.toggle('scrolled', y > 0.5 * h);
      }

      if (videoEl && !reducedMotion) {
        if (toViolet < 0.999) {
          if (videoEl.paused) {
            videoEl.play().catch(() => {});
          }
        } else if (!videoEl.paused) {
          videoEl.pause();
        }
      }
    };

    // 5. WebGL 1 Hero Hover Ripple Lens (section 9)
    let pondRaf = 0;
    const pondCanvas = pondCanvasRef.current;
    let gl: WebGLRenderingContext | null = null;

    if (videoEl && pondCanvas) {
      if (reducedMotion) {
        videoEl.removeAttribute('src');
        videoEl.load();
      } else {
        gl = (pondCanvas.getContext('webgl') ||
          pondCanvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

        const vsSource = `
          attribute vec2 position;
          varying vec2 vUv;
          void main() {
            vUv = position * 0.5 + 0.5;
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `;
        const fsSource = `
          precision highp float;
          varying vec2 vUv;
          uniform sampler2D tex;
          uniform vec2 scale;
          uniform vec2 tilt;
          uniform vec2 mouse;
          uniform float time;
          uniform float presence;
          void main() {
            vec2 uv = (vUv - 0.5) * scale + 0.5 + tilt;
            float dist = distance(vUv, mouse);
            float ripple = sin(dist * 20.0 - time * 5.0) * 0.006;
            float strength = smoothstep(0.2, 0.0, dist) * presence;
            vec2 offset = normalize(vUv - mouse + 1e-5) * ripple * strength;
            float r = texture2D(tex, uv + offset + vec2(0.005, 0.0) * strength).r;
            float g = texture2D(tex, uv + offset).g;
            float b = texture2D(tex, uv + offset - vec2(0.005, 0.0) * strength).b;
            gl_FragColor = vec4(r, g, b, 1.0);
          }
        `;

        const compileShader = (ctx: WebGLRenderingContext, type: number, src: string) => {
          const sh = ctx.createShader(type);
          if (!sh) return null;
          ctx.shaderSource(sh, src);
          ctx.compileShader(sh);
          if (!ctx.getShaderParameter(sh, ctx.COMPILE_STATUS)) {
            ctx.deleteShader(sh);
            return null;
          }
          return sh;
        };

        let prog: WebGLProgram | null = null;
        if (gl) {
          const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
          const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
          if (vs && fs) {
            prog = gl.createProgram();
            if (prog) {
              gl.attachShader(prog, vs);
              gl.attachShader(prog, fs);
              gl.linkProgram(prog);
              if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                prog = null;
              }
            }
          }
        }

        if (!gl || !prog) {
          videoEl.classList.add('fallback-visible');
          videoEl.play().catch(() => {});
        } else {
          const ctx = gl;
          ctx.useProgram(prog);

          const buf = ctx.createBuffer();
          ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
          ctx.bufferData(
            ctx.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            ctx.STATIC_DRAW
          );
          const posLoc = ctx.getAttribLocation(prog, 'position');
          ctx.enableVertexAttribArray(posLoc);
          ctx.vertexAttribPointer(posLoc, 2, ctx.FLOAT, false, 0, 0);

          const tex = ctx.createTexture();
          ctx.bindTexture(ctx.TEXTURE_2D, tex);
          ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, 1);
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);

          const uScale = ctx.getUniformLocation(prog, 'scale');
          const uTilt = ctx.getUniformLocation(prog, 'tilt');
          const uMouse = ctx.getUniformLocation(prog, 'mouse');
          const uTime = ctx.getUniformLocation(prog, 'time');
          const uPresence = ctx.getUniformLocation(prog, 'presence');

          let scaleX = 1;
          let scaleY = 1;
          const resizePond = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            const w = Math.max(1, Math.floor(window.innerWidth * dpr));
            const h = Math.max(1, Math.floor(window.innerHeight * dpr));
            pondCanvas.width = w;
            pondCanvas.height = h;
            ctx.viewport(0, 0, w, h);
            const A = w / h;
            const V = 1276 / 720;
            const z = 0.975;
            if (A > V) {
              scaleX = 1 * z;
              scaleY = (V / A) * z;
            } else {
              scaleX = (A / V) * z;
              scaleY = 1 * z;
            }
          };
          resizePond();
          window.addEventListener('resize', resizePond);

          const onPlaying = () => {
            videoReady = true;
            pondCanvas.classList.add('ready');
          };
          videoEl.addEventListener('playing', onPlaying);
          videoEl.play().catch(() => {});

          let lastT = performance.now();
          let elapsed = 0;
          let presence = 0;
          let curTx = 0;
          let curTy = 0;
          let mouseU = 0.5;
          let mouseV = 0.5;

          const renderPond = (now: number) => {
            const dt = Math.min((now - lastT) / 1000, 0.05);
            lastT = now;
            elapsed += dt;

            const kPres = 1 - Math.exp(-6 * dt);
            presence += ((pointer.inside ? 1 : 0) - presence) * kPres;
            if (pointer.inside) {
              mouseU = pointer.u;
              mouseV = pointer.v;
            }

            const kTilt = 1 - Math.exp(-dt / 0.1);
            curTx += (pointer.tx - curTx) * kTilt;
            curTy += (pointer.ty - curTy) * kTilt;

            if (videoReady && !videoEl.paused && videoEl.readyState >= 2) {
              ctx.bindTexture(ctx.TEXTURE_2D, tex);
              try {
                ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGB, ctx.RGB, ctx.UNSIGNED_BYTE, videoEl);
              } catch {}
              ctx.uniform2f(uScale, scaleX, scaleY);
              ctx.uniform2f(uTilt, curTx * 0.009 * scaleX, curTy * 0.009 * scaleY);
              ctx.uniform2f(uMouse, mouseU, mouseV);
              ctx.uniform1f(uTime, elapsed);
              ctx.uniform1f(uPresence, presence);
              ctx.drawArrays(ctx.TRIANGLES, 0, 6);
            }
            pondRaf = requestAnimationFrame(renderPond);
          };
          pondRaf = requestAnimationFrame(renderPond);
        }
      }
    }

    // 6. Three.js 3D Crystal-Glass Koi (section 11)
    let disposed = false;
    let koiRaf = 0;
    let cleanupKoi: (() => void) | null = null;

    const blobUrls: string[] = [];
    const initKoi = async () => {
      const canvas = koiCanvasRef.current;
      if (!canvas) return;

      try {
        const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
        const importEsm = (url: string): Promise<any> => import(/* @vite-ignore */ url);

        const loadAddonWithThree = async (
          url: string,
          extraReplacements: Record<string, string> = {}
        ): Promise<any> => {
          const res = await fetch(url);
          let code = await res.text();
          code = code.replace(/from\s+['"]three['"]/g, `from '${THREE_URL}'`);
          Object.entries(extraReplacements).forEach(([k, v]) => {
            code = code.split(k).join(v);
          });
          const blobUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
          blobUrls.push(blobUrl);
          return importEsm(blobUrl);
        };

        const THREE: any = await importEsm(THREE_URL);

        // Rewrite BufferGeometryUtils & GLTFLoader & RoomEnvironment so bare 'three' never fails in Vite dev mode
        const bufGeomRes = await fetch(
          'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/utils/BufferGeometryUtils.js'
        );
        const bufGeomCode = (await bufGeomRes.text()).replace(
          /from\s+['"]three['"]/g,
          `from '${THREE_URL}'`
        );
        const bufGeomBlobUrl = URL.createObjectURL(
          new Blob([bufGeomCode], { type: 'text/javascript' })
        );
        blobUrls.push(bufGeomBlobUrl);

        const [{ GLTFLoader }, { RoomEnvironment }] = await Promise.all([
          loadAddonWithThree(
            'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js',
            { '../utils/BufferGeometryUtils.js': bufGeomBlobUrl }
          ),
          loadAddonWithThree(
            'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/environments/RoomEnvironment.js'
          ),
        ]);

        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.95;

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

        const hemi = new THREE.HemisphereLight(0xc6b2ff, 0x2a1c80, 0.7);
        scene.add(hemi);

        const keyLight = new THREE.DirectionalLight(0xffc8f0, 1.6);
        keyLight.position.set(3, 5, 6);
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x8c7bff, 2.8);
        rimLight.position.set(-5, -1, -4);
        scene.add(rimLight);

        const camera = new THREE.PerspectiveCamera(
          30,
          window.innerWidth / window.innerHeight,
          0.1,
          100
        );
        camera.position.set(0, 0, 10);

        const rig = new THREE.Group();
        const body = new THREE.Group();
        rig.add(body);
        scene.add(rig);

        const swimUniforms = {
          uTime: { value: 0 },
          uFreq: { value: 5.2 },
          uSpeed: { value: 6.5 },
          uAmp: { value: 0.075 },
        };

        const loader = new GLTFLoader();
        loader.load(
          KOI_GLB_URL,
          (gltf: any) => {
            if (disposed) return;
            const root = gltf.scene;
            root.updateMatrixWorld(true);

            const meshes: any[] = [];
            let baseTex: any = null;
            root.traverse((node: any) => {
              if (node.isMesh && node.geometry) {
                const geom = node.geometry.clone();
                geom.applyMatrix4(node.matrixWorld);
                if (!baseTex && node.material && node.material.map) {
                  baseTex = node.material.map;
                }
                meshes.push(geom);
              }
            });

            if (meshes.length === 0) return;
            const geom = meshes[0];
            geom.computeBoundingBox();
            const box = geom.boundingBox;
            const size = new THREE.Vector3();
            box.getSize(size);

            if (size.z >= size.x && size.z >= size.y) {
              geom.rotateY(Math.PI / 2);
            } else if (size.y >= size.x && size.y >= size.z) {
              geom.rotateZ(-Math.PI / 2);
            }
            // Rotate 180 deg about Y so nose points to +X
            geom.rotateY(Math.PI);

            geom.computeBoundingBox();
            const center = new THREE.Vector3();
            geom.boundingBox.getCenter(center);
            geom.translate(-center.x, -center.y, -center.z);

            const finalSize = new THREE.Vector3();
            geom.boundingBox.getSize(finalSize);
            const len = Math.max(finalSize.x, 0.0001);
            geom.scale(1 / len, 1 / len, 1 / len);
            geom.computeVertexNormals();

            const mat = new THREE.MeshPhysicalMaterial({
              color: baseTex ? 0xc9b4ff : 0xb8a4ff,
              map: baseTex || null,
              emissiveMap: baseTex || null,
              roughness: 0.18,
              metalness: 0.15,
              clearcoat: 1,
              clearcoatRoughness: 0.1,
              iridescence: 0.85,
              iridescenceIOR: 1.4,
              iridescenceThicknessRange: [260, 700],
              emissive: new THREE.Color(0x7a46ff),
              emissiveIntensity: 0.55,
              sheen: 0.25,
              sheenColor: new THREE.Color(0xff9ce6),
              transparent: true,
              opacity: 0.95,
              envMapIntensity: 0.75,
              side: THREE.DoubleSide,
            });

            mat.onBeforeCompile = (shader: any) => {
              shader.uniforms.uTime = swimUniforms.uTime;
              shader.uniforms.uFreq = swimUniforms.uFreq;
              shader.uniforms.uSpeed = swimUniforms.uSpeed;
              shader.uniforms.uAmp = swimUniforms.uAmp;

              shader.vertexShader =
                `
                uniform float uTime;
                uniform float uFreq;
                uniform float uSpeed;
                uniform float uAmp;
                ` + shader.vertexShader;

              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                vec3 transformed = vec3( position );
                float tail = clamp((0.32 - transformed.x) / 0.82, 0.0, 1.0);
                transformed.z += sin(transformed.x * uFreq - uTime * uSpeed) * uAmp * (0.15 + 1.6 * tail * tail);
                transformed.y += cos(transformed.x * uFreq * 0.5 - uTime * uSpeed * 0.5) * uAmp * 0.12 * tail;
                `
              );
            };

            const koiMesh = new THREE.Mesh(geom, mat);
            body.add(koiMesh);
            if (reducedMotion) {
              stepKoi(performance.now(), true);
            }
          },
          undefined,
          () => {}
        );

        // Pose definitions & scroll choreography
        interface Pose {
          scrollY: number;
          x: number;
          y: number;
          s: number;
          yaw: number;
          pitch: number;
          roll: number;
        }

        let poses: Pose[] = [];
        const computePoses = () => {
          const h = window.innerHeight || 1;
          const sy = getScrollY();
          const isPhone = (document.documentElement.clientWidth || window.innerWidth) <= 820;
          const absTop = (el: HTMLElement | null) =>
            el ? el.getBoundingClientRect().top + sy : 0;

          const studioTop = absTop(studioRef.current);
          const dashEl = dashRef.current;
          const dashTop = dashEl
            ? absTop(dashEl) + dashEl.offsetHeight * 0.5 - 0.5 * h
            : studioTop + 0.8 * h;
          const packsTop = absTop(packsRef.current);
          const usesTop = absTop(usesRef.current);
          const endTop = absTop(endRef.current);
          const maxScroll = Math.max(0, document.documentElement.scrollHeight - h);

          poses = [
            {
              scrollY: 0,
              x: isPhone ? 0.12 : 0.02,
              y: isPhone ? 0.38 : 0.16,
              s: isPhone ? 0.46 : 0.72,
              yaw: 0.18,
              pitch: -0.92,
              roll: 0.05,
            },
            {
              scrollY: studioTop + 0.2 * h,
              x: isPhone ? 0.42 : -0.66,
              y: isPhone ? -0.72 : -0.6,
              s: isPhone ? 0.3 : 0.42,
              yaw: 0.5,
              pitch: 0.2,
              roll: -0.1,
            },
            {
              scrollY: dashTop,
              x: isPhone ? -0.35 : 0.5,
              y: isPhone ? -0.74 : -0.5,
              s: isPhone ? 0.3 : 0.46,
              yaw: -0.35,
              pitch: 0.32,
              roll: 0.1,
            },
            {
              scrollY: packsTop + 0.3 * h,
              x: isPhone ? 0.38 : 0.4,
              y: isPhone ? -0.74 : -0.78,
              s: isPhone ? 0.3 : 0.5,
              yaw: 0.55,
              pitch: -0.05,
              roll: 0.08,
            },
            {
              scrollY: usesTop + 0.3 * h,
              x: isPhone ? -0.3 : -0.42,
              y: isPhone ? -0.76 : -0.42,
              s: isPhone ? 0.32 : 0.6,
              yaw: 3.0,
              pitch: 0.12,
              roll: -0.06,
            },
            {
              scrollY: Math.min(endTop, maxScroll),
              x: isPhone ? 0.3 : -0.7,
              y: isPhone ? -0.74 : 0.56,
              s: isPhone ? 0.32 : 0.48,
              yaw: 0.3,
              pitch: -0.14,
              roll: 0.05,
            },
          ];
        };

        computePoses();

        const easeInOutCubic = (t: number) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const getTargetPose = (y: number) => {
          computePoses();
          if (poses.length === 0) {
            return { x: 0.02, y: 0.16, s: 0.72, yaw: 0.18, pitch: -0.92, roll: 0.05 };
          }
          if (y <= poses[0].scrollY) return poses[0];
          const last = poses[poses.length - 1];
          if (y >= last.scrollY) return last;

          for (let i = 0; i < poses.length - 1; i++) {
            const a = poses[i];
            const b = poses[i + 1];
            if (y >= a.scrollY && y <= b.scrollY) {
              const span = Math.max(1, b.scrollY - a.scrollY);
              const t = easeInOutCubic(clamp((y - a.scrollY) / span, 0, 1));
              return {
                x: a.x + (b.x - a.x) * t,
                y: a.y + (b.y - a.y) * t,
                s: a.s + (b.s - a.s) * t,
                yaw: a.yaw + (b.yaw - a.yaw) * t,
                pitch: a.pitch + (b.pitch - a.pitch) * t,
                roll: a.roll + (b.roll - a.roll) * t,
              };
            }
          }
          return last;
        };

        const cur = { ...getTargetPose(getScrollY()) };
        let lastTime = performance.now();
        let elapsed = 0;
        let lastScrollY = getScrollY();
        let vel = 0;
        const fh = 2 * Math.tan((15 * Math.PI) / 180) * 10;

        const stepKoi = (now: number, forceSnap = false) => {
          if (disposed) return;
          const dt = Math.min((now - lastTime) / 1000, 0.05);
          lastTime = now;
          elapsed += dt;

          const sy = getScrollY();
          updateCrossfade();
          const instantVel = dt > 0.0001 ? (sy - lastScrollY) / dt : 0;
          lastScrollY = sy;
          vel += (instantVel - vel) * 0.1;
          const speedUp = Math.min(Math.abs(vel) / 1800, 1.4);

          if (!reducedMotion) {
            swimUniforms.uTime.value += dt * (1 + speedUp);
            swimUniforms.uAmp.value = 0.07 + 0.03 * speedUp;
          }

          const target = getTargetPose(sy);
          const k = reducedMotion || forceSnap ? 1 : 1 - Math.exp(-3.2 * dt);
          cur.x += (target.x - cur.x) * k;
          cur.y += (target.y - cur.y) * k;
          cur.s += (target.s - cur.s) * k;
          cur.yaw += (target.yaw - cur.yaw) * k;
          cur.pitch += (target.pitch - cur.pitch) * k;
          cur.roll += (target.roll - cur.roll) * k;

          const aspect = (window.innerWidth || 1) / (window.innerHeight || 1);
          const fw = fh * aspect;
          const bob = reducedMotion ? 0 : Math.sin(0.9 * elapsed) * 0.018;

          rig.position.set((cur.x * fw) / 2, ((cur.y + bob) * fh) / 2, 0);
          const wobbleRoll = reducedMotion ? 0 : Math.sin(0.7 * elapsed) * 0.04;
          const wobbleYaw = reducedMotion ? 0 : Math.sin(0.5 * elapsed) * 0.06;
          rig.rotation.set(cur.roll + wobbleRoll, cur.yaw + wobbleYaw, cur.pitch, 'XYZ');
          body.scale.setScalar(cur.s * fh);

          if (!reducedMotion) {
            const kCam = 1 - Math.exp(-dt / 0.1);
            camera.rotation.y += (-pointer.tx * 0.01745 - camera.rotation.y) * kCam;
            camera.rotation.x += (pointer.ty * 0.01745 - camera.rotation.x) * kCam;
          }

          renderer.render(scene, camera);
          if (!reducedMotion) {
            koiRaf = requestAnimationFrame((t) => stepKoi(t, false));
          }
        };

        const onKoiResize = () => {
          renderer.setSize(window.innerWidth, window.innerHeight);
          camera.aspect = (window.innerWidth || 1) / (window.innerHeight || 1);
          camera.updateProjectionMatrix();
          computePoses();
          if (reducedMotion) stepKoi(performance.now(), true);
        };

        const onKoiScroll = () => {
          if (reducedMotion) stepKoi(performance.now(), true);
        };

        window.addEventListener('resize', onKoiResize);
        window.addEventListener('scroll', onKoiScroll, { passive: true });

        if (!reducedMotion) {
          koiRaf = requestAnimationFrame((t) => stepKoi(t, false));
        } else {
          stepKoi(performance.now(), true);
        }

        cleanupKoi = () => {
          window.removeEventListener('resize', onKoiResize);
          window.removeEventListener('scroll', onKoiScroll);
          pmrem.dispose();
          renderer.dispose();
        };
      } catch (err) {
        console.warn('[Nectarline Koi] Three.js load skipped:', err);
      }
    };

    initKoi();

    const onResizeAll = () => {
      updateUnit();
      updateCrossfade();
    };
    window.addEventListener('resize', onResizeAll);
    window.addEventListener('scroll', updateCrossfade, { passive: true });
    updateCrossfade();

    return () => {
      disposed = true;
      document.title = prevTitle;
      htmlEl.style.overflowY = prevHtmlOverflow;
      htmlEl.style.maxHeight = prevHtmlMaxH;
      htmlEl.style.height = prevHtmlH;
      bodyEl.style.overflowY = prevBodyOverflow;
      bodyEl.style.maxHeight = prevBodyMaxH;
      bodyEl.style.height = prevBodyH;
      blobUrls.forEach((u) => URL.revokeObjectURL(u));
      if (failsafeTimer) clearTimeout(failsafeTimer);
      if (pondRaf) cancelAnimationFrame(pondRaf);
      if (koiRaf) cancelAnimationFrame(koiRaf);
      if (revealObserver) revealObserver.disconnect();
      if (cleanupKoi) cleanupKoi();
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResizeAll);
      window.removeEventListener('scroll', updateCrossfade);
    };
  }, []);

  // Typing animation for OpenRTB JSON (section 8.3)
  useEffect(() => {
    const el = codeBlockRef.current;
    if (!el) return;

    let timer: number | undefined;
    let started = false;
    let cancelled = false;

    const runTyping = (idx: number) => {
      if (cancelled) return;
      if (idx > BID_REQUEST_CODE.length) {
        timer = window.setTimeout(() => {
          if (!cancelled) {
            setTypedCode('');
            runTyping(1);
          }
        }, 3200);
        return;
      }
      const nextSlice = BID_REQUEST_CODE.slice(0, idx);
      setTypedCode(nextSlice);
      const lastChar = BID_REQUEST_CODE[idx - 1];
      const delay = lastChar === '\n' ? 120 : 22;
      timer = window.setTimeout(() => runTyping(idx + 1), delay);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            runTyping(1);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      obs.disconnect();
    };
  }, []);

  const scrollToStudio = () => {
    studioRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={pageRef} id="top" className="nl-page anim">
      {/* ====================================================================
          5. Fixed Full-Viewport Scene Stack
          ==================================================================== */}
      <div className="nl-scene" aria-hidden="true">
        <div ref={dayLayerRef} className="nl-scene-layer nl-layer-day">
          <video
            ref={pondVideoRef}
            className="nl-pond-video"
            src={POND_VIDEO_URL}
            muted
            loop
            playsInline
            preload="auto"
            crossOrigin="anonymous"
          />
          <canvas ref={pondCanvasRef} id="pondfx" className="nl-pondfx" />
        </div>
        <div ref={violetLayerRef} className="nl-scene-layer nl-layer-violet" />
        <div ref={nightLayerRef} className="nl-scene-layer nl-layer-night" />
        <canvas ref={koiCanvasRef} id="koifx" className="nl-koifx" />
      </div>

      {/* ====================================================================
          6. Fixed Navigation Bar
          ==================================================================== */}
      <nav ref={navRef} className="nl-nav" data-in>
        <a href="#top" className="nl-logo">
          <img src="/logo.png" alt="InfluencerMatch" className="nl-logo-img" />
          <span>InfluencerMatch</span>
        </a>

        <div className="nl-nav-center">
          <a href="#studio" className="nl-nav-item">
            <span>Tính năng AI</span>
            <ChevronSvg />
          </a>
          <a href="#packs" className="nl-nav-item">
            <span>Giải pháp</span>
            <ChevronSvg />
          </a>
          <a href="#uses" className="nl-nav-item">
            <span>Vai trò</span>
            <ChevronSvg />
          </a>
          <a href="#end" className="nl-nav-item">
            <span>Bắt đầu ngay</span>
          </a>
        </div>

        <div className="nl-nav-right">
          <Link to="/login" className="nl-nav-pill grey">
            Đăng nhập
          </Link>
          <Link to="/register" className="nl-nav-pill dark">
            Đăng ký
          </Link>
        </div>
      </nav>

      {/* ====================================================================
          Main Content (5 Sections)
          ==================================================================== */}
      <main className="nl-main">
        {/* ── 8.1 Hero ───────────────────────────────────────────────────── */}
        <section id="hero">
          <h1 className="nl-hero-h1">
            <span className="nl-hero-line">
              <span ref={heroLine1Ref} data-in>
                Khám phá
              </span>
            </span>
            <span className="nl-hero-line">
              <span ref={heroLine2Ref} data-in>
                InfluencerMatch
              </span>
            </span>
          </h1>

          <p ref={heroSubRef} className="nl-hero-sub" data-in>
            Nền tảng Kết nối KOC &amp; Thương hiệu bằng AI<sup>®</sup>
          </p>

          <div ref={heroBtnsRef} className="nl-hero-btns" data-in>
            <Link to="/register" className="nl-btn fill">
              Bắt đầu — Miễn phí
            </Link>
            <Link to="/login" className="nl-btn ghost">
              Đăng nhập hệ thống
            </Link>
          </div>

          <button
            ref={scrollCardRef}
            type="button"
            className="nl-scroll-card"
            onClick={scrollToStudio}
            data-in
          >
            <span>
              Cuộn xuống
              <br />
              &amp; khám phá
            </span>
            <svg className="nl-scroll-arrow" viewBox="0 0 22 22" fill="none">
              <path
                d="M11 3 v15 M5 12 l6 6 6 -6"
                stroke="#fff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </section>

        {/* ── 8.2 Studio & Product Dashboard ─────────────────────────────── */}
        <section ref={studioRef} id="studio">
          <h2 className="nl-studio-h2 nl-reveal">
            Nền tảng AI độc lập hàng đầu <span className="nl-accent">kết nối KOC &amp; quản trị chiến dịch</span>
            <br />
            cho mọi thương hiệu và nhà tiếp thị Việt Nam.
          </h2>

          <p className="nl-lede nl-studio-lede nl-reveal">
            Tìm đúng người ảnh hưởng trước khi xuống ngân sách. Khám phá bằng AI Four-Memory, đàm phán CRM và nghiệm thu KPI từ một không gian tập trung.
          </p>

          <div className="nl-studio-btns nl-reveal">
            <Link to="/register" className="nl-btn fill">
              Bắt đầu — miễn phí
            </Link>
            <a href="#packs" className="nl-btn ghost">
              Xem quy trình AI
            </a>
          </div>

          <div className="nl-stats-row nl-reveal">
            <div className="nl-stat-cell">
              <div className="nl-stat-num">1.500+</div>
              <div className="nl-stat-cap">
                hồ sơ Master KOC
                <br />
                đã chuẩn hóa đa kênh
              </div>
            </div>
            <div className="nl-stat-cell">
              <div className="nl-stat-num">48s</div>
              <div className="nl-stat-cap">
                thời gian trung bình từ brief
                <br />
                đến danh sách KOC gợi ý
              </div>
            </div>
            <div className="nl-stat-cell">
              <div className="nl-stat-num">4 Lớp</div>
              <div className="nl-stat-cap">
                thuật toán Four-Memory AI
                <br />
                chấm điểm độ khớp thực tế
              </div>
            </div>
            <div className="nl-stat-cell">
              <div className="nl-stat-num">100%</div>
              <div className="nl-stat-cap">
                minh bạch bảng giá Rate Card
                <br />
                &amp; nghiệm thu ấn phẩm
              </div>
            </div>
          </div>

          {/* Product Dashboard */}
          <div ref={dashRef} id="dash" className="nl-reveal">
            <div className="nl-dash-top">
              <div className="nl-dash-mini-logo">
                <img src="/logo.png" alt="InfluencerMatch" className="nl-logo-img" />
                <span>InfluencerMatch</span>
              </div>
              <div className="nl-dash-crumb">
                Chiến dịch &nbsp;/&nbsp; <strong>Ra mắt Serum Phục Hồi B5</strong>
              </div>
              <div className="nl-dash-spacer" />
              <div className="nl-dash-search">
                <svg viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M10.6 10.6L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span>Tìm kiếm KOC, chiến dịch...</span>
                <span className="nl-dash-kbd">⌘K</span>
              </div>
              <span className="nl-chip">
                <span className="nl-live-dot" />
                Đang chạy
              </span>
              <span className="nl-dash-avatar">BR</span>
            </div>

            <div className="nl-dash-body">
              <aside className="nl-dash-side">
                <div className="nl-dash-group">KHÔNG GIAN</div>
                <div className="nl-dash-nav-item active">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M2 12l4-4 3 2.5L14 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Tổng quan</span>
                </div>
                <div className="nl-dash-nav-item">
                  <svg viewBox="0 0 16 16" fill="none">
                    <rect x="2.2" y="3" width="11.6" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M2.2 6.5h11.6" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  <span>Chiến dịch</span>
                  <span className="nl-dash-count">12</span>
                </div>
                <div className="nl-dash-nav-item">
                  <svg viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M8 5v3.2l2.2 1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <span>Outreach CRM</span>
                </div>
                <div className="nl-dash-nav-item">
                  <svg viewBox="0 0 16 16" fill="none">
                    <circle cx="6" cy="5.5" r="2.3" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M2.2 13c.6-2.2 2.1-3.3 3.8-3.3s3.2 1.1 3.8 3.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <span>Hợp tác &amp; Vận hành</span>
                </div>

                <div className="nl-dash-group second">CÔNG CỤ AI</div>
                <div className="nl-dash-nav-item">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M8 2.2L13.8 5.5 8 8.8 2.2 5.5 8 2.2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M2.2 9.2L8 12.5l5.8-3.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Khám phá Hybrid AI</span>
                  <span className="nl-dash-count">38</span>
                </div>
                <div className="nl-dash-nav-item">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M3 4h10M3 8h7M3 12h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <span>Giỏ Shortlist KOC</span>
                  <span className="nl-dash-count">16</span>
                </div>
                <div className="nl-dash-nav-item">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M8 2l4.8 2.2v3.6c0 3.1-2 5.2-4.8 6.2-2.8-1-4.8-3.1-4.8-6.2V4.2L8 2z" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  <span>Xác minh Tích Xanh</span>
                </div>
                <div className="nl-dash-nav-item">
                  <svg viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3.2" width="12" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5.5 13.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <span>Bảng giá Rate Card</span>
                  <span className="nl-dash-count">24</span>
                </div>
              </aside>

              <div className="nl-dash-main">
                <div className="nl-dash-head">
                  <div className="nl-dash-title">Hiệu suất chiến dịch &amp; KOC</div>
                  <span className="nl-chip up">▲ 24.6% so với kỳ trước</span>
                  <div className="nl-dash-seg">
                    <span>7 ngày</span>
                    <span className="active">30 ngày</span>
                    <span>90 ngày</span>
                  </div>
                  <Link to="/register" className="nl-dash-new">
                    + Tạo chiến dịch
                  </Link>
                </div>

                {/* KPI Tiles */}
                <div className="nl-kpi-grid">
                  {[
                    { label: 'Tổng lượt tiếp cận (Reach)', val: '8,42M', chip: '+18%', up: true, color: '#9b8cff', id: 'sp0' },
                    { label: 'Tỷ lệ tương tác (ER TB)', val: '6,8%', chip: '+1,4pt', up: true, color: '#ff8fd8', id: 'sp1' },
                    { label: 'Ngân sách đã giải ngân', val: '184,2Tr', chip: '+12%', up: true, color: '#7fd6ff', id: 'sp2' },
                    { label: 'KOC đang hợp tác', val: '24', chip: '+5', up: true, color: '#7cf0bd', id: 'sp3' },
                  ].map((k, idx) => {
                    const sp = charts.sparks[idx];
                    return (
                      <div key={k.label} className="nl-kpi-tile">
                        <div className="nl-kpi-lbl">{k.label}</div>
                        <div className="nl-kpi-val-row">
                          <span className="nl-kpi-val">{k.val}</span>
                          <span className={`nl-chip ${k.up ? 'up' : ''}`}>{k.chip}</span>
                        </div>
                        <svg className="nl-spark-svg" viewBox="0 0 200 30" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={k.id} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={k.color} stopOpacity="0.35" />
                              <stop offset="100%" stopColor={k.color} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d={sp.area} fill={`url(#${k.id})`} className="nl-draw-fill" />
                          <path
                            d={sp.line}
                            fill="none"
                            stroke={k.color}
                            strokeWidth="1.6"
                            vectorEffect="non-scaling-stroke"
                            pathLength={1}
                            className="nl-draw-line"
                          />
                        </svg>
                      </div>
                    );
                  })}
                </div>

                {/* Chart Row */}
                <div className="nl-chart-row">
                  <div className="nl-chart-pane">
                    <div className="nl-pane-head">
                      <span>Lượt xem thực tế &amp; Tỷ lệ tương tác</span>
                      <div className="nl-legend">
                        <span>
                          <i className="nl-swatch" style={{ background: '#9b8cff' }} />
                          Lượt xem
                        </span>
                        <span>
                          <i className="nl-swatch" style={{ background: '#ff8fd8' }} />
                          Tương tác
                        </span>
                      </div>
                    </div>

                    <svg className="nl-area-svg" viewBox="0 0 600 190" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9b8cff" stopOpacity="0.42" />
                          <stop offset="100%" stopColor="#9b8cff" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="areaWin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff8fd8" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#ff8fd8" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {[0, 1, 2, 3, 4].map((i) => {
                        const gy = 12 + i * 41.5;
                        return (
                          <line
                            key={i}
                            x1="0"
                            y1={gy}
                            x2="600"
                            y2={gy}
                            stroke="rgba(190,170,255,0.08)"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                          />
                        );
                      })}

                      <path d={charts.spendArea} fill="url(#areaSpend)" className="nl-draw-fill" />
                      <path d={charts.winArea} fill="url(#areaWin)" className="nl-draw-fill" />

                      <path
                        d={charts.spendLine}
                        fill="none"
                        stroke="#9b8cff"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        pathLength={1}
                        className="nl-draw-line"
                      />
                      <path
                        d={charts.winLine}
                        fill="none"
                        stroke="#ff8fd8"
                        strokeWidth="1.6"
                        vectorEffect="non-scaling-stroke"
                        pathLength={1}
                        className="nl-draw-line delay"
                      />

                      {charts.marker && (
                        <g className="nl-draw-fill">
                          <line
                            x1={charts.marker.x}
                            y1="12"
                            x2={charts.marker.x}
                            y2="178"
                            stroke="rgba(220,210,255,0.25)"
                            strokeDasharray="3 3"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                          />
                          <circle
                            cx={charts.marker.x}
                            cy={charts.marker.y}
                            r="4.5"
                            fill="#1a1150"
                            stroke="#b9adff"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                          />
                        </g>
                      )}
                    </svg>
                  </div>

                  <div className="nl-chart-pane">
                    <div className="nl-pane-head">
                      <span>Tỷ trọng nền tảng KOC</span>
                    </div>
                    <div className="nl-bars-list">
                      {[
                        { label: 'TikTok Video', val: 38, color: '#9b8cff', alpha: 'rgba(155,140,255,0.67)' },
                        { label: 'Instagram Reels', val: 27, color: '#7fd6ff', alpha: 'rgba(127,214,255,0.67)' },
                        { label: 'YouTube Shorts', val: 19, color: '#ff8fd8', alpha: 'rgba(255,143,216,0.67)' },
                        { label: 'Livestream', val: 10, color: '#ffc27a', alpha: 'rgba(255,194,122,0.67)' },
                        { label: 'Bài đăng Review', val: 6, color: '#7cf0bd', alpha: 'rgba(124,240,189,0.67)' },
                      ].map((b) => (
                        <div key={b.label}>
                          <div className="nl-bar-label-row">
                            <span>{b.label}</span>
                            <code>{b.val}%</code>
                          </div>
                          <div className="nl-bar-track">
                            <div
                              className="nl-bar-fill"
                              style={
                                {
                                  '--target-w': `${(b.val / 38) * 100}%`,
                                  background: `linear-gradient(90deg, ${b.color}, ${b.alpha})`,
                                } as React.CSSProperties
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Deals Table */}
                <div className="nl-deals-table">
                  <div className="nl-deals-row head">
                    <span>Đối tác KOC</span>
                    <span>Nền tảng</span>
                    <span className="nl-col-hide-sm">Thù lao</span>
                    <span className="nl-col-hide-sm">Tương tác (ER)</span>
                    <span>Trạng thái</span>
                  </div>
                  <div className="nl-deals-row">
                    <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>Châu Bùi (@chaukikii)</strong>
                    <span>TikTok</span>
                    <span className="nl-mono-num nl-col-hide-sm">25.000.000₫</span>
                    <span className="nl-mono-num nl-col-hide-sm">7.8%</span>
                    <span>
                      <span className="nl-chip">
                        <span className="nl-live-dot" />
                        Đã đăng bài
                      </span>
                    </span>
                  </div>
                  <div className="nl-deals-row">
                    <span>Huy Tiện Ích (@huytienich)</span>
                    <span>YouTube</span>
                    <span className="nl-mono-num nl-col-hide-sm">15.000.000₫</span>
                    <span className="nl-mono-num nl-col-hide-sm">6.4%</span>
                    <span>
                      <span className="nl-chip">
                        <span className="nl-live-dot" />
                        Đang thực hiện
                      </span>
                    </span>
                  </div>
                  <div className="nl-deals-row">
                    <span>Linh Nguyễn (@linh.beauty)</span>
                    <span>Instagram</span>
                    <span className="nl-mono-num nl-col-hide-sm">12.000.000₫</span>
                    <span className="nl-mono-num nl-col-hide-sm">—</span>
                    <span>
                      <span className="nl-chip">Chờ duyệt bài</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8.3 Packages ───────────────────────────────────────────────── */}
        <section ref={packsRef} id="packs">
          <div className="nl-packs-split">
            <div className="nl-reveal">
              <h2 className="nl-packs-h2">
                Chọn đúng người, nhìn thấu dữ liệu, đàm phán nhanh,{' '}
                <span className="nl-accent">
                  đo lường <span className="nl-serif">thực chất.</span>
                </span>
              </h2>
              <p className="nl-lede nl-packs-lede">
                Khởi tạo brief chiến dịch bằng AI, lọc KOC qua 4 tầng bộ nhớ thông minh, đẩy thẳng sang phễu Outreach CRM và nghiệm thu KPI minh bạch.
              </p>
              <div className="nl-packs-btns">
                <Link to="/register" className="nl-btn white">
                  Đăng ký Thương hiệu
                </Link>
                <Link to="/login" className="nl-btn dk">
                  Cổng Nhà sáng tạo
                </Link>
              </div>
            </div>

            <div ref={codeBlockRef} className="nl-code-wrap nl-reveal" aria-hidden="true">
              <div className="nl-code-head">
                <span>goi_y_koc_ai.json</span>
                <span>Four-Memory AI v2.4</span>
              </div>
              <pre className="nl-code-pre">
                {typedCode}
                <span className="nl-caret" />
              </pre>
              <div className="nl-code-foot">
                <span>chiến dịch im.b5.0428</span>
                <span className="nl-code-ready">
                  <span className="nl-live-dot" />
                  khớp 98.4%
                </span>
              </div>
            </div>
          </div>

          {/* 3 Package Cards */}
          <div className="nl-pack-grid">
            <div className="nl-pack-card lead nl-reveal">
              <div className="nl-pack-top">
                <span className="nl-pack-idx">01</span>
                <span className="nl-bare-icon">
                  <svg viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="6" stroke="#fff" strokeWidth="1.3" />
                    <circle cx="11" cy="11" r="2" stroke="#fff" strokeWidth="1.3" />
                    <path d="M11 2v3M11 17v3M2 11h3M17 11h3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
              </div>
              <div className="nl-pack-eyebrow">AI FOUR-MEMORY DISCOVERY</div>
              <h3 className="nl-pack-title">Tìm Đúng KOC Trong Vài Giây</h3>
              <p className="nl-pack-body">
                Kết hợp tìm kiếm ngữ nghĩa Vector BKAI 768 chiều, bộ lọc cứng và xếp hạng độ phủ thực tế của từng nhà sáng tạo.
              </p>
              <div className="nl-pack-meta">
                <div>
                  <div className="nl-pack-meta-cap">Độ chính xác ghép nối</div>
                  <div className="nl-pack-metric">98.4%</div>
                </div>
                <Link to="/register" className="nl-arrow-link">
                  <span>Khám phá ngay</span>
                  <ArrowRightSvg />
                </Link>
              </div>
            </div>

            <div className="nl-pack-card nl-glass nl-reveal" style={{ transitionDelay: '0.08s' }}>
              <div className="nl-pack-top">
                <span className="nl-pack-idx">02</span>
                <span className="nl-bare-icon">
                  <svg viewBox="0 0 22 22" fill="none">
                    <rect x="4" y="5" width="14" height="9" rx="1.8" stroke="#fff" strokeWidth="1.3" />
                    <path d="M7.5 17.5h7" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
              </div>
              <div className="nl-pack-eyebrow">OUTREACH CRM &amp; HỢP TÁC</div>
              <h3 className="nl-pack-title">Đàm Phán &amp; Duyệt Ấn Phẩm</h3>
              <p className="nl-pack-body">
                Quản lý phễu mời hợp tác Kanban, soạn thư mời tự động theo 3 giọng văn, duyệt kịch bản video và đối soát thanh toán.
              </p>
              <div className="nl-pack-meta">
                <div>
                  <div className="nl-pack-meta-cap">Tốc độ chốt deal KOC</div>
                  <div className="nl-pack-metric">3.2×</div>
                </div>
                <Link to="/register" className="nl-arrow-link">
                  <span>Khám phá ngay</span>
                  <ArrowRightSvg />
                </Link>
              </div>
            </div>

            <div className="nl-pack-card nl-glass nl-reveal" style={{ transitionDelay: '0.16s' }}>
              <div className="nl-pack-top">
                <span className="nl-pack-idx">03</span>
                <span className="nl-bare-icon">
                  <svg viewBox="0 0 22 22" fill="none">
                    <path d="M3 16l5.5-5.5 4 4L19 8" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 8h5v5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <div className="nl-pack-eyebrow">CREATOR PORTAL &amp; TÍCH XANH</div>
              <h3 className="nl-pack-title">Minh Bạch Rate Card Chính Chủ</h3>
              <p className="nl-pack-body">
                KOC tự quản lý bảng giá dịch vụ, xác thực quyền sở hữu kênh qua mã bảo mật Bio hoặc OAuth để nhận huy hiệu Tích Xanh.
              </p>
              <div className="nl-pack-meta">
                <div>
                  <div className="nl-pack-meta-cap">KOC xác thực chính chủ</div>
                  <div className="nl-pack-metric">100%</div>
                </div>
                <Link to="/register" className="nl-arrow-link">
                  <span>Khám phá ngay</span>
                  <ArrowRightSvg />
                </Link>
              </div>
            </div>
          </div>

          {/* Steps Strip */}
          <ol className="nl-steps-strip nl-reveal">
            <li className="nl-step-item">
              <span className="nl-step-num">01</span>
              <div>
                <strong>Khởi tạo Brief chiến dịch bằng AI</strong>
                Tự động trích xuất mục tiêu, tệp khán giả, ngân sách và ngành hàng chỉ từ vài dòng mô tả.
              </div>
            </li>
            <li className="nl-step-item">
              <span className="nl-step-num">02</span>
              <div>
                <strong>Chọn lọc Shortlist &amp; Mời hợp tác CRM</strong>
                So sánh chỉ số tương tác, bảng giá Rate Card và gửi lời mời hàng loạt tới KOC phù hợp.
              </div>
            </li>
            <li className="nl-step-item">
              <span className="nl-step-num">03</span>
              <div>
                <strong>Duyệt ấn phẩm &amp; Nghiệm thu KPI thực tế</strong>
                Theo dõi tiến độ sản xuất video, đối soát thù lao tạm ứng và đo lường lượt xem trực tiếp.
              </div>
            </li>
          </ol>
        </section>

        {/* ── 8.4 Use Cases (Stepped Staircase) ──────────────────────────── */}
        <section ref={usesRef} id="uses">
          <div className="nl-uses-head">
            <h2 className="nl-uses-h2 nl-reveal">
              Thiết kế tối ưu cho
              <br />
              mọi vai trò <span className="nl-serif">kiến tạo</span> chiến dịch.
            </h2>
            <p className="nl-lede nl-uses-lede nl-reveal">
              Một nền tảng thống nhất với 4 không gian chuyên biệt. Mỗi vai trò đều có bộ công cụ chuẩn xác cho quy trình của mình.
            </p>
          </div>

          <div className="nl-staircase">
            <div className="nl-use-card c1 nl-glass nl-reveal">
              <div className="nl-use-top">
                <span className="nl-use-tag">VAI TRÒ 01</span>
                <span className="nl-bare-icon">
                  <svg viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="6.5" width="16" height="11.5" rx="2" stroke="#fff" strokeWidth="1.3" />
                    <path d="M8 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 14 5v1.5" stroke="#fff" strokeWidth="1.3" />
                  </svg>
                </span>
              </div>
              <h3 className="nl-use-title">Thương hiệu &amp; Nhãn hàng</h3>
              <p className="nl-use-body">
                Chấm dứt việc tìm KOC cảm tính trên bảng tính rời rạc. Làm chủ dữ liệu tiếp cận, kiểm soát ngân sách và tối ưu ROI thực tế.
              </p>
              <div className="nl-use-chips">
                <span className="nl-chip">Khám phá AI</span>
                <span className="nl-chip">Nghiệm thu KPI</span>
              </div>
              <div className="nl-use-foot">
                <Link to="/register" className="nl-arrow-link">
                  <span>Bắt đầu ngay</span>
                  <ArrowRightSvg />
                </Link>
              </div>
            </div>

            <div className="nl-use-card c2 nl-glass nl-reveal">
              <div className="nl-use-top">
                <span className="nl-use-tag">VAI TRÒ 02</span>
                <span className="nl-bare-icon">
                  <svg viewBox="0 0 22 22" fill="none">
                    <path d="M4 12V9l11-4v10L4 12z" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M6.5 12.8l1.2 4.2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
              </div>
              <h3 className="nl-use-title">Nhà sáng tạo (KOC / KOL)</h3>
              <p className="nl-use-body">
                Sở hữu cổng Creator Portal riêng trên cả máy tính và điện thoại. Niêm yết bảng giá Rate Card và nhận lời mời booking trực tiếp.
              </p>
              <div className="nl-use-chips">
                <span className="nl-chip">Bảng giá Rate Card</span>
                <span className="nl-chip">Claim Tích Xanh</span>
              </div>
              <div className="nl-use-foot">
                <Link to="/login" className="nl-arrow-link">
                  <span>Mở Creator Portal</span>
                  <ArrowRightSvg />
                </Link>
              </div>
            </div>

            <div className="nl-use-card c3 nl-glass nl-reveal">
              <div className="nl-use-top">
                <span className="nl-use-tag">VAI TRÒ 03</span>
                <span className="nl-bare-icon">
                  <svg viewBox="0 0 22 22" fill="none">
                    <rect x="4.5" y="3" width="13" height="16" rx="2" stroke="#fff" strokeWidth="1.3" />
                    <path d="M8 8h6M8 11.5h6M8 15h4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
              </div>
              <h3 className="nl-use-title">Quản trị Dữ liệu</h3>
              <p className="nl-use-body">
                Giám sát chất lượng dữ liệu KOC toàn hệ thống, hợp nhất định danh Master KOC đa nền tảng và xét duyệt hồ sơ cấp Tích Xanh.
              </p>
              <div className="nl-use-chips">
                <span className="nl-chip">Định danh Master</span>
                <span className="nl-chip">Kiểm duyệt kênh</span>
              </div>
              <div className="nl-use-foot">
                <Link to="/login" className="nl-arrow-link">
                  <span>Đăng nhập quản trị</span>
                  <ArrowRightSvg />
                </Link>
              </div>
            </div>

            <div className="nl-use-card c4 nl-glass nl-reveal">
              <div className="nl-use-top">
                <span className="nl-use-tag">VAI TRÒ 04</span>
                <span className="nl-bare-icon">
                  <svg viewBox="0 0 22 22" fill="none">
                    <path d="M8 7L4 11l4 4M14 7l4 4-4 4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <h3 className="nl-use-title">Quản trị Hệ thống</h3>
              <p className="nl-use-body">
                Điều phối tài khoản toàn nền tảng, cấu hình ma trận phân quyền RBAC động, quản lý gói cước doanh nghiệp và nhật ký kiểm toán.
              </p>
              <div className="nl-use-chips">
                <span className="nl-chip">Phân quyền RBAC</span>
                <span className="nl-chip">Giám sát hệ thống</span>
              </div>
              <div className="nl-use-foot">
                <Link to="/login" className="nl-arrow-link">
                  <span>Trung tâm Admin</span>
                  <ArrowRightSvg />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8.5 Call to Action & Footer ────────────────────────────────── */}
        <section ref={endRef} id="end">
          <div className="nl-cta-panel nl-glass nl-reveal">
            <h2 className="nl-cta-h2">
              Bắt đầu Chiến dịch
              <br />
              <span className="nl-serif">Kết nối KOC</span> Ngay!
            </h2>
            <p className="nl-lede nl-cta-lede">
              Đăng ký miễn phí. Khởi tạo chiến dịch đầu tiên và tìm ra danh sách KOC hoàn hảo chỉ trong vài phút.
            </p>
            <div className="nl-cta-btns">
              <Link to="/register" className="nl-btn fill">
                Đăng ký miễn phí ngay
              </Link>
              <Link to="/login" className="nl-btn ghost">
                Đăng nhập tài khoản
              </Link>
            </div>
            <div className="nl-cta-note">
              Miễn phí trải nghiệm &nbsp;·&nbsp; Xác thực OTP tức thì &nbsp;·&nbsp; Báo cáo KPI minh bạch
            </div>
          </div>

          <footer className="nl-footer">
            <div className="nl-foot-grid">
              <div className="nl-foot-brand">
                <a href="#top" className="nl-logo">
                  <img src="/logo.png" alt="InfluencerMatch" className="nl-logo-img" />
                  <span>InfluencerMatch</span>
                </a>
                <p className="nl-foot-desc">
                  Nền tảng kết nối Thương hiệu và Nhà sáng tạo nội dung (KOC/KOL) bằng AI thông minh hàng đầu Việt Nam.
                </p>
                <div className="nl-foot-status">
                  <span className="nl-chip">
                    <span className="nl-live-dot" />
                    Hệ thống hoạt động ổn định
                  </span>
                </div>
              </div>

              <div className="nl-foot-col">
                <h4>TÍNH NĂNG</h4>
                <ul>
                  <li><a href="#studio">Khám phá KOC bằng AI</a></li>
                  <li><a href="#packs">Giỏ Shortlist &amp; So sánh</a></li>
                  <li><a href="#dash">Outreach CRM &amp; Hợp tác</a></li>
                </ul>
              </div>

              <div className="nl-foot-col">
                <h4>VAI TRÒ</h4>
                <ul>
                  <li><a href="#uses">Thương hiệu (Brand)</a></li>
                  <li><a href="#uses">Nhà sáng tạo (KOC)</a></li>
                  <li><a href="#uses">Quản trị Dữ liệu</a></li>
                  <li><a href="#uses">Quản trị Hệ thống</a></li>
                </ul>
              </div>

              <div className="nl-foot-col">
                <h4>NỀN TẢNG</h4>
                <ul>
                  <li><a href="#packs">TikTok Việt Nam</a></li>
                  <li><a href="#packs">Instagram Reels</a></li>
                  <li><a href="#packs">YouTube Shorts</a></li>
                  <li><a href="#packs">Facebook &amp; Livestream</a></li>
                </ul>
              </div>

              <div className="nl-foot-col">
                <h4>TRUY CẬP</h4>
                <ul>
                  <li><Link to="/register">Đăng ký Thương hiệu</Link></li>
                  <li><Link to="/login">Đăng nhập Hệ thống</Link></li>
                  <li><Link to="/login">Cổng Creator Portal</Link></li>
                  <li><a href="#end">Liên hệ Hỗ trợ</a></li>
                </ul>
              </div>
            </div>

            <div className="nl-legal-bar">
              <span>©2026 InfluencerMatch: Nền tảng Kết nối KOC &amp; Thương hiệu bằng AI®</span>
              <div className="nl-legal-links">
                <a href="#end">Chính sách Bảo mật</a>
                <a href="#end">Điều khoản Dịch vụ</a>
                <a href="#end">Quy chuẩn KOC</a>
              </div>
            </div>

            <div className="nl-wordmark" aria-hidden="true">
              InfluencerMatch
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
