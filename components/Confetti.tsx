"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: "rect" | "circle";
}

const COLORS = [
  "#a78bfa", // violet
  "#34d399", // emerald
  "#60a5fa", // blue
  "#f59e0b", // amber
  "#f472b6", // pink
  "#fbbf24", // yellow
];

export default function Confetti({ active }: { active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const frame = useRef<number>(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const el = canvas.current;
    if (!el) return;
    const W = el.offsetWidth;
    const H = el.offsetHeight;
    el.width = W;
    el.height = H;

    // Spawn 150 particles in two bursts from center-top
    for (let i = 0; i < 150; i++) {
      const angle = (Math.random() * Math.PI) - Math.PI * 0.9;
      const speed = 4 + Math.random() * 8;
      particles.current.push({
        x: W / 2 + (Math.random() - 0.5) * 120,
        y: H * 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 6,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }

    const ctx = el.getContext("2d")!;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.current = particles.current.filter(p => p.y < H + 20);

      for (const p of particles.current) {
        p.vy += 0.25; // gravity
        p.vx *= 0.99; // drag
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / H);

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (particles.current.length > 0) {
        frame.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    }

    frame.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame.current);
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvas}
      className="pointer-events-none fixed inset-0 z-50 w-full h-full"
    />
  );
}
