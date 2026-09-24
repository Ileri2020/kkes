import React from 'react'
import materials from "@/data/materials"
import { motion } from "framer-motion"
import { Button } from '@/components/ui/button';
import { BiDownload } from 'react-icons/bi';

const Study = () => {
  return (
    <motion.section
      initial = {{ opacity: 0 }}
        animate = {{
          opacity : 1,
          transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
        }}
        className="w-[100vw] min-h-full overflow-clip"
    >
      <div className='flex flex-col gap-3 max-w-4xl mx-auto'>
        {materials.materials.map((item, index)=>{
            return(
                <div className='mx-2 bg-secondary rounded-sm px-2 hover:border-accent hover:border-2 hover:bg-secondary/60'>
                    <div className='font-bold'>{item.name}</div>
                    <div className='text-xl font-bold'>{item.course}</div>
                    <div className='flex flex-row justify-end items-center w-full text-sm text-end gap-5 pb-1'>
                      <div className='text-sm text-end'>{item.type}</div>
                      <Button className='text-xl rounded-full'><BiDownload /></Button>
                    </div>
                </div>
            )
        })}
      </div>
    </motion.section>
  )
}

export default Study
