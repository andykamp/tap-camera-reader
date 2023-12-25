import { useEffect, useState } from 'react';

export default function useMediaDeviceInfo() {
  const [info, setInfo] = useState<MediaDeviceInfo[]>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      console.log('enumerateDevices()', navigator.mediaDevices.enumerateDevices());
      const devices = await navigator.mediaDevices.enumerateDevices();
      setInfo(devices);
      setLoading(false);
    })();

  }, []);

  return [info, loading]
}

