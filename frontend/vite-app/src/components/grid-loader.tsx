import { cn } from "@/lib/utils";
import { motion } from "motion/react";
export default function GridLoader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const dots = Array.from({ length: 9 });

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const dotVariants = {
    animate: {
      opacity: [0.3, 1, 0.3],
      scale: [0.8, 1.2, 0.8],
      filter: [
        "drop-shadow(0 0 0px oklch(62.3% 0.214 259.815))",
        "drop-shadow(0 0 4px oklch(62.3% 0.214 259.815))",
        "drop-shadow(0 0 0px oklch(62.3% 0.214 259.815))",
      ],
    },
  };

  return (
    <div
      className={cn(
        className,
        "flex items-center gap-3 px-4 py-2 bg-black rounded-xl w-fit border border-white/10",
      )}
      {...props}
    >
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-3 gap-1"
      >
        {dots.map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3, scale: 0.8 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            variants={dotVariants}
            className="size-1 bg-blue-500"
          />
        ))}
      </motion.div>
      <span className="text-sm font-medium text-white/70">Thinking</span>
    </div>
  );
}
