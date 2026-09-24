import { AnimatePresence, motion } from "framer-motion"
import { useLocation} from "react-router-dom"

const PageTransition = ({ children } : any ) => {
    const pathname = useLocation().pathname
  return (
    <AnimatePresence>
      <div key={pathname}>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                transition: { delay: 1, duration: 0.4, ease: "easeInOut"},
            }}
            className="h-full w-full bg-background top-0 pointer-events-none"
        />
        {children}
      </div>
    </AnimatePresence>
  )
}

export default PageTransition
