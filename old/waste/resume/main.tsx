import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './../index.css'
import { BrowserRouter } from "react-router-dom"
import Navbar from '@/components/utility/navbar.tsx';
import {ThemeProvider} from "@/components/ui/theme-provider.tsx"


ReactDOM.createRoot(document.getElementById('root')!).render(
  <div className='bg-background text-foreground'>
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Navbar />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  </div>
  
)
