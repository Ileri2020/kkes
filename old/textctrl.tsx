
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const TextAnimations = () => {
  const texts = ['TextAnimations', 'Text 2', 'TextAnimations', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: {
            duration: 2.0,
            delay: 0.5,
            /*repeat: Infinity,*/
          },
        }}
        className="text-lg font-bold text-gray-800"
      >
        {texts[currentIndex]}
      </motion.div>
    )
  }
  

  return (
    <div className="container mx-auto p-4">
        <Temp />
    </div>
  );
};



export const SlideInText = () => {
  const texts = ['SlideInText', 'Text 2', 'SlideInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  
  const Temp = () => {
    return (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{
            x: '0%',
            transition: {
              duration: 4.0,
              delay: 0.5,
            },
          }}
          className="text-lg font-bold text-gray-800"
        >
          {texts[currentIndex]}
        </motion.div>
    )
  }
  

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};



export const ScaleInText = () => {
  const texts = ['ScaleInText', 'Text 2', 'ScaleInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            transition: {
              duration: 4.0,
              delay: 0.5,
            },
          }}
          className="text-lg font-bold text-gray-800"
        >
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};



export const RotateInText = () => {
  const texts = ['RotateInText', 'Text 2', 'RotateInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
        <motion.div
          initial={{ rotate: '0deg' }}
          animate={{
            rotate: '360deg',
            transition: {
              duration: 4.0,
              delay: 0.5,
            },
          }}
          className="text-lg font-bold text-gray-800"
        >
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};



export const FlyInText = () => {
  const texts = ['FlyInText', 'Text 2', 'FlyInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{
            x: '0%',
            transition: {
              duration: 4.0,
              delay: 0.5,
            },
          }}
          className="text-lg font-bold text-gray-800"
        >
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};


export const TypewriterText = () => {
  const texts = ['TypewriterText', 'Text 2', 'TypewriterText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
        <motion.div
          initial={{ width: '0%' }}
          animate={{
            width: '100%',
            transition: {
              duration: 4.0,
              delay: 0.5,
            },
          }}
          className="text-lg font-bold text-gray-800"
        >
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};



export const SlideUpText = () => {
  const texts = ['SlideUpText', 'Text 2', 'SlideUpText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
        <motion.div
          initial={{ y: '100%' }}
          animate={{
            y: '0%',
            transition: {
              duration: 4.0,
              delay: 0.5,
            },
          }}
          className="text-lg font-bold text-gray-800"
        >
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};



export const BounceInText = () => {
  const texts = ['BounceInText', 'Text 2', 'BounceInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            transition: {
              duration: 4.0,
              delay: 0.5,
            },
          }}
          className="text-lg font-bold text-gray-800"
        >
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};



export const ZoomInText = () => {
  const texts = ['ZoomInText', 'Text 2', 'ZoomInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            transition: {
              duration: 4.0,
              delay: 0.5,
            },
          }}
          className="text-lg font-bold text-gray-800"
        >
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};



export const FlipInText = () => {
  const texts = ['FlipInText', 'Text 2', 'FlipInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
        <motion.div
          initial={{ rotateY: '180deg' }}
          animate={{
            rotateY: '0deg',
            transition: {
              duration: 4.0,
              delay: 0.5,
            },
          }}
          className="text-lg font-bold text-gray-800"
        >
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};




