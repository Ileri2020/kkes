import { useState, lazy, Suspense } from 'react'
import './App.css'
import { Route, Routes, Link, Outlet } from 'react-router-dom';

import Home from './pages/home.tsx';
import Notfound from './pages/notfound.tsx'
import Navbar from './components/utility/navbar.tsx';
import { useSelector } from 'react-redux';
const Account = lazy(()=>import('./pages/account.tsx') )  
const Admin = lazy(()=>import('./pages/admin.tsx')) 
const Contact = lazy(()=>import('./pages/contact.tsx'))
const Blog = lazy(()=>import('./pages/blog.tsx')) 
const Event = lazy(()=>import('./pages/subs/event.tsx')) 
const Study = lazy(()=>import('./pages/study.tsx')) 
const About = lazy(()=>import('./pages/about.tsx')) 
const Result = lazy(()=>import('./pages/result.tsx')) 
const Chat = lazy(()=>import('./pages/chat.tsx')) 
const Community = lazy(()=>import('./pages/subs/community.tsx')) 


function App() {
  //const isLoggedIn = useSelector((state : typeof store) => state.auth.isLoggedIn)
  //const cart = useSelector((state : typeof store) => state.cart.itemsList)
  //console.log(cart)
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path="/" element={<Navbar/>} >
        <Route path="/" element={<Home/>} />
        <Route path="/contact" element={<Contact/>} />
        <Route path="/about" element={<About/>} />
        <Route path="/account" element={<Account/>} />
        <Route path="/admin" element={<Admin/>} />
        <Route path="/blog" element={<Blog/>} />
        <Route path="/event" element={<Event/>} />
        <Route path="/study" element={<Study/>} />
        <Route path="/result" element={<Result/>} />
        <Route path="/chat" element={<Chat/>} />
        <Route path="/community" element={<Community/>} />
        <Route path="*" element={<Notfound/>} />
      </Route>
    </Routes>
  )
}

export default App
