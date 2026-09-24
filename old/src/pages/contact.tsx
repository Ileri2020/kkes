
import info from "../data/cont"
import { motion } from "framer-motion"
import contact from "@/data/cont"
import Social from "@/components/utility/social"
import ContactForm from "@/components/utility/contactForm"

const Contact = () => {
  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] overflow-clip py-6"
    >
      <div className="container mx-auto">
        <div className="flex flex-col xl:flex-row gap-[30px]">
          <div className="xl:h-[54%] order-2 xl:order-none">
            <ContactForm />
          </div>
          <div className="flex flex-col flex-1 max-w-[480px] mx-3">
            <div className="text-2xl font-semibold my-3 text-center md:text-start">Let's talk</div>
            <div className="my-5">{contact.description}</div>
            <div className="flex flex-col">
              {contact.contact.map((contact, index)=>{
                return (
                  <div className="flex flex-row m-2" key={index}>
                    <div className="p-2">{contact.icon}</div>
                    <div className="flex flex-col mx-5">
                      <div className="text-lg my-1">{contact.text}</div>
                      <div>{contact.value}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="w-full mx-2 my-10 flex justify-center items-center">
              <Social 
                      containerStyles='flex gap-4 md:gap-6 mx-auto'
                      iconStyles='w-9 h-9 border border-accent rounded-full flex justify-center items-center text-accent text-base hover:bg-accent hover:text-background/80 hover:transition-all duration-500' 
              />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default Contact
