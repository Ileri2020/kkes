import React from 'react'
import { Community, Event, Posts } from './subs'
import posts from "../data/post"
import {motion} from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

const Blog = () => {
  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] min-h-full overflow-clip"
    >
      <Tabs defaultValue="posts" className="flex flex-col lg:flex-row gap-[60px] mt-5">
          <TabsList className="flex flex-row lg:flex-col w-full max-w-[380px] lg:w-[280px] xl:w-[340px] max-h-[180px] mx-auto xl:mx-0 gap-6 ">
            <TabsTrigger value="posts" className='rounded-full flex-1'>Blogs</TabsTrigger>
            <TabsTrigger value="event" className='rounded-full flex-1'>Events</TabsTrigger>
            <TabsTrigger value="news" className='rounded-full flex-1'>News</TabsTrigger>
          </TabsList>
            <ScrollArea className="h-[80vh] w-fit mx-auto">
              <TabsContent value="posts" className="w-full">
                <Posts />
              </TabsContent>
              <TabsContent value="event" className="w-full">
                <Event />
              </TabsContent>
              <TabsContent value="news" className="w-full">
                news
              </TabsContent>
            </ScrollArea>
        </Tabs>
    </motion.section>
  )
}

export default Blog
