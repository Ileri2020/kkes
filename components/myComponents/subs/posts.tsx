import React from 'react'
import Post from './post'
import posts from "@/data/post"
import {motion} from "framer-motion"

const Posts = () => {
  return (
    <section
      className="w-[100%] min-h-full overflow-clip"
    >
      <div className='w-fit mx-auto'>
        {posts.post.map((post, index)=>{
        return(
            <Post key={`${post.owner}-${post.time}-${index}`} img={post.img} time={post.time} owner={post.owner} event={post.event} post={post.post} />
        )
        })}
      </div>
    </section>
  )
}

export default Posts
