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
    resetDrawing()
    if (!canvasRef.current || !videoRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    console.log('dddd', );

    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const resetDrawing = () => {
    setPolygonPoints([]);
    setIsDrawing(false);
  }



  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    addPoint(event);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    addPoint(event);
    drawLine();
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    closePolygonAndProcess();
  };

  const addPoint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;
    setPolygonPoints([...polygonPoints, { x, y }]);
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
      <button onClick={startCamera}>Start Camera</button>
      <button onClick={takePicture}>Take Picture</button>
      <canvas
        ref={canvasRef}
        width={640} // Set the desired width
        height={480} // Set the desired height
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        // onMouseOut={handleCanvasMouseUp}
      ></canvas>
    </div>
  );
}
