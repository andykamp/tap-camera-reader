"use client";

import React, { ComponentProps, useEffect, useState } from 'react';

type Point = {
  x: number;
  y: number;
};

type CroppableCanvasProps = ComponentProps<'canvas'> & {
  id: string;
  reff: React.RefObject<HTMLCanvasElement>;
  screenshotTaken: boolean;
}
export default function CroppableCanvas(props: CroppableCanvasProps) {
  const { id, reff: ref, screenshotTaken, ...divCanvasProps } = props;

  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isClipped, setIsClipped] = useState(false);

  // Function to capture the current canvas state
  const captureOriginalImageData = () => {
    if (ref.current) {
      const ctx = ref.current.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, ref.current.width, ref.current.height);
        setOriginalImageData(imageData);
      }
    }
  };

  // Use useEffect to capture the original state of the canvas
  useEffect(() => {
    if (!screenshotTaken) return;
    captureOriginalImageData();
  }, [screenshotTaken]); // Empty dependency array ensures this runs once after the component mounts


  const resetCanvasToOriginal = () => {
    if (ref.current && originalImageData) {
      const ctx = ref.current.getContext('2d');
      if (ctx) {
        ctx.putImageData(originalImageData, 0, 0);
      }
    }
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

    if (ref.current) {
      const ctx = ref.current.getContext('2d');
      if (!ctx) return;
      // Clear the entire canvas
      ctx.clearRect(0, 0, ref.current.width, ref.current.height);
    }
  };

  const getScaledPos = (canvasDom: HTMLCanvasElement | null, clientX: number, clientY: number) => {
    if (!canvasDom) {
      return { offsetX: 0, offsetY: 0 };
    }
    const rect = canvasDom.getBoundingClientRect();
    const scaleX = canvasDom.width / rect.width;   // scale factor for X
    const scaleY = canvasDom.height / rect.height; // scale factor for Y

    return {
      offsetX: (clientX - rect.left) * scaleX,
      offsetY: (clientY - rect.top) * scaleY
    };
  };

  const getTouchPos = (canvasDom: HTMLCanvasElement | null, touchX: number, touchY: number) => {
    if (!canvasDom) {
      return { offsetX: 0, offsetY: 0 };
    }
    const rect = canvasDom.getBoundingClientRect();
    const scaleX = canvasDom.width / rect.width;   // scale factor for X
    const scaleY = canvasDom.height / rect.height; // scale factor for Y

    return {
      offsetX: (touchX - rect.left) * scaleX,
      offsetY: (touchY - rect.top) * scaleY
    };
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
    const { clientX, clientY } = event;
    const { offsetX, offsetY } = getScaledPos(ref.current, clientX, clientY);
    handleStart(offsetX, offsetY);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = event;
    const { offsetX, offsetY } = getScaledPos(ref.current, clientX, clientY);
    handleMove(offsetX, offsetY);
  };

  const handleCanvasMouseUp = () => {
    handleEnd();
  };

  const handleCanvasTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    const { offsetX, offsetY } = getTouchPos(ref.current, touch.clientX, touch.clientY);
    handleStart(offsetX, offsetY);
  };

  const handleCanvasTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    const { offsetX, offsetY } = getTouchPos(ref.current, touch.clientX, touch.clientY);
    handleMove(offsetX, offsetY);
  };

  const handleCanvasTouchEnd = () => {
    handleEnd();
  };

  const drawLine = () => {
    if (!ref.current) return;
    const ctx = ref.current.getContext('2d');
    if (!ctx || polygonPoints.length < 1) return;

    // ctx.clearRect(0, 0, ref.current.width, ref.current.height);
    // apply stroke
    ctx.beginPath();
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    polygonPoints.forEach((point, index) => {
      if (index > 0) {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  };

  const closePolygonAndProcess = async () => {
    if (!ref.current || !originalImageData) return;

    const ctx = ref.current.getContext('2d') as CanvasRenderingContext2D;

    // remove the drawn line
    ctx.clearRect(0, 0, ref.current.width, ref.current.height);

    const path = new Path2D();
    polygonPoints.forEach((point, index) => {
      if (index === 0) {
        path.moveTo(point.x, point.y);
      } else {
        path.lineTo(point.x, point.y);
      }
    });
    path.closePath();

    ctx.clip(path);

    // Draw the image inside the polygon
    // ctx.putImageData(originalImageData, 0, 0); // @note: does not respect clip

    if (ctx) {
      // Create a temporary canvas
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');

      // Set the temporary canvas size to the original image data dimensions
      tempCanvas.width = originalImageData.width;
      tempCanvas.height = originalImageData.height;

      // Draw the original image data on the temporary canvas
      if (tempCtx) {
        tempCtx.putImageData(originalImageData, 0, 0);
      }

      // Scale and draw the image from the temporary canvas to the main canvas
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, ref.current.width, ref.current.height);
    }

    // const screenshot = ref.current;
    // ctx.drawImage(screenshot, 0, 0, ref.current.width, ref.current.height);

    // Reset the polygon points
    setPolygonPoints([]);
    setIsClipped(true);
  };

  return (
    <canvas
      // key={key}
      // id={id}
      className={isClipped ? 'pointer-events-none touch-none' : ' pointer-events-auto touch-none'}
      ref={ref}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onTouchStart={handleCanvasTouchStart}
      onTouchMove={handleCanvasTouchMove}
      onTouchEnd={handleCanvasTouchEnd}
      {...divCanvasProps}
    ></canvas>
  );
}
