"use client"

import {useState, useEffect} from 'react'
import { motion } from 'framer-motion'

const Textview = (props : {textList : string[], textStyle : string}) => {
    const [index, setIndex]=useState(0)
    //const [items, setItem]=useState(["Empowering Africa Through STEM", "Creating Africas Scientific Future", "Sparking Innovation in Young Minds", "Fueling Discovery and Driving Progress", "Igniting Imaginations and Shaping the Future", "Where Science Meets Oportunity"])
    const [items, setItem]=useState(props.textList)
    useEffect(()=>{
        const interval = setInterval(()=>{
            setIndex((prevIndex)=>(prevIndex+1)%items.length)
        },4000)
        return()=>clearInterval(interval)
    },[items])
    
    const Temp =()=>{
        return(
            <motion.div 
                //className='text-xl md:text-2xl font-bold font-roboto /text-outline text-foreground/80 dark:text-white w-[100vw] md:w-[500px] text-center /font-dance flex items-center justify-center text-wrap my-auto /left-[70%] /top-[30%] /absolute'
                className = {props.textStyle}
                initial = {{ scale: 0, opacity: 0 }}
                animate = {{
                    scale : 1,
                    opacity: 1,
                    transition : { delay: 0.2, duration: 1.2, ease: "easeIn"}
                }}
                exit={{ opacity: 0 }}
            >
                {items[index]}
            </motion.div>
        )
    }
   
  return (
    <div className='w-[100vw] /h-[200px] md:w-[40vw] /m-10 rounded-lg text-center my-5 /-translate-x-72'>
        <div className='/relative w-full flex rounded-lg px-2 /py-50 /px-[50px] justify-center'>
            <Temp />
        </div>
    </div>
  )
}

export default Textview
