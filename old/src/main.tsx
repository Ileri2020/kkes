import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from "react-router-dom"
import Navbar from './components/utility/navbar.tsx';
import {ThemeProvider} from "./components/ui/theme-provider.tsx"
import PageTransition from './components/utility/pageTransition.tsx'
import { Provider } from 'react-redux';
import store from "./store" ;



ReactDOM.createRoot(document.getElementById('root')!).render(
  <div className='text-foreground'>
    <React.StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            {/* <Navbar /> */}
            <App />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
      
    </React.StrictMode>
  </div>
  
)
