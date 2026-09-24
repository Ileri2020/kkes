import React from 'react'
import Textview from "./textsview"
import Imgview from './imgview'
import Social from "../../components/utility/social"

const Landing = () => {
  const textList = ["Empowering Africa Through STEM", "Creating Africas Scientific Future", "Sparking Innovation in Young Minds", "Fueling Discovery and Driving Progress", "Igniting Imaginations and Shaping the Future", "Where Science Meets Oportunity"]
  const textStyle = 'text-xl md:text-2xl font-bold font-roboto /text-outline text-foreground/80 dark:text-white w-[100vw] md:w-[500px] text-center /font-dance flex items-center justify-center text-wrap my-auto /left-[70%] /top-[30%] /absolute'
  const imguris = ["/legacy/assets/bannerboy.png", "/legacy/assets/bannergirl.png"]
  return (
    <div className='w-full h-[90vh] overflow-clip flex justify-center z-10'>
        <div className='flex flex-col md:flex-row'>
            <div className='flex-1 flex flex-col justify-between items-center mt-[5%] /md:mt-[12%]'>
              <div className='flex flex-col items-center'>
                <div className='leaf-bg bg-accent-secondary -translate-x-2 translate-y-1 m-5'>
                  <div className='leaf-bg bg-accent-tertiary translate-x-2 translate-y-1'>
                    <div className='leaf-bg bg-accent dark:bg-accent/95 px-10 md:px-14 py-2 translate-x-2 translate-y-1  text-accent-secondary font-roboto_mono text-center font-extrabold'>
                      <div className=' text-3xl lg:text-4xl'>Kith and Kin </div>
                      <div className='text-white text-2xl'>International College</div>
                    </div>
                  </div>
                </div>
                {/*
                  <div className="grad-trans bg-blur px-4 py-2 rounded-sm text-4xl font-extrabold text-center text-accent/40 text-outline font-roboto_mono">Kith and Kin International College</div>
                */} 
                <Textview textList={textList} textStyle={textStyle} />
              </div>
               {/* 
               <div className='leaf-bg bg-accent-secondary px-10 py-2'>
                  <div className='leaf-bg bg-accent-tertiary px-10 py-2'>
                    <div className='leaf-bg bg-accent px-10 py-2'>star lands ball bag cook shop</div>
                  </div>
                </div>
                <div className='leaf-bg bg-accent-secondary translate-x-4 m-5'>
                  <div className='leaf-bg bg-accent-tertiary translate-x-4'>
                    <div className='leaf-bg bg-accent px-10 py-2 translate-x-4'>star lands ball bag cook shop</div>
                  </div>
                </div>
                <div className='leaf-bg bg-accent-secondary -translate-x-4 translate-y-1 m-5'>
                  <div className='leaf-bg bg-accent-tertiary translate-x-4 translate-y-1'>
                    <div className='leaf-bg bg-accent px-10 py-2 translate-x-4 translate-y-1'>star lands ball bag cook shop</div>
                  </div>
                </div>

                <div className='flex md:hidden w-[100vw] h-[100vw] justify-center items-center rounded-[25%] overflow-clip'>
                  <img src={imguris[0]} alt="" className='/mx-auto h-full mt-10' />
                </div>
               */}
                
                
                <Imgview imgList={imguris} imgStyle='flex md:hidden w-[100vw] h-[100vw] justify-center items-center rounded-[25%] overflow-clip' />
                <Social containerStyles='flex flex-row gap-3 mb-16 md:mb-40 /mt-72 /lg:mt-20' iconStyles='text-4xl text-accent/80' />
            </div>
            <div className='contain-content hidden md:flex'>
                <img src={imguris[0]} alt="" className='h-[520px] -z-10' />
            </div>

        </div>
    </div>
  )
}

export default Landing
