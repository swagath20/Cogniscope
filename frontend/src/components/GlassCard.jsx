import { motion } from 'framer-motion';

export default function GlassCard({ 
  children, 
  className = "", 
  hoverable = false, 
  onClick = null 
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverable ? { y: -3, scale: 1.008 } : {}}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`relative overflow-hidden rounded-2xl 
        bg-[#121520]/60 backdrop-blur-xl 
        border border-slate-800/80 
        shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] 
        transition-colors duration-300
        ${hoverable ? 'cursor-pointer hover:border-amber-500/40 hover:bg-[#151928]/75 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_25px_-5px_rgba(245,158,11,0.18)]' : ''} 
        ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/15 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}