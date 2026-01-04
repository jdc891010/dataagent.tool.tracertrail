import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { DataInitializer } from "@/components/DataInitializer"

function App() {
  return (
    <>
      <DataInitializer />
      <Pages />
      <Toaster />
      <SonnerToaster />
    </>
  )
}

export default App 