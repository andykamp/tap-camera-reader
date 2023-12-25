"use client";

import React, { useRef, useState } from 'react';

type Point = {
  x: number;
  y: number;
};

export default function ImageDrawer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const startCamera = async () => {
    if (!videoRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const takePicture = () => {
    resetDrawing();
    if (!canvasRef.current || !videoRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const resetDrawing = () => {
    setPolygonPoints([]);
    setIsDrawing(false);
  };

  const resetCanvas = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    // Clear the entire canvas
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Redraw the video frame onto the canvas, effectively resetting it
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    // Reset the polygon points
    setPolygonPoints([]);
  };

  const handleStart = (x: number, y: number) => {
    setIsDrawing(true);
    addPoint(x, y);
  };

  const handleMove = (x: number, y: number) => {
    if (!isDrawing) return;
    addPoint(x, y);
    drawLine();
  };

  const handleEnd = () => {
    setIsDrawing(false);
    closePolygonAndProcess();
  };

  const addPoint = (x: number, y: number) => {
    setPolygonPoints([...polygonPoints, { x, y }]);
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = event.nativeEvent;
    handleStart(offsetX, offsetY);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = event.nativeEvent;
    handleMove(offsetX, offsetY);
  };

  const handleCanvasMouseUp = () => {
    handleEnd();
  };

  const handleCanvasTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    const { offsetX, offsetY } = getTouchPos(canvasRef.current, touch.clientX, touch.clientY);
    handleStart(offsetX, offsetY);
  };

  const handleCanvasTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    const { offsetX, offsetY } = getTouchPos(canvasRef.current, touch.clientX, touch.clientY);
    handleMove(offsetX, offsetY);
  };

  const handleCanvasTouchEnd = () => {
    handleEnd();
  };

  const getTouchPos = (canvasDom: HTMLCanvasElement | null, touchX: number, touchY: number) => {
    if (!canvasDom) {
      return { offsetX: 0, offsetY: 0 };
    }
    const rect = canvasDom.getBoundingClientRect();
    return {
      offsetX: touchX - rect.left,
      offsetY: touchY - rect.top
    };
  };

  const drawLine = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context || polygonPoints.length < 1) return;

    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    context.beginPath();
    context.strokeStyle = 'green';
    context.lineWidth = 2;
    context.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    polygonPoints.forEach((point, index) => {
      if (index > 0) {
        context.lineTo(point.x, point.y);
      }
    });
    context.stroke();
  };

  const closePolygonAndProcess = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    const path = new Path2D();
    polygonPoints.forEach((point, index) => {
      if (index === 0) {
        path.moveTo(point.x, point.y);
      } else {
        path.lineTo(point.x, point.y);
      }
    });
    path.closePath();

    context.clip(path);

    // Draw the image inside the polygon
    // context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    // Create a new canvas for the overlay
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = canvasRef.current.width;
    overlayCanvas.height = canvasRef.current.height;
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!overlayCtx) return;

    // Set outside of the polygon to 50% opacity white
    overlayCtx.fillStyle = 'rgba(0, 128, 0, 0.5)'; // Green with 50% opacity
    overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    overlayCtx.globalCompositeOperation = 'destination-out';
    overlayCtx.fill(path);

    // Combine the two canvases
    context.globalCompositeOperation = 'source-over';
    context.drawImage(overlayCanvas, 0, 0);

    // Reset the polygon points
    setPolygonPoints([]);
  };


  return (
    <div>
      <video ref={videoRef} autoPlay></video>
      <div className="flex flex-row gap-1">
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={takePicture}>Take Picture</button>
        <button onClick={resetCanvas}>Reset</button>
      </div>
      <canvas
        ref={canvasRef}
        width={300}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onTouchStart={handleCanvasTouchStart}
        onTouchMove={handleCanvasTouchMove}
        onTouchEnd={handleCanvasTouchEnd}
      ></canvas>
    </div>
  );
}
