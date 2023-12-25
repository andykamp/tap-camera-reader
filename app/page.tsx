import Image from 'next/image'
import CameraPage from './camera-page'
import ImageDrawer from './image-drawer'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <ImageDrawer/>


    </main>
  )
}
