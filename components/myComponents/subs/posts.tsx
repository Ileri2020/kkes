import React from 'react'
import Post from './post'
import posts from "@/data/post"
import {motion} from "framer-motion"

const Posts = () => {
  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100%] min-h-full overflow-clip"
    >
      <div className='w-fit mx-auto'>
        {posts.post.map((post, index)=>{
        return(
            <Post img={post.img} time={post.time} owner={post.owner} event={post.event} post={post.post} />
        )
        })}
      </div>
    </motion.section>
  )
}

export default Posts
