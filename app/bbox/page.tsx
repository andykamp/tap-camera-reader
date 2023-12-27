"use client";

import React, { useRef, useState } from 'react';
import { extractTextFromCanvas, extractBBoxFromCanvas } from '../tesseract';

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

const VIDEO_CANVAS_ID = 'video-canvas';
const VIDEO_DRAWING_CANVAS_ID = 'video-drawing-canvas';

export default function ImageDrawer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasVideoRef = useRef<HTMLCanvasElement>(null);
  const recordVideo = useRef(true);

  const [videoDimensions, setVideoDimensions] = useState(DEFAULT_VIDEO_DIMENSIONS);
  const [text, setText] = useState<string>();

  const startCamera = async () => {
    if (!videoRef.current || !canvasVideoRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoRef.current.srcObject = stream;
    videoRef.current.controls = false;

    // Wait for the video to start playing
    await new Promise((resolve) => {
      if (!videoRef.current) return;
      videoRef.current.addEventListener('playing', resolve);
    });
    console.log('loaded');

    // Create a canvas to draw video frames
    const canvasContext = canvasVideoRef.current.getContext('2d');
    if (!canvasContext) return;


    // Define a function to capture frames
    const captureFrame = async () => {
      if (!videoRef.current || !canvasContext) return;

      // Draw the current video frame on the canvas
      canvasContext.drawImage(
        videoRef.current,
        0,
        0,
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );

      // Do something with the current frame, e.g., extract text
      const res = await extractTextFromCanvas(VIDEO_CANVAS_ID);
      const { data: { text } } = res
      setText(text)
      extractBBoxFromCanvas(VIDEO_DRAWING_CANVAS_ID, res);
      // Introduce a small delay (e.g., 10 milliseconds) to ensure drawing completion
      await new Promise(resolve => setTimeout(resolve, 10));

      // Continue capturing frames
      if (recordVideo.current) {
        requestAnimationFrame(captureFrame);
      }
    };

    // Start capturing frames after a delay (e.g., 1 second)
    setTimeout(() => {
      requestAnimationFrame(captureFrame);
    }, 1000);
  };

  const stopCamera = () => {
    recordVideo.current = false;
    if (!videoRef.current) return;
    const stream = videoRef.current.srcObject as MediaStream;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div>
      <div className="flex flex-row gap-1 overflow-y-hidden">
        <button onClick={startCamera}>Start Camera</button>
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
          playsInline
          width={videoDimensions.width}
          height={videoDimensions.height}
        ></video>
        <div className="relative">
          <canvas
            id={VIDEO_CANVAS_ID}
            ref={canvasVideoRef}
            width={videoDimensions.width}
            height={videoDimensions.height}
          ></canvas>
          <div className="absolute top-0 left-0">
            <canvas
              id={VIDEO_DRAWING_CANVAS_ID}
              width={videoDimensions.width}
              height={videoDimensions.height}
            ></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
