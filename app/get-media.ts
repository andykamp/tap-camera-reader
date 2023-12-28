const constraints = {
  audio: false,
  video: true
}
function handleSuccess(stream: MediaStream) {
  const video = document.querySelector('video');
  if (!video) {
    throw new Error('Video not found');
  }
  const videoTracks = stream.getVideoTracks();
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  video.srcObject = stream;
}

function handleError(error:any) {
  console.log(error)
  if (error.name === 'OverconstrainedError') {
    return `The resolution is not supported by your device.`
  } else if (error.name === 'NotAllowedError') {
    return 'Permissions have not been granted to use your camera and ' +
      'microphone, you need to allow the page access to your devices in ' +
      'order for the demo to work.'
  }
  return `getUserMedia error: ${error.name}`
}

async function init() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return handleSuccess(stream);
  } catch (e) {
    return handleError(e);
  }
}
