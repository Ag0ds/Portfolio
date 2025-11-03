"use client";

import React, { useRef, useEffect, useState } from "react";

const floor = 0;
const ballRadius = 100;
const damping = 0.85;
const traction = 0.9;
const gravity = 0.2;

interface BallState {
  cx: number;
  cy: number;
  vx: number;
  vy: number;
}

type Props = {
  containerSelector?: string;
  zIndex?: number;
  className?: string;
  style?: React.CSSProperties;
  throwfactor?: number;
};

const BouncingBallCanvas: React.FC<Props> = ({
  containerSelector = "[data-physics-container]",
  zIndex = 50,
  className,
  style,
  throwfactor = 0.8,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgReady, setImgReady] = useState(false);
  const ballRef = useRef<BallState>({ cx: 100, cy: 100, vx: 10, vy: -10 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0, lastPx: 0, lastPy: 0, lastT: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = "/Picture2.jpg";
    img.onload = () => setImgReady(true);
    imgRef.current = img;
    return () => {
      img.onload = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container =
      (canvas.closest(containerSelector) as HTMLElement) ||
      (canvas.parentElement as HTMLElement);
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
    });
    ro.observe(container);
    const rect = container.getBoundingClientRect();
    setCanvasSize({ width: rect.width, height: rect.height });
    return () => ro.disconnect();
  }, [containerSelector]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPointer = (e: PointerEvent) => {
      const container =
        (canvas.closest(containerSelector) as HTMLElement) ||
        (canvas.parentElement as HTMLElement) ||
        canvas;
      const r = container.getBoundingClientRect();
      return { px: e.clientX - r.left, py: e.clientY - r.top };
    };

    const onPointerDown = (e: PointerEvent) => {
      const { px, py } = getPointer(e);
      const b = ballRef.current;
      const dx = px - b.cx;
      const dy = py - b.cy;
      if (dx * dx + dy * dy > ballRadius * ballRadius) return;
      e.preventDefault();
      canvas.setPointerCapture?.(e.pointerId);
      dragRef.current.dragging = true;
      dragRef.current.offsetX = px - b.cx;
      dragRef.current.offsetY = py - b.cy;
      dragRef.current.lastPx = px;
      dragRef.current.lastPy = py;
      dragRef.current.lastT = performance.now();
      b.vx = 0;
      b.vy = 0;
      canvas.style.cursor = "grabbing";
      (document.body as any).style.userSelect = "none";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current.dragging) return;
      const { px, py } = getPointer(e);
      const now = performance.now();
      const dt = Math.max(1, now - dragRef.current.lastT) / 1000;
      const b = ballRef.current;
      const bx = px - dragRef.current.offsetX;
      const by = py - dragRef.current.offsetY;
      b.cx = Math.min(Math.max(bx, ballRadius), canvasSize.width - ballRadius);
      b.cy = Math.min(Math.max(by, ballRadius), canvasSize.height - ballRadius);
      b.vx = ((px - dragRef.current.lastPx) / dt) * throwfactor;
      b.vy = ((py - dragRef.current.lastPy) / dt) * throwfactor;
      dragRef.current.lastPx = px;
      dragRef.current.lastPy = py;
      dragRef.current.lastT = now;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;
      canvas.releasePointerCapture?.(e.pointerId);
      canvas.style.cursor = "grab";
      (document.body as any).style.userSelect = "";
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.style.cursor = "grab";

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      (document.body as any).style.userSelect = "";
    };
  }, [containerSelector, canvasSize.width, canvasSize.height, throwfactor]);

  useEffect(() => {
    if (canvasSize.width === 0 || canvasSize.height === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(canvasSize.width * dpr);
    canvas.height = Math.floor(canvasSize.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = "high";

    let rafId: number;
    const b = ballRef.current;
    b.cx = Math.max(ballRadius, Math.min(b.cx, canvasSize.width - ballRadius));
    b.cy = Math.max(ballRadius, Math.min(b.cy, canvasSize.height - ballRadius));

    const draw = () => {
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

      if (!dragRef.current.dragging) {
        if (b.cx + ballRadius >= canvasSize.width) {
          b.vx = -b.vx * damping;
          b.cx = canvasSize.width - ballRadius;
        } else if (b.cx - ballRadius <= 0) {
          b.vx = -b.vx * damping;
          b.cx = ballRadius;
        }
        if (b.cy + ballRadius + floor >= canvasSize.height) {
          b.vy = -b.vy * damping;
          b.cy = canvasSize.height - ballRadius - floor;
          b.vx *= traction;
        } else if (b.cy - ballRadius <= 0) {
          b.vy = -b.vy * damping;
          b.cy = ballRadius;
        }
        b.vy += gravity;
        b.cx += b.vx;
        b.cy += b.vy;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(b.cx, b.cy, ballRadius, 0, Math.PI * 2);
      ctx.clip();
      if (imgReady && imgRef.current) {
        const size = ballRadius * 2;
        ctx.drawImage(imgRef.current, b.cx - ballRadius, b.cy - ballRadius, size, size);
      } else {
        ctx.fillStyle = "#2ed851";
        ctx.fillRect(b.cx - ballRadius, b.cy - ballRadius, ballRadius * 2, ballRadius * 2);
      }
      ctx.restore();

      ctx.beginPath();
      ctx.arc(b.cx, b.cy, ballRadius, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,.8)";
      ctx.stroke();

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [canvasSize.width, canvasSize.height, imgReady]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        zIndex,
        pointerEvents: "auto",
        ...style,
      }}
    />
  );
};

export default BouncingBallCanvas;
