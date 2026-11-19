import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './HeroLanding.css';
import LandingPlans from './LandingPlans';
import BrandLogo from '../../../components/layout/BrandLogo';

const POND_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261104_160514_d8369d6e-d8ba-4532-9751-b32e0c8aaf75.mp4';
const KOI_GLB_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261104_151843_47d87652-1c40-465c-b0d6-cd94c22a9d3e.glb';

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

const LANDING_NAV = [
  { id: 'features', label: 'Tính năng' },
  { id: 'workflow', label: 'Quy trình' },
  { id: 'plans', label: 'Gói dịch vụ' },
];

function layoutTop(element: Element): number {
  let top = 0;
  for (let current = element as HTMLElement | null; current; current = current.offsetParent as HTMLElement | null) top += current.offsetTop;
  return top;
}

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
  const scrollHintRef = useRef<HTMLButtonElement>(null);

  const studioRef = useRef<HTMLElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);
  const packsRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const initialStudioEntry = useRef(location.hash === '#studio');
  const [activeSection, setActiveSection] = useState('');

  const anchorOffset = useCallback(() => 0, []);
  const scrollToAnchor = useCallback((hash: string) => {
    let id: string;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    if (id !== 'top') (target.closest('section') ?? target).classList.add('nl-anchor-target');
    window.scrollTo({
      top: id === 'top' ? 0 : Math.max(0, layoutTop(target) - anchorOffset()),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }, [anchorOffset]);
  const handleAnchorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = anchor?.getAttribute('href');
    if (!hash || !document.getElementById(hash.slice(1))) return;
    event.preventDefault();
    anchor?.closest('details')?.removeAttribute('open');
    if (location.hash === hash) scrollToAnchor(hash);
    else navigate({ pathname: location.pathname, search: location.search, hash }, { preventScrollReset: true });
  };

  useEffect(() => {
    if (location.hash === '#uses') {
      navigate({ pathname: location.pathname, search: location.search, hash: '#workflow' }, { replace: true, preventScrollReset: true });
      return;
    }
    if (initialStudioEntry.current) {
      if (location.hash === '#studio') {
        navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true, preventScrollReset: true });
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }
      initialStudioEntry.current = false;
    }
    if (!location.hash) return;
    let cancelled = false;
    let frame = 0;
    void document.fonts.ready.then(() => {
      if (!cancelled) frame = requestAnimationFrame(() => scrollToAnchor(location.hash));
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [location.hash, location.pathname, location.search, navigate, scrollToAnchor]);

  useEffect(() => {
    let frame = 0;
    let disposed = false;
    const update = () => {
      const plans = document.getElementById('plans');
      pageRef.current?.classList.toggle('nl-ending-reading', !!plans && window.scrollY >= layoutTop(plans) - anchorOffset() - 2);
      // Follow the reading area near the top, even when the next section is taller.
      const readingLine = window.scrollY + anchorOffset() + Math.min(120, window.innerHeight * 0.15);
      let current = '';
      for (const section of pageRef.current?.querySelectorAll<HTMLElement>('[data-scroll-section]') ?? []) {
        const top = layoutTop(section);
        if (top <= readingLine && top + section.offsetHeight > readingLine) {
          current = section.dataset.navSection ?? section.id;
          break;
        }
      }
      if (window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 2) current = 'footer';
      setActiveSection(LANDING_NAV.some(item => item.id === current) ? current : '');
    };
    const schedule = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
    };
    const observer = new ResizeObserver(schedule);
    if (navRef.current) observer.observe(navRef.current);
    if (pageRef.current) observer.observe(pageRef.current);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    void document.fonts.ready.then(schedule);
    schedule();
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [anchorOffset]);

  // Native snap handles layout. Desktop gestures only need a guard at section
  // boundaries: Chromium can otherwise skip snap-stop:always with large deltas.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1025px) and (hover: hover) and (pointer: fine)');
    let lastWheel = 0;
    let direction = 0;
    let handled = false;
    let transitioning = false;
    let settleTimer: number | undefined;
    const releaseAfterScroll = () => {
      if (!transitioning) return;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => { transitioning = false; }, 120);
    };
    const onWheel = (event: WheelEvent) => {
      if (!desktop.matches || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey ||
        !event.deltaY || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const origin = event.target instanceof Element ? event.target : null;
      if (origin?.closest('input, textarea, select, [contenteditable="true"], [role="combobox"], [role="listbox"], details[open]')) return;
      for (let element = origin; element && element !== pageRef.current; element = element.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight + 1) return;
      }
      const now = performance.now();
      const nextDirection = Math.sign(event.deltaY);
      if ((now - lastWheel > 180 || nextDirection !== direction) && !transitioning) handled = false;
      lastWheel = now;
      direction = nextDirection;
      if (handled || transitioning) {
        event.preventDefault();
        return;
      }
      const sections = Array.from(pageRef.current?.querySelectorAll<HTMLElement>('[data-scroll-section]') ?? []);
      const viewport = window.innerHeight;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewport);
      const pageStep = Math.max(1, viewport - 48);
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? pageStep : 1);
      const start = (section: HTMLElement) => section.id === 'hero' ? 0 : Math.min(maxScroll, Math.max(0, layoutTop(section) - anchorOffset()));
      const end = (section: HTMLElement) => Math.max(start(section), layoutTop(section) + section.offsetHeight - viewport);
      let index = 0;
      for (let i = 0; i < sections.length; i++) if (start(sections[i]) <= window.scrollY + 2) index = i;
      const section = sections[index];
      if (!section) return;
      const y = window.scrollY;
      // Pricing and the compact footer form a continuous closing area.
      if (index === sections.length - 1 && (direction > 0 || y > start(section) + 2)) return;
      let destination: number | undefined;
      if (direction > 0) {
        if (y < end(section) - 2) {
          if (delta > Math.min(pageStep, end(section) - y)) destination = Math.min(end(section), y + pageStep);
        } else if (sections[index + 1]) destination = start(sections[index + 1]);
      } else {
        if (y > start(section) + 2) {
          if (-delta > Math.min(pageStep, y - start(section))) destination = Math.max(start(section), y - pageStep);
        } else if (sections[index - 1]) destination = end(sections[index - 1]);
      }
      if (destination === undefined || Math.abs(destination - y) < 1) return;
      event.preventDefault();
      handled = true;
      transitioning = true;
      settleTimer = window.setTimeout(() => { transitioning = false; }, 600);
      window.scrollTo({ top: destination, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', releaseAfterScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', releaseAfterScroll);
      window.clearTimeout(settleTimer);
    };
  }, [anchorOffset]);

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
    document.title = 'InfluencerMatch — Nền tảng Kết nối Nhà sáng tạo & Thương hiệu bằng AI';
    // Respect the visitor’s motion preference.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Ensure html & body are scrollable (override any global overflow: hidden)
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const prevHtmlOverflow = htmlEl.style.overflowY;
    const prevHtmlMaxH = htmlEl.style.maxHeight;
    const prevHtmlH = htmlEl.style.height;
    const prevBodyOverflow = bodyEl.style.overflowY;
    const prevBodyMaxH = bodyEl.style.maxHeight;
    const prevBodyH = bodyEl.style.height;
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

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
              el: scrollHintRef.current,
              from: { opacity: 0, transform: 'translateY(8px)' },
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
      const endTop = endRef.current ? layoutTop(endRef.current) : document.documentElement.scrollHeight - h;
      const toNight = smoothstep(endTop - 1.1 * h, endTop - 0.1 * h, y);
      const studioTop = studioRef.current ? layoutTop(studioRef.current) : h;
      const studioFocus = 1 - smoothstep(0.15 * h, 0.85 * h, Math.abs(y - studioTop));

      if (dayLayerRef.current) {
        dayLayerRef.current.style.opacity = String(1 - toNight);
        dayLayerRef.current.style.transform = `scale(${1 + 0.08 * toViolet}) translateY(${-0.02 * Math.min(y, h)}px)`;
      }

      if (violetLayerRef.current) {
        violetLayerRef.current.style.opacity = String((0.68 - 0.32 * studioFocus) * toViolet * (1 - toNight));
      }
      if (nightLayerRef.current) {
        nightLayerRef.current.style.opacity = String(toNight);
      }

      if (videoEl && !reducedMotion) {
        if (toNight < 0.999) {
          if (videoEl.paused) {
            videoEl.play().catch(() => { });
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
          videoEl.play().catch(() => { });
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
          videoEl.play().catch(() => { });

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
              } catch { }
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
          () => { }
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
          const isPhone = (document.documentElement.clientWidth || window.innerWidth) <= 820;
          const absTop = (el: HTMLElement | null) =>
            el ? layoutTop(el) : 0;

          const studioTop = absTop(studioRef.current);
          const dashEl = dashRef.current;
          const dashTop = dashEl
            ? absTop(dashEl) + dashEl.offsetHeight * 0.5 - 0.5 * h
            : studioTop + 0.8 * h;
          const packsTop = absTop(packsRef.current);
          const workflowTop = absTop(document.getElementById('workflow'));
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
              scrollY: Math.max(0, studioTop - 24),
              x: isPhone ? 0.72 : -0.76,
              y: isPhone ? -0.42 : 0.05,
              s: isPhone ? 0.24 : 0.42,
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
              scrollY: packsTop,
              x: isPhone ? 0.68 : 0.72,
              y: isPhone ? -0.65 : -0.62,
              s: isPhone ? 0.24 : 0.28,
              yaw: 0.2,
              pitch: -0.1,
              roll: 0.04,
            },
            {
              scrollY: workflowTop,
              x: isPhone ? 0.72 : 0.76,
              y: isPhone ? -0.65 : -0.62,
              s: isPhone ? 0.24 : 0.28,
              yaw: 0.2,
              pitch: -0.1,
              roll: 0.04,
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
          ].sort((a, b) => a.scrollY - b.scrollY);
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
      window.history.scrollRestoration = previousRestoration;
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

  const scrollToStudio = () => {
    if (location.hash === '#studio') scrollToAnchor('#studio');
    else navigate({ pathname: location.pathname, search: location.search, hash: '#studio' }, { preventScrollReset: true });
  };

  return (
    <div ref={pageRef} id="top" className="nl-page anim" onClick={handleAnchorClick}>
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

      <main className="nl-main">
        <section id="hero" data-scroll-section aria-label="Giới thiệu InfluencerMatch">
          {/* Navigation stays in document flow inside the opening section. */}
          <nav ref={navRef} className="nl-nav" aria-label="Điều hướng trang chủ" data-in>
            <BrandLogo href="#top" className="nl-logo" />

            <div className="nl-nav-center">
              {LANDING_NAV.map(item => <a key={item.id} href={'#' + item.id} className={'nl-nav-item' + (activeSection === item.id ? ' is-active' : '')} aria-current={activeSection === item.id ? 'location' : undefined}>{item.label}</a>)}
            </div>

            <div className="nl-nav-right">
              <details className="nl-mobile-menu">
                <summary aria-label="Mở menu điều hướng"><span aria-hidden="true">☰</span></summary>
                <div>
                  {LANDING_NAV.map(item => <a key={item.id} href={'#' + item.id} aria-current={activeSection === item.id ? 'location' : undefined}>{item.label}</a>)}
                  <Link to="/login">Đăng nhập</Link>
                </div>
              </details>
              <Link to="/login" className="nl-nav-pill grey">
                Đăng nhập
              </Link>
              <Link to="/register" className="nl-nav-pill primary">
                Đăng ký
              </Link>
            </div>
          </nav>

          <div className="nl-hero-stage">
            <div className="nl-hero-copy">
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
                Kết nối thông minh, nâng tầm thương hiệu
              </p>

              <div ref={heroBtnsRef} className="nl-hero-btns" data-in>
                <Link to="/register" className="nl-btn fill nl-studio-btn-primary">
                  <span>Bắt đầu — Miễn phí</span>
                  <svg className="nl-btn-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M2.5 8h11M9.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link to="/login" className="nl-btn ghost nl-studio-btn-ghost">
                  <svg className="nl-btn-play" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M4.5 3.5v9l8-4.5-8-4.5z" />
                  </svg>
                  <span>Đăng nhập hệ thống</span>
                </Link>
              </div>

            </div>

            <button
              ref={scrollHintRef}
              type="button"
              className="nl-scroll-hint"
              aria-label="Tìm hiểu nền tảng, cuộn đến phần giới thiệu"
              onClick={scrollToStudio}
              data-in
            >
              <span>Tìm hiểu nền tảng</span>
              <svg className="nl-scroll-arrow" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path
                  d="M11 3 v15 M5 12 l6 6 6 -6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </section>

        {/* ── 8.2 Studio & Product Dashboard ─────────────────────────────── */}
        <section ref={studioRef} id="studio" data-scroll-section aria-labelledby="landing-studio-title">
          <div className="nl-studio-content">
            <h2 id="landing-studio-title" className="nl-studio-h2 nl-reveal">
              Tìm nhà sáng tạo phù hợp,<br />
              <span className="nl-accent">quản lý hợp tác rõ ràng.
                <svg className="nl-studio-underline" viewBox="0 0 220 28" fill="none" aria-hidden="true">
                  <path d="M4 13C63-1 147-1 215 13M46 24C100 12 151 13 184 22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h2>

            <p className="nl-lede nl-studio-lede nl-reveal">
              Khám phá kênh, đánh giá mức độ phù hợp và theo dõi quá trình hợp tác.
            </p>

            <div className="nl-studio-btns nl-reveal">
              <Link to="/register" className="nl-btn fill">
                <span>Bắt đầu — miễn phí</span>
                <svg className="nl-btn-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2.5 8h11M9.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a href="#workflow" className="nl-btn ghost">
                <svg className="nl-studio-play" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11L13 8z" /></svg>
                <span>Xem quy trình</span>
              </a>
            </div>

          </div>
        </section>

        <section id="preview" className="nl-preview" data-scroll-section aria-labelledby="landing-preview-title">
          <p className="nl-demo-caption">Minh hoạ giao diện — số liệu mô phỏng, không phải kết quả kinh doanh hay dữ liệu người dùng thực.</p>
          {/* Product Dashboard illustration */}
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
                <span>Tìm kiếm Nhà sáng tạo, chiến dịch...</span>
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
                  <span>Giỏ Shortlist Nhà sáng tạo</span>
                  <span className="nl-dash-count">16</span>
                </div>
                <div className="nl-dash-nav-item">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M8 2l4.8 2.2v3.6c0 3.1-2 5.2-4.8 6.2-2.8-1-4.8-3.1-4.8-6.2V4.2L8 2z" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  <span>Xác minh kênh</span>
                </div>
                <div className="nl-dash-nav-item">
                  <svg viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3.2" width="12" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5.5 13.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <span>Báo giá dịch vụ</span>
                  <span className="nl-dash-count">24</span>
                </div>
              </aside>

              <div className="nl-dash-main">
                <div className="nl-dash-head">
                  <div className="nl-dash-title">Hiệu suất chiến dịch &amp; Nhà sáng tạo</div>
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
                    { label: 'Tổng lượt tiếp cận (Reach)', val: '8,42M', chip: '+18%', up: true, color: 'var(--preview-chart-primary)', id: 'sp0' },
                    { label: 'Tỷ lệ tương tác (ER TB)', val: '6,8%', chip: '+1,4pt', up: true, color: 'var(--preview-chart-secondary)', id: 'sp1' },
                    { label: 'Ngân sách đã giải ngân', val: '184,2Tr', chip: '+12%', up: true, color: 'var(--preview-chart-primary)', id: 'sp2' },
                    { label: 'Nhà sáng tạo đang hợp tác', val: '24', chip: '+5', up: true, color: 'var(--preview-chart-secondary)', id: 'sp3' },
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
                          <i className="nl-swatch" style={{ background: 'var(--preview-chart-primary)' }} />
                          Lượt xem
                        </span>
                        <span>
                          <i className="nl-swatch" style={{ background: 'var(--preview-chart-secondary)' }} />
                          Tương tác
                        </span>
                      </div>
                    </div>

                    <svg className="nl-area-svg" viewBox="0 0 600 190" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--preview-chart-primary)" stopOpacity="0.42" />
                          <stop offset="100%" stopColor="var(--preview-chart-primary)" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="areaWin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--preview-chart-secondary)" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="var(--preview-chart-secondary)" stopOpacity="0" />
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
                        stroke="var(--preview-chart-primary)"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        pathLength={1}
                        className="nl-draw-line"
                      />
                      <path
                        d={charts.winLine}
                        fill="none"
                        stroke="var(--preview-chart-secondary)"
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
                            fill="var(--navy)"
                            stroke="var(--preview-chart-primary)"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                          />
                        </g>
                      )}
                    </svg>
                  </div>

                  <div className="nl-chart-pane">
                    <div className="nl-pane-head">
                      <span>Tỷ trọng nền tảng Nhà sáng tạo</span>
                    </div>
                    <div className="nl-bars-list">
                      {[
                        { label: 'TikTok Video', val: 38, color: 'var(--preview-chart-primary)', alpha: 'var(--preview-chart-fade)' },
                        { label: 'Instagram Reels', val: 27, color: 'var(--preview-chart-primary)', alpha: 'var(--preview-chart-fade)' },
                        { label: 'YouTube Shorts', val: 19, color: 'var(--preview-chart-secondary)', alpha: 'var(--preview-chart-fade)' },
                        { label: 'Livestream', val: 10, color: 'var(--preview-chart-primary)', alpha: 'var(--preview-chart-fade)' },
                        { label: 'Bài đăng Review', val: 6, color: 'var(--preview-chart-secondary)', alpha: 'var(--preview-chart-fade)' },
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
                    <span>Đối tác Nhà sáng tạo</span>
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

        {/* ── 8.3 Features & Tools (Merged into 1 concise section) ────── */}
        <section ref={packsRef} id="features" data-scroll-section aria-labelledby="landing-features-title">
          <div className="nl-features-unified">
            <header className="nl-features-header nl-reveal">
              <div className="nl-studio-badge">
                <span className="nl-studio-badge-sparkle">✦</span>
                <span>Bộ công cụ quy trình hợp tác</span>
              </div>
              <h2 id="landing-features-title" className="nl-packs-h2">
                Các công cụ cho một <span className="nl-accent">quy trình hợp tác rõ ràng.</span>
              </h2>
              <p className="nl-lede nl-packs-lede">
                Chuẩn bị chiến dịch, đánh giá kênh phù hợp và chủ động theo dõi hợp tác ở từng bước.
              </p>
              <div className="nl-packs-btns">
                <Link to="/register" className="nl-btn fill nl-studio-btn-primary">
                  <span>Đăng ký Thương hiệu</span>
                  <ArrowRightSvg />
                </Link>
                <Link to="/login" className="nl-btn ghost nl-studio-btn-ghost">
                  <span>Cổng Nhà sáng tạo</span>
                </Link>
              </div>
            </header>

            <div className="nl-pack-grid nl-reveal">
              <div className="nl-pack-card lead">
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
                <div className="nl-pack-eyebrow">KHÁM PHÁ VÀ GỢI Ý</div>
                <h3 className="nl-pack-title">Đánh giá kênh phù hợp</h3>
                <p className="nl-pack-body">
                  Tìm kiếm, lưu kênh và nhận gợi ý chuẩn xác theo mục tiêu chiến dịch với công nghệ AI.
                </p>
                <div className="nl-pack-meta">
                  <div>
                    <div className="nl-pack-meta-cap">Nguồn đánh giá</div>
                    <div className="nl-pack-metric">Four-Memory</div>
                  </div>
                  <Link to="/register" className="nl-arrow-link">
                    <span>Khám phá</span>
                    <ArrowRightSvg />
                  </Link>
                </div>
              </div>

              <div className="nl-pack-card nl-glass">
                <div className="nl-pack-top">
                  <span className="nl-pack-idx">02</span>
                  <span className="nl-bare-icon">
                    <svg viewBox="0 0 22 22" fill="none">
                      <rect x="4" y="5" width="14" height="9" rx="1.8" stroke="#fff" strokeWidth="1.3" />
                      <path d="M7.5 17.5h7" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </span>
                </div>
                <div className="nl-pack-eyebrow">QUẢN LÝ HỢP TÁC</div>
                <h3 className="nl-pack-title">Theo dõi thỏa thuận &amp; nội dung</h3>
                <p className="nl-pack-body">
                  Chuẩn bị hồ sơ tiếp cận, kiểm soát tiến độ đăng bài và xác nhận kết quả theo thời gian thực.
                </p>
                <div className="nl-pack-meta">
                  <div>
                    <div className="nl-pack-meta-cap">Cách làm việc</div>
                    <div className="nl-pack-metric">Theo từng bước</div>
                  </div>
                  <Link to="/register" className="nl-arrow-link">
                    <span>Khám phá</span>
                    <ArrowRightSvg />
                  </Link>
                </div>
              </div>

              <div className="nl-pack-card nl-glass">
                <div className="nl-pack-top">
                  <span className="nl-pack-idx">03</span>
                  <span className="nl-bare-icon">
                    <svg viewBox="0 0 22 22" fill="none">
                      <path d="M3 16l5.5-5.5 4 4L19 8" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 8h5v5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                <div className="nl-pack-eyebrow">HỒ SƠ NHÀ SÁNG TẠO</div>
                <h3 className="nl-pack-title">Quản lý hồ sơ &amp; báo giá</h3>
                <p className="nl-pack-body">
                  Nhà sáng tạo cập nhật hồ sơ, công khai bảng giá minh bạch và xác thực quyền sở hữu kênh.
                </p>
                <div className="nl-pack-meta">
                  <div>
                    <div className="nl-pack-meta-cap">Quyền sở hữu kênh</div>
                    <div className="nl-pack-metric">Có kiểm duyệt</div>
                  </div>
                  <Link to="/register" className="nl-arrow-link">
                    <span>Khám phá</span>
                    <ArrowRightSvg />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="workflow" className="nl-workflow nl-collaboration" data-scroll-section aria-labelledby="landing-workflow-title">
          <header className="nl-collaboration-header">
            <h2 id="landing-workflow-title" className="nl-packs-h2">Từ lựa chọn <span className="nl-accent">đến hợp tác.</span></h2>
            <p className="nl-packs-lede">Một quy trình rõ ràng cho thương hiệu và nhà sáng tạo.</p>
          </header>

          <div className="nl-staircase">
            <article className="nl-use-card">
              <h3 className="nl-use-title">
                <span className="nl-role-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H12l8 8a2 2 0 0 1 0 2.8L14.8 20a2 2 0 0 1-2.8 0l-8-8V5.5Z" />
                    <circle cx="8.2" cy="8.2" r="1.2" />
                    <path d="m11 15 4-4" />
                  </svg>
                </span>
                Thương hiệu
              </h3>
              <p className="nl-use-body">Tạo chiến dịch, tìm kênh phù hợp và quản lý hợp tác.</p>
              <div className="nl-use-foot">
                <Link to="/register" className="nl-btn fill">Đăng ký thương hiệu <ArrowRightSvg /></Link>
              </div>
            </article>
            <article className="nl-use-card">
              <h3 className="nl-use-title">
                <span className="nl-role-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 12a5.66 5.66 0 0 0-8-8L4 12v8h8l8-8Z" />
                    <path d="M16 8 3 21M9 15h6" />
                  </svg>
                </span>
                Nhà sáng tạo
              </h3>
              <p className="nl-use-body">Quản lý hồ sơ, báo giá và phản hồi lời mời hợp tác.</p>
              <div className="nl-use-foot">
                <Link to="/login" className="nl-btn ghost">Đăng nhập nhà sáng tạo</Link>
              </div>
            </article>
          </div>

          <ol className="nl-steps-strip" aria-label="Ba bước hợp tác">
            {[
              ['Chuẩn bị', 'Hoàn thiện yêu cầu chiến dịch hoặc hồ sơ kênh.'],
              ['Lựa chọn và thỏa thuận', 'Khám phá, so sánh, xem gợi ý và chủ động liên hệ.'],
              ['Theo dõi hợp tác', 'Quản lý nội dung, tiến độ và kết quả.'],
            ].map(([title, description], index) => <li className="nl-step-item" key={title}><span className="nl-step-num">{String(index + 1).padStart(2, '0')}</span><div><strong>{title}</strong>{description}</div></li>)}
          </ol>
        </section>

        <section ref={endRef} id="end">
          <LandingPlans />

          <footer id="footer" className="nl-footer" aria-label="Thông tin và liên kết nền tảng">
            <svg className="nl-footer-wave" viewBox="0 0 600 140" fill="none" aria-hidden="true">
              <path d="M1 128C172 145 215 24 364 29s173 72 235 91" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1 137C172 154 215 33 364 38s173 72 235 91" stroke="currentColor" strokeWidth=".5" />
            </svg>
            <div className="nl-foot-grid">
              <div className="nl-foot-brand">
                <BrandLogo href="#top" className="nl-logo" />
                <p className="nl-foot-tagline">Kết nối phù hợp. Hợp tác bền lâu.</p>
              </div>

              <div className="nl-foot-col">
                <h4>Khám phá</h4>
                <ul>
                  <li><a href="#studio">Tìm nhà sáng tạo</a></li>
                  <li><a href="#features">Gợi ý phù hợp</a></li>
                  <li><a href="#workflow">Quản lý hợp tác</a></li>
                </ul>
              </div>

              <div className="nl-foot-col">
                <h4>Dành cho bạn</h4>
                <ul>
                  <li><a href="#workflow">Thương hiệu</a></li>
                  <li><a href="#workflow">Nhà sáng tạo</a></li>
                </ul>
              </div>

              <div className="nl-foot-col">
                <h4>Thông tin</h4>
                <ul>
                  <li><a href="#studio">Giới thiệu nền tảng</a></li>
                  <li><a href="#plans">Gói dịch vụ</a></li>
                </ul>
              </div>
            </div>

            <div className="nl-legal-bar">
              <span>© 2026 InfluencerMatch. Bảo lưu mọi quyền.</span>
              <div className="nl-legal-links">
                <a href="/terms-of-service">Điều khoản dịch vụ</a>
                <a href="/privacy-policy">Chính sách bảo mật</a>
              </div>
            </div>
            <div className="nl-footer-signature" aria-hidden="true">InfluencerMatch</div>

          </footer>
        </section>
      </main>
    </div>
  );
}
