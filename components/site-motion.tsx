"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { Check, ShieldCheck } from "@phosphor-icons/react";

const spring = { type: "spring" as const, bounce: 0, duration: 0.45 };

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 32, mass: 0.3 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.16 }} transition={{ ...spring, delay }}>{children}</motion.div>;
}

export function OwnershipProof() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [3, -3]), { stiffness: 180, damping: 24 });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-4, 4]), { stiffness: 180, damping: 24 });

  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (reduce || !stage.current) return;
    const bounds = stage.current.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  }

  function reset() { pointerX.set(0); pointerY.set(0); }

  return <motion.div ref={stage} className="proof-stage" onPointerMove={move} onPointerLeave={reset} initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 22 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ ...spring, delay: 0.12 }}>
    <motion.div className="proof-note proof-note-top" animate={reduce ? undefined : { y: [0, -6, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}>Benefit rule <strong>Hold 0.25 AAPLc</strong></motion.div>
    <motion.div className="proof-card" style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 900 }} whileTap={reduce ? undefined : { scale: 0.985 }}>
      <div className="proof-card-head"><span>Ownership check</span><span className="verified"><Check size={14} weight="bold" /> Passed on Base</span></div>
      <div className="proof-person"><span className="avatar">0x</span><div><strong>Wallet qualifies</strong><small>0x71C4…98F2</small></div></div>
      <div className="proof-balance"><span>Stock balance found</span><strong>0.42 <small>AAPLc</small></strong></div>
      <div className="proof-rule"><span>Amount needed</span><span>0.25 AAPLc</span></div>
      <div className="proof-foot"><ShieldCheck size={18} /><span>The stock stays in the wallet. EquityKey only checks ownership.</span></div>
    </motion.div>
    <motion.div className="proof-note proof-note-bottom" animate={reduce ? undefined : { y: [0, 6, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>Claim receipt <strong>Saved onchain</strong></motion.div>
  </motion.div>;
}
