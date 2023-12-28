"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/spinner';
import CroppableCanvas from '@/components/croppable-canvas';
import { AiImageToText } from '@/lib/image-to-text.utils';

const constraints = {
  audio: false,
  video: {
    facingMode: "environment" // Use the rear camera
  }
};

const SCREENSHOT_CANVAS_ID = 'screenshot-canvas';

type ScreenshotProps = {
  remount: () => void;
}

export default function Screenshot(props: ScreenshotProps) {
  const { remount } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [error, setError] = useState<string>();
  const [isRecording, setIsRecording] = useState(false);
  const [screenshotTaken, setScreenshotTaken] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const init = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      startCamera(stream);
    } catch (e) {
      handleError(e);
    }
  }

  const handleError = (e: any) => {
    console.error(e)
    let error: string;
    if (e.name === 'OverconstrainedError') {
      error = `The resolution is not supported by your device.`
    } else if (e.name === 'NotAllowedError') {
      error = 'Permissions have not been granted to use your camera and ' +
        'microphone, you need to allow the page access to your devices in ' +
        'order for the demo to work.'
    }
    error = `getUserMedia error: ${e.name}`
    setError(error);
  }

  const startCamera = async (stream: MediaStream) => {
    console.log('starting camera',);
    setIsRecording(true);
    if (!videoRef.current) {
      setError('Video ref not found');
      return
    }
    videoRef.current.srcObject = stream;
    videoRef.current.controls = false;

    // Wait for the video to start playing
    await new Promise((resolve) => {
      if (!videoRef.current) return;
      videoRef.current.addEventListener('playing', resolve);
    });
    console.log('loaded');

    if (!canvasRef.current) {
      setError('Canvas ref not found');
      return
    }
    // Set the canvas size to match the video dimensions
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

  };

  const stopCamera = () => {
    if (!videoRef.current) return;
    const stream = videoRef.current.srcObject as MediaStream;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      // videoRef.current.srcObject = null;
    }
    setIsRecording(true);
  };

  const takePicture = () => {
    if (!videoRef.current) {
      setError('Video ref not found');
      return
    }

    if (!canvasRef.current) {
      setError('Canvas ref not found');
      return
    }

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    const screenshot = videoRef.current
    context.drawImage(screenshot, 0, 0, canvasRef.current.width, canvasRef.current.height);
    setScreenshotTaken(true);
    stopCamera();
  };

  const imageToText = async () => {
    setText(null)
    setIsTranslating(true)
    // const { data: { text } } = await extractTextFromCanvas(DRAWING_CANVAS_ID)
    // console.log('text', text);
    const canvas = document.getElementById(SCREENSHOT_CANVAS_ID) as HTMLCanvasElement;
    const imageUrl = canvas.toDataURL();

    try {
      const text = await AiImageToText(imageUrl);
      console.log('TEXT', text);
      setText(text)
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setIsTranslating(false)
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <div className="w-full flex flex-col justify-start items-center">
      {!isRecording &&
        <LoadingSpinner />
      }
      {error &&
        <div
          className="text-red-500"
        >
          {error}
        </div>
      }

      <div className="flex flex-row gap-1 overflow-y-hidden">
        <Button onClick={remount}>Reset</Button>
        <Button onClick={takePicture}>Take Picture</Button>
        <Button onClick={imageToText}>ImgToText</Button>
      </div>

      <div className="w-full break-words flex justify-start items-center">
        {isTranslating &&
          <div>translating..</div>
        }
        {text &&
          <pre className="w-full overflow-scroll">{text}</pre>
        }
      </div>
      <div className="flex justify-start items-center">
        <div className="relative ">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: 'auto' }}
          ></video>

          <div className="absolute top-0 left-0">
            <CroppableCanvas
              screenshotTaken={screenshotTaken}
              id={SCREENSHOT_CANVAS_ID}
              reff={canvasRef}
              style={{ width: '100%', height: 'auto' }}
            ></CroppableCanvas>
          </div>

        </div>
      </div>

    </div>
  );
}
