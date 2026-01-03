import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { DataInitializer } from "@/components/DataInitializer"

function App() {
  return (
    <>
      <DataInitializer />
      <Pages />
      <Toaster />
    </>
  )
}

export default App 