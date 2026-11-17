import { useEffect, useRef } from 'react';
import type { Mood } from '../state/day';

/**
 * The living sky behind Today: a saturated mood gradient plus a light particle layer drawn on canvas.
 * Rain falls in slanted streaks, snow drifts, sunny days float soft motes of light upward.
 * Pauses when the tab is hidden; draws a single still frame when motion is reduced.
 */
export function Scene({ mood }: { mood: Mood }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(2, devicePixelRatio || 1);
    let w = 0, h = 0, raf = 0, last = performance.now();
    const resize = () => { w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();

    const kind = mood === 'rain' ? 'rain' : mood === 'frost' ? 'snow' : 'motes';
    const n = kind === 'rain' ? 90 : kind === 'snow' ? 60 : 26;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const ps = Array.from({ length: n }, () => ({
      x: rand(0, w), y: rand(0, h), z: rand(0.4, 1),
      r: kind === 'motes' ? rand(10, 46) : rand(1, 3.2), p: rand(0, Math.PI * 2),
    }));

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const q of ps) {
        if (kind === 'rain') {
          q.y += 900 * q.z * dt; q.x -= 220 * q.z * dt;
          if (q.y > h + 20) { q.y = -20; q.x = rand(0, w + 120); }
          ctx.strokeStyle = `rgba(255,255,255,${0.18 + 0.32 * q.z})`;
          ctx.lineWidth = 1.2 * q.z + 0.4;
          ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + 6 * q.z, q.y - 22 * q.z); ctx.stroke();
        } else if (kind === 'snow') {
          q.p += dt; q.y += 34 * q.z * dt; q.x += Math.sin(q.p) * 18 * dt;
          if (q.y > h + 10) { q.y = -10; q.x = rand(0, w); }
          ctx.fillStyle = `rgba(255,255,255,${0.45 + 0.5 * q.z})`;
          ctx.beginPath(); ctx.arc(q.x, q.y, q.r * q.z + 0.6, 0, Math.PI * 2); ctx.fill();
        } else {
          q.p += dt * 0.5; q.y -= 10 * q.z * dt; q.x += Math.sin(q.p) * 6 * dt;
          if (q.y < -60) { q.y = h + 60; q.x = rand(0, w); }
          const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
          g.addColorStop(0, `rgba(255,255,255,${0.16 * q.z})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
        }
      }
    };
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };
    if (still) draw(0);
    else raf = requestAnimationFrame(loop);
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !still) { last = performance.now(); raf = requestAnimationFrame(loop); }
    };
    addEventListener('resize', resize);
    document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', vis); };
  }, [mood]);
  return <div className="scene" aria-hidden="true"><canvas ref={ref} /></div>;
}

/** One celebratory burst of clay confetti from a point, then gone. Also a short haptic tap where supported. */
export function confettiFrom(x: number, y: number, colors: string[]) {
  navigator.vibrate?.([12, 40, 18]);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  document.body.appendChild(c);
  const ctx = c.getContext('2d')!;
  const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const bits = Array.from({ length: 70 }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
    const v = 420 + Math.random() * 520;
    return {
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 4 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
      shape: Math.random() < 0.15 ? 'heart' : Math.random() < 0.5 ? 'dot' : 'bar', color: colors[Math.floor(Math.random() * colors.length)],
    };
  });
  let last = performance.now();
  const t0 = last;
  const step = (t: number) => {
    const dt = Math.min(0.033, (t - last) / 1000);
    last = t;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const life = (t - t0) / 1800;
    for (const b of bits) {
      b.vy += 1300 * dt; b.vx *= 0.99; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vr * dt;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - life * life);
      ctx.translate(b.x, b.y); ctx.rotate(b.rot);
      ctx.fillStyle = b.color;
      if (b.shape === 'dot') { ctx.beginPath(); ctx.arc(0, 0, b.r * 0.7, 0, Math.PI * 2); ctx.fill(); }
      else if (b.shape === 'bar') { ctx.beginPath(); ctx.roundRect(-b.r, -b.r * 0.35, b.r * 2, b.r * 0.7, b.r * 0.35); ctx.fill(); }
      else { ctx.font = `${b.r * 3}px system-ui`; ctx.fillText('♥', -b.r, b.r); }
      ctx.restore();
    }
    if (life < 1) requestAnimationFrame(step);
    else c.remove();
  };
  requestAnimationFrame(step);
}
