import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

/* ===============================
   Shared Hook
================================ */
const useTextRotation = (texts: any[], interval = 6000) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!texts?.length) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % texts.length);
    }, interval);
    return () => clearInterval(timer);
  }, [texts, interval]);

  return texts[index];
};

/* ===============================
   Base Animated Wrapper
================================ */
const AnimatedTextBase = ({
  children,
  variants,
  className = "",
}: {
  children: React.ReactNode;
  variants: any;
  className?: string;
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={String(children)}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/* ===============================
   Variants
================================ */
const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideIn = {
  hidden: { x: "-100%", opacity: 0 },
  visible: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
};

const slideUp = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: "-100%", opacity: 0 },
};

const scaleIn = {
  hidden: { scale: 0.85, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  exit: { scale: 0.85, opacity: 0 },
};

const rotateIn = {
  hidden: { rotate: -90, opacity: 0 },
  visible: { rotate: 0, opacity: 1 },
  exit: { rotate: 90, opacity: 0 },
};

const flipIn = {
  hidden: { rotateY: 90, opacity: 0 },
  visible: { rotateY: 0, opacity: 1 },
  exit: { rotateY: -90, opacity: 0 },
};

const bounceIn = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 280, damping: 16 },
  },
  exit: { scale: 0.5, opacity: 0 },
};

/* 🆕 Rise from below + fade into background */
const riseAndFade = {
  hidden: {
    y: "120%",
    opacity: 0,
  },
  visible: {
    y: "0%",
    opacity: 1,
    transition: {
      duration: 0.9,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.8,
      ease: "easeIn",
    },
  },
};

/* ===============================
   Animation Components
================================ */
export const TextFade = ({ texts, className, interval }: any) => {
  const text = useTextRotation(texts, interval);
  return (
    <AnimatedTextBase variants={fade} className={className}>
      {text}
    </AnimatedTextBase>
  );
};

export const SlideInText = ({ texts, className, interval }: any) => {
  const text = useTextRotation(texts, interval);
  return (
    <AnimatedTextBase variants={slideIn} className={className}>
      {text}
    </AnimatedTextBase>
  );
};

export const SlideUpText = ({ texts, className, interval }: any) => {
  const text = useTextRotation(texts, interval);
  return (
    <AnimatedTextBase variants={slideUp} className={className}>
      {text}
    </AnimatedTextBase>
  );
};

export const ScaleInText = ({ texts, className, interval }: any) => {
  const text = useTextRotation(texts, interval);
  return (
    <AnimatedTextBase variants={scaleIn} className={className}>
      {text}
    </AnimatedTextBase>
  );
};

export const RotateInText = ({ texts, className, interval }: any) => {
  const text = useTextRotation(texts, interval);
  return (
    <AnimatedTextBase variants={rotateIn} className={className}>
      {text}
    </AnimatedTextBase>
  );
};

export const FlipInText = ({ texts, className, interval }: any) => {
  const text = useTextRotation(texts, interval);
  return (
    <AnimatedTextBase variants={flipIn} className={className}>
      {text}
    </AnimatedTextBase>
  );
};

export const BounceInText = ({ texts, className, interval }: any) => {
  const text = useTextRotation(texts, interval);
  return (
    <AnimatedTextBase variants={bounceIn} className={className}>
      {text}
    </AnimatedTextBase>
  );
};

/* 🆕 Rise & Fade Loop Text */
export const RiseAndFadeText = ({ texts, className, interval }: any) => {
  const text = useTextRotation(texts, interval);
  return (
    <AnimatedTextBase variants={riseAndFade} className={className}>
      {text}
    </AnimatedTextBase>
  );
};

/* ===============================
   Zoom Verse Text (Special)
================================ */
export const ZoomInText = ({
  texts,
  className = "",
  interval = 6000,
}: {
  texts: { verse: string; page: string }[];
  className?: string;
  interval?: number;
}) => {
  const item = useTextRotation(texts, interval);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={item.verse}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        className={className}
      >
        <div>{item.verse}</div>
        <div className="text-sm opacity-70">{item.page}</div>
      </motion.div>
    </AnimatePresence>
  );
};