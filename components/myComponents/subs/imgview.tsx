"use client"

import {useState, useEffect} from 'react'
import { motion } from 'framer-motion'
import type { StaticImageData } from 'next/image'

const Imgview = (props : {imgList : (string | StaticImageData)[], imgStyle : string}) => {
    const [index, setIndex]=useState(0)
    //const [items, setItem]=useState(["Empowering Africa Through STEM", "Creating Africas Scientific Future", "Sparking Innovation in Young Minds", "Fueling Discovery and Driving Progress", "Igniting Imaginations and Shaping the Future", "Where Science Meets Oportunity"])
    const [items, setItem]=useState(props.imgList)
    useEffect(()=>{
        const interval = setInterval(()=>{
            setIndex((prevIndex)=>(prevIndex+1)%items.length)
        },4000)
        return()=>clearInterval(interval)
    },[items])

    const Temp = ()=>{
        return(
            <motion.div 
                //className='text-xl md:text-2xl font-bold font-roboto /text-outline text-foreground/80 dark:text-white w-[100vw] md:w-[500px] text-center /font-dance flex items-center justify-center text-wrap my-auto /left-[70%] /top-[30%] /absolute'
                className = {props.imgStyle}
                initial = {{ opacity: 0 }}
                animate = {{
                    opacity : 1,
                    transition : { delay: 0.5, duration: 0.9, ease: "easeInOut"}
                }}
            >
                <img src={typeof items[index] === "string" ? items[index] : items[index].src} alt="" className='h-full mt-10'/>
            </motion.div>
        )
    }
    

  return (
    <div className='w-[100vw] /h-[200px] md:w-[40vw] /m-10 rounded-lg text-center my-5 /-translate-x-72'>
       <Temp /> 
    </div>
  )
}

export default Imgview
