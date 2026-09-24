import { motion } from "framer-motion"
import {} from "./subs"

const Admin = () => {
  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] min-h-full overflow-clip"
    >
      admin
    </motion.section>
  )
}

export default Admin
