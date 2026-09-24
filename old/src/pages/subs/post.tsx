import React from 'react'
import { BiLike, BiComment, BiDownload } from 'react-icons/bi'
import placeholder from "../../assets/placeholderMale.jpg"

import { Button } from '@/components/ui/button'

type post = {
    img: string,
    post: string,
    time: string,
    owner: string,
    event: string,
}

const Post = (props:post) => {
  return (
    <div className='mt-10 rounded-sm w-[100vw] overflow-clip max-w-lg'>
      {/* {<div>
        <img src={props.owner} alt="" />
      </div>} */}
      <div className='w-full'>
        <div className='w-full flex flex-row'>
          <img src={placeholder} alt="" className='w-10 h-10 rounded-full m-1'/>
          <div className='flex flex-row w-full'>
            <div className=' flex-1 text-xl font-semibold px-3'>Posters name</div>
            <div className='text-sm w-14'>{props.time}</div>
          </div>
        </div>
        <div className='w-full'>
            <img src={props.img} alt="" className='w-full rounded-sm' />
        </div>
        <div className="w-full bg-secondary pb-2">
          <div className='w-full flex flex-col px-2'>
              <div className='w-full'>{props.post}</div>
              <div className='w-full text-end'>{props.time}</div>
          </div>
          <div className='w-full flex flex-row gap-2 px-2 mt-1'>
            <Button  className='flex-1 text-2xl'><BiLike /></Button>
            <Button  className='flex-1 text-2xl'><BiComment /></Button>
            <Button variant={"outline"} className='bg-transparent flex-1 text-2xl text-accent'><BiDownload /></Button>
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default Post
