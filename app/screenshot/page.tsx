"use client";

import { useState } from 'react';
import Screenshot from '@/components/screenshot';

export default function Page() {
  const [remountKey, setRemountKey] = useState(0);
  const remount = () => setRemountKey((prev) => prev + 1)

  return (
    <main className="container min-h-screen min-w-screen">
      <Screenshot key={remountKey} remount={remount} />
    </main>
  )
}
