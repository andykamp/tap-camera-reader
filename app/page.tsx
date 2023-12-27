"use client";

import Image from 'next/image'
import CameraPage from './camera-page'
import ImageDrawer from './image-drawer'
import { useState } from 'react';

export default function Home() {
  const [remountKey, setRemountKey] = useState(0);
  const remount = () => setRemountKey((prev) => prev + 1)
  return (
    <main className="overflow-hidden flex min-h-screen min-w-screen flex-col items-center justify-between">
      <ImageDrawer key={remountKey} remount={remount}/>


    </main>
  )
}
