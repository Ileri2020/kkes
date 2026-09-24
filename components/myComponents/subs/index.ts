import  { lazy } from "react"

export const Advert = lazy(()=>import('./advert')) 
export const Dashboard = lazy(()=>import("./dashboard")) 
export const Filters = lazy(()=>import("./filters")) 
export const Gallery = lazy(()=>import("./gallery")) 
export const Item = lazy(()=>import("./item")) 
export const Login = lazy(()=>import("./login")) 
export const Search = lazy(()=>import("./search")) 
export const Signup = lazy(()=>import("./signup")) 
export const Stocks = lazy(()=>import("./stocks")) 
export const Footer = lazy(()=>import("./footer")) 
export const Landing = lazy(()=>import("./landing")) 
export const Textview = lazy(()=>import("./textsview")) 
export const Post = lazy(()=>import("./post")) 
export const Posts = lazy(()=>import("./posts")) 
export const Event = lazy(()=>import("./event")) 
export const Community = lazy(()=>import('./community'))
export { GlobalSearch } from './GlobalSearch'
export { SpecialOrderForm } from './SpecialOrderForm'