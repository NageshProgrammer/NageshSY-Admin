import React from "react";
import { motion } from "framer-motion";

// Premium Apple-style cinematic ease-out
const cinematicEase = [0.22, 1, 0.36, 1];

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "zoom";
  className?: string;
  delay?: number;
  once?: boolean;
}

export function ScrollReveal({ 
  children, 
  direction = "up", 
  className = "", 
  delay = 0,
  once = false // Set to false so it repeats every time you scroll past it
}: ScrollRevealProps) {
  
  const variants = {
    up: { 
      hidden: { opacity: 0, y: 40 }, 
      visible: { opacity: 1, y: 0, transition: { duration: 1, ease: cinematicEase, delay } } 
    },
    down: { 
      hidden: { opacity: 0, y: -40 }, 
      visible: { opacity: 1, y: 0, transition: { duration: 1, ease: cinematicEase, delay } } 
    },
    left: { 
      hidden: { opacity: 0, x: -40 }, 
      visible: { opacity: 1, x: 0, transition: { duration: 1, ease: cinematicEase, delay } } 
    },
    right: { 
      hidden: { opacity: 0, x: 40 }, 
      visible: { opacity: 1, x: 0, transition: { duration: 1, ease: cinematicEase, delay } } 
    },
    zoom: { 
      hidden: { opacity: 0, scale: 0.95 }, 
      visible: { opacity: 1, scale: 1, transition: { duration: 1.2, ease: cinematicEase, delay } } 
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: once, margin: "-50px" }} // Triggers slightly before it enters the viewport
      variants={variants[direction]}
      className={className}
    >
      {children}
    </motion.div>
  );
}