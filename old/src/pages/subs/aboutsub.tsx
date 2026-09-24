import React from 'react'
import { motion } from 'framer-motion'
import facilities from "../../data/facilities"
import { ScrollArea } from '@/components/ui/scroll-area'



export const Aboutsub = () => {
  return (
    <motion.div
        initial = {{ opacity: 0 }}
        animate = {{
            opacity : 1,
            transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
        }}
        className='px-2'
    >
        <div className='text-center text-3xl' >About <span className='text-accent'>us</span></div>
        <div   className='flex flex-col gap-5'>
            <p>&emsp;Founded in September, 15 2001, Kith and Kin International College is a co-educational, boarding/day school located in a coastal and serene environment of Owode-Ibeshe, a suburb of Ikorodu in Lagos State. Ibeshe is accessible by good road networks from Ikorodu and by waters. Since its inception the school has enrolled students within and beyond Ikorodu environment as well as from overseas. The competitive pricing of the school services has made it a choice of parents from outside the Ikorodu community.</p>
            <p>&emsp;The philosophy of the school is that every child has value to add to the society as we identify the unique strength of every student and support the child to excel in this area of strength. This is reflected in the logo (palm tree) and motto of the school “Be Resourceful”. The palm tree has about 65 products that can be derived from it; hence it is a very useful tree.</p>
            <p>&emsp;Our pedagogy at Kith & Kin International College is focused on using the best practices such as: experiential learning, collaborative learning, project work and critical thinking to unleash the potential of each child.</p>
            <p>&emsp;Kith & Kin International College students are exposed to array of opportunities and stimulating learning environment that prompt them to develop interest in areas of interest that can be nurtured to self-fulfillment.</p>
        </div>
    </motion.div>
  )
}



export const Vision = () => {
  return (
    <motion.div
        initial = {{ opacity: 0 }}
        animate = {{
            opacity : 1,
            transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
        }}
        className='px-2 flex flex-col gap-10'
    >
        <div>
            <div className='text-3xl'>Our <span className='text-accent'>Vision</span></div>
            <div>
              To be the best provider of quality and comprehensive foundation education that can lead our children to leadership positions in the emerging global economy.
            </div>
        </div>
        <div>
            <div className='text-3xl'>Our <span className='text-accent'>Mission</span></div>
            <div>
              To inspire critical thinking and unleash the talent of every KKES student through balanced array of opportunities and stimulating academics environment and well trained and motivated members of staff as KKES prepares them to succeed in an increasingly complex, competitive and technology driven global economy.
            </div>
        </div>
        <div>
            <div className='text-3xl'>Our <span className='text-accent'>Values</span></div>
            <div>
              To impact exceptional values in our students thereby creating satisfaction for our parents. It is our goal to also promotes a fulfilling careers for our staff.
            </div>
        </div>
    </motion.div>
  )
}


export const Facilities = () => {
    return (
      <motion.div
        initial = {{ opacity: 0 }}
        animate = {{
            opacity : 1,
            transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
        }}
        className='flex flex-col flex-1 max-w-xl mx-auto'
      >
        <ScrollArea className='flex /flex-1 flex-col w-full h-[80vh] /contain-size'>
          {facilities.facilities.map((facility, index)=>{
            return(
                <div className='w-full mb-10' key= {index}>
                  <div className='p-2 text-xl text-accent font-semibold'>{facility.name}</div>
                  <div><img src={facility.img} alt="" className='w-full rounded-sm' /></div>
                  <div className='bg-secondary pb-2'>
                    <div className='mx-2'>{facility.description}</div>
                  </div>
                </div>
            )
          })}
        </ScrollArea>
      </motion.div>
    )
  }


  export const Anthem = () => {
    return (
      <motion.div
        initial = {{ opacity: 0 }}
        animate = {{
            opacity : 1,
            transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
        }}
        className='flex flex-col gap-5 text-center'
      >
        <div className='text-3xl font-semibold'>Our <span className='text-accent'>Anthems</span></div>
        <div>
          <div className='text-xl font-bold text-accent'>College</div>
          <div>
            The joy of Kith & Kin we sing <br />
            Thy glory forever shall reign <br />
            Our pride and youth we bring <br />
            To serve our land, this is where we train <br />
            <div className='font-semibold mt-2'>Chorus</div>
            Hail! Boys hail! <br />
            Cheer! Girls cheer! <br />
            Cheer Kith & Kin International College. <br />
          </div>
        </div>
        <div>
          <div className='text-xl font-bold text-accent'>Primary</div>
          <div>
            Oh Great <br />
            School Kith and Kin <br />
            Nursery & Primary School <br />
            Our school built on the rock <br />
            We are bound with peace and unity. <br />
          </div>
        </div>
      </motion.div>
    )
  }



