import { motion } from 'motion/react';
import { PenTool } from 'lucide-react';

interface FloatingTypingIndicatorProps {
  isVisible: boolean;
}

export default function FloatingTypingIndicator({ isVisible }: FloatingTypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.92 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="sticky bottom-2 z-20 flex justify-start my-2 pointer-events-none"
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        className="flex items-center gap-3 px-4 py-2 rounded-full bg-neutral-900/95 border border-amber-500/30 text-neutral-200 shadow-xl shadow-amber-500/5 backdrop-blur-md"
      >
        {/* Animated pen writing motion */}
        <motion.div
          animate={{
            rotate: [-10, 12, -8, 6, -10],
            x: [-1, 2, -1],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.6,
            ease: 'easeInOut',
          }}
          className="text-amber-400 flex items-center justify-center"
        >
          <PenTool className="w-4 h-4" />
        </motion.div>

        <span className="text-xs font-medium tracking-wide text-neutral-300">
          The other person is writing
        </span>

        {/* 3 bouncing rhythmic dots */}
        <div className="flex items-center gap-1">
          <motion.span
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
          />
          <motion.span
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.2, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
          />
          <motion.span
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.4, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
