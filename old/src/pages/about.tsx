import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Aboutsub, Vision, Facilities, Anthem } from "./subs/aboutsub"
import { motion } from 'framer-motion';

const About = () => {
  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] min-h-full overflow-clip"
    >
      <Tabs defaultValue="about" className="flex flex-col lg:flex-row gap-[60px] mt-5">
          <TabsList className="flex flex-row lg:flex-col w-full max-w-[380px] lg:max-w-[280px] xl:max-w-[340px] max-h-[240px] mx-auto xl:mx-0 gap-6 ">
            <TabsTrigger value="about" className='rounded-full flex-1'>About</TabsTrigger>
            <TabsTrigger value="vision" className='rounded-full flex-1'>Vision</TabsTrigger>
            <TabsTrigger value="facilities" className='rounded-full flex-1'>Facilities</TabsTrigger>
            <TabsTrigger value="anthem" className='rounded-full flex-1'>Anthem</TabsTrigger>
          </TabsList>
            <div className="min-h-[70vh] w-full">


              <TabsContent value="about" className="w-full">
                <Aboutsub />
              </TabsContent>
              <TabsContent value="vision" className="w-full">
                <Vision />
              </TabsContent>
              <TabsContent value="facilities" className="w-full">
                <Facilities />
              </TabsContent>
              <TabsContent value="anthem" className="w-full text-center xl:text-center">
                <Anthem />
              </TabsContent>
            </div>
        </Tabs>
    </motion.section>
  )
}

export default About
