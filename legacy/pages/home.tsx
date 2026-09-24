import { motion } from "framer-motion"
import { Button } from '@/components/ui/button';
//import Social from "@/components/utility/social"
import { Landing } from "./subs"



const Home = () => {
  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] min-h-full overflow-clip flex flex-col /relative"
    >
      <div className="relative flex md:hidden /h-[90vh] w-[100vw] /-z-10 justify-center">
      <img src="/legacy/assets/logo.png" alt="" className="flex h-[40vh] absolute /-z-10 top-36 opacity-15 dark:opacity-5 animate-pulse" />
      </div>
      
      <div className="w-full flex flex-1 justify-center /items-center">
        <Landing />
      </div>
      {/* <Footer /> */}
      
    </motion.section>
  )
}

export default Home
