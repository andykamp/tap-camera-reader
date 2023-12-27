import { createWorker } from 'tesseract.js';

// working tesseract image: 'https://tesseract.projectnaptha.com/img/eng_bw.png' 

export async function detect(canvasId: string) {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  const worker = await createWorker('eng', 1, { legacyCore: true, legacyLang: true });
  const { data } = await worker.detect(canvas);
  console.log(data);
}

export async function extractTextFromCanvas(canvasId: string) {
  console.log('extractTextFromCanvas', canvasId);
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  console.log('canvas', canvas, typeof canvas);
  if (!canvas) {
    throw new Error('Canvas not found');
  }

  // Convert canvas to image file
  // const dataURL = canvas.toDataURL();
  // const blob = await fetch(dataURL).then((res) => res.blob());
  // const objectURL = URL.createObjectURL(blob);

  // const image = new Image();
  // image.src = objectURL;

  // Initialize Tesseract.js worker
  const worker = await createWorker('eng');

  // Perform OCR on the image
  const res = await worker.recognize(canvas);
  console.log('recognizeResult', res);
  // Terminate the worker and revoke the Object URL
  await worker.terminate();
  // URL.revokeObjectURL(objectURL);

  return res;
}

export function download(canvasId: string) {
  var link = document.createElement('a');
  link.download = 'filename.png';

  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  link.href = canvas.toDataURL();

  link.click();
}

export async function extractBBoxFromCanvas(
  canvasId: string,
  res: Tesseract.RecognizeResult
) {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;

  const { lines, blocks } = res.data;

  // Display the bounding boxes on the canvas
  const context = canvas.getContext('2d');
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = 2;
    // draw blocks
    context.strokeStyle = 'yellow';
    if (blocks) {
      blocks.forEach((block) => {
        context.strokeStyle = 'red';
        drawBbox(context, block.baseline);
        drawBbox(context, block.bbox);
      })
    }

    // draw lines
    lines.forEach((line) => {
      context.strokeStyle = 'red';
      // drawBbox(context, line.baseline);
      // drawBbox(context, line.bbox);

      context.strokeStyle = 'green';
      line.words.forEach((w) => {
        // drawBbox(context, w.baseline);
        // drawBbox(context, w.bbox);
        context.strokeStyle = 'pink';
        w.symbols.forEach((s) => {
          drawBbox(context, s.baseline);
          drawBbox(context, s.bbox);
        })
      })
    })
  }
}

type Bbox = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function drawBbox(
  context: CanvasRenderingContext2D,
  bbox: Bbox,
) {
  const { x0, y0, x1, y1 } = bbox;
  context.beginPath();
  context.rect(x0, y0, x1 - x0, y1 - y0);
  context.stroke();
}


