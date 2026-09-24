import { useState } from 'react'
import './App.css'
import { Route, Routes, Link } from "react-router-dom"

import Portfolio from '@/pages/portfolio.tsx'
import Resume from '@/pages/resume.tsx'
import Notfound from '@/pages/notfound.tsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path="/" element={<Resume/>}/>
      <Route path="/contact" />
      <Route path="/about" />
      <Route path="/blogs" />
      <Route path="/portfolio" />
      <Route path="/resume" element={<Resume/>} />
      <Route path="/services" />
      <Route path="*" element={<Notfound/>} />
      <Route path="cv" />
    </Routes>
  )
}

export default App
