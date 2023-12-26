"use client";

import React, { useRef, useState } from 'react';
import { download, extractTextFromCanvas } from './tesseract';

type VideoDimensions = {
  width: number,
  height: number
}

const DEFAULT_VIDEO_DIMENSIONS: VideoDimensions = {
  width: 640,
  height: 480
}

type Point = {
  x: number;
  y: number;
};

const constraints = {
  video: {
    facingMode: "environment" // Use the rear camera
  }
};

const DRAWING_CANVAS_ID = 'drawing-canvas';

export default function ImageDrawer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  const [videoDimensions, setVideoDimensions] = useState(DEFAULT_VIDEO_DIMENSIONS);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isClipped, setIsClipped] = useState(false);

  const [text, setText] = useState<string>();

  const startCamera = async () => {
    if (!videoRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoRef.current.srcObject = stream;
  };

  const stopCamera = () => {
    if (!videoRef.current) return;
    const stream = videoRef.current.srcObject as MediaStream;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const getVideoDimensions = () => {
    if (!videoRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      return DEFAULT_VIDEO_DIMENSIONS
    }

    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    console.log('width, height', width, height);

    return { width, height };
  };

  const takePicture = () => {
    resetDrawing();
    if (!canvasRef.current || !videoRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    setVideoDimensions(getVideoDimensions());

    const screenshot = videoRef.current
    context.drawImage(screenshot, 0, 0, canvasRef.current.width, canvasRef.current.height);

    stopCamera();
  };

  const resetDrawing = () => {
    setPolygonPoints([]);
    setIsDrawing(false);
  };

  const resetCanvas = () => {
    console.log('resetCanvas',);

    // Reset the polygon points
    setPolygonPoints([]);
    setIsClipped(false)

    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (!context) return;
      // Clear the entire canvas
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    if (drawingCanvasRef.current) {
      const contextDrawing = drawingCanvasRef.current.getContext('2d');
      if (!contextDrawing) return;
      // Clear the entire canvas
      contextDrawing.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    }

    startCamera();
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
    const { offsetX, offsetY } = getTouchPos(drawingCanvasRef.current, touch.clientX, touch.clientY);
    handleStart(offsetX, offsetY);
  };

  const handleCanvasTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    const { offsetX, offsetY } = getTouchPos(drawingCanvasRef.current, touch.clientX, touch.clientY);
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
    if (!canvasRef.current || !drawingCanvasRef.current) return;
    const context = drawingCanvasRef.current.getContext('2d');
    if (!context || polygonPoints.length < 1) return;

    context.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    // apply image
    // const screenshot = canvasRef.current
    // context.drawImage(screenshot, 0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);

    // apply stroke
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
    if (!canvasRef.current || !drawingCanvasRef.current) return;

    const context = drawingCanvasRef.current.getContext('2d') as CanvasRenderingContext2D;

    // remove the drawn line
    context.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);

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
    const screenshot = canvasRef.current;
    context.drawImage(screenshot, 0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);

    // Set everything outside the polygon to white with 50% transparency
    // context.globalCompositeOperation = 'destination-in';
    // context.fillStyle = 'rgba(255, 255, 255, 1)'; // White with 50% opacity
    // context.fillRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);

    // Reset the globalCompositeOperation
    // context.globalCompositeOperation = 'source-over';

    // Reset the polygon points
    setPolygonPoints([]);
    setIsClipped(true);
  };

  const imageToText = async () => {
    const text = await extractTextFromCanvas(DRAWING_CANVAS_ID)
     setText(text)
  }

  return (
    <div>
      <div className="flex flex-row gap-1 overflow-y-hidden">
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={takePicture}>Take Picture</button>
        <button onClick={resetCanvas}>Reset</button>
        <button onClick={() => download(DRAWING_CANVAS_ID)}>download</button>
        <button onClick={imageToText}>tess</button>
      </div>
      {text &&
        <pre className="p-4 bg-red-600">
          {text}
        </pre>
      }
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          width={videoDimensions.width}
          height={videoDimensions.height}
        ></video>

        <div className="absolute top-0 left-0">
          <canvas
            className={isClipped ? 'opacity-30' : ''}
            ref={canvasRef}
            width={videoDimensions.width}
            height={videoDimensions.height}
          ></canvas>
        </div>
        <div className="absolute top-0 left-0">
          <canvas
            id={DRAWING_CANVAS_ID}
            className={isClipped ? 'pointer-events-none' : 'pointer-events-auto'}
            ref={drawingCanvasRef}
            width={videoDimensions.width}
            height={videoDimensions.height}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
          ></canvas>
        </div>
      </div>
    </div>
  );
}
