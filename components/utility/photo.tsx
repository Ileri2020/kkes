import { motion } from "framer-motion"
import profileURI from "../../images/profilepic2.jpg"



const Photo = () => {
  return (
    <div className="w-full h-full relative">
      <motion.div 
        initial={{opacity: 0}}
        animate={{
          opacity: 1,
          transition: { delay: 2, duration: 0.4, ease: "easeIn"},
        }}
        className=" rounded-full overflow-clip w-[298px] h-[298px] xl:w-[498px] xl:h-[498px]"
      >
        <motion.div 
          initial={{opacity: 0}}
          animate={{
            opacity: 1,
            transition: { delay: 2.4, duration: 0.4, ease: "easeInOut"}
          }}
          className="container"
        >
          <img src={profileURI.src} alt="" className="w-full h-full rounded-full" />
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Photo
