import { useState } from 'react'
import './App.css'
import { Route, Routes, Link } from "react-router-dom"

import Portfolio from '@/pages/portfolio.tsx'
import Notfound from '@/pages/notfound.tsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
        <Route path="/" element={<Portfolio/>} />
        <Route path="/portfolio" element={<Portfolio/>} />
        
        {/* 
        <Route path="*" element={<Notfound/>} />
        <Route path="/contact" />
        <Route path="/about" />
        <Route path="/blogs" />
        <Route path="/resume" />
        <Route path="/services" />
        <Route path="cv" />
        */}
    </Routes>
  )
}

export default App
