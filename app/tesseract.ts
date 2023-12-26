import { createWorker } from 'tesseract.js';

// working tesseract image: 'https://tesseract.projectnaptha.com/img/eng_bw.png' 

export async function extractTextFromCanvas(canvasId: string) {
  console.log('extractTextFromCanvas', canvasId);
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;

  // Convert canvas to image file
  const dataURL = canvas.toDataURL();
  const blob = await fetch(dataURL).then((res) => res.blob());
  const objectURL = URL.createObjectURL(blob);

  const image = new Image();
  image.src = objectURL;

  // Initialize Tesseract.js worker
  const worker = await createWorker('eng');

  // Perform OCR on the image
  // const { data: { text } } = await worker.recognize(image);
  const { data: { text } } = await worker.recognize('/recipe.png' );
  console.log('text', text);

  // Terminate the worker and revoke the Object URL
  await worker.terminate();
  URL.revokeObjectURL(objectURL);

  return text;
}

export function download(canvasId: string) {
  var link = document.createElement('a');
  link.download = 'filename.png';

  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  link.href = canvas.toDataURL();

  link.click();
}


