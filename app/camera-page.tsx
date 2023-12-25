"use client";

import { useRef, useState } from 'react';
import useMediaDeviceInfo from './camera-info';

export default function CameraPage() {
  const [info, _loading] = useMediaDeviceInfo();
  const [_screenshot, setScreenshot] = useState();
  console.log('useMediaDeviceInfo',info );
  const videoRef = useRef<any>();
  const canvasRef = useRef<any>();

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const takePicture = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    // You can save the image from here
    // Using toDataURL to get a Base64 encoded string
    const imageDataUrl = canvasRef.current.toDataURL('image/png');
    setScreenshot(imageDataUrl);
  };

  return (
    <div>
      <video ref={videoRef} autoPlay></video>
      <button onClick={startCamera}>Start Camera</button>
      <button onClick={takePicture}>Take Picture</button>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

