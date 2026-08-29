import { motion } from 'framer-motion';

export default function PrimaryButton({ 
  children, 
  onClick, 
  className = "", 
  disabled = false,
  icon: Icon = null 
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      transition={{ type: "spring", stiffness: 450, damping: 20 }}
      className={`relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-sm cursor-pointer
        bg-amber-500 text-slate-950
        shadow-[0_0_20px_rgba(245,158,11,0.3)]
        hover:bg-amber-400 hover:shadow-[0_0_35px_rgba(245,158,11,0.55)]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
        transition-colors duration-150 ${className}`}
    >
      <span>{children}</span>
      {Icon && <Icon className="w-4 h-4 text-slate-950" />}
    </motion.button>
  );
}