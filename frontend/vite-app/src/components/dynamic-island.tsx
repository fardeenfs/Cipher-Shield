import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useMutation } from "@tanstack/react-query";
import { assistantMutations } from "@/lib/queries";
import Markdown from "react-markdown";

const EASE_OUT_EXPO = [0.19, 1, 0.22, 1] as const;
const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;

type State = "idle" | "scanning" | "monitoring" | "listening" | "chat" | "thinking";
type Message = { role: "user" | "ai"; content: string };

const DOT_PERSONALITIES: Record<
  State,
  { color: string; glow: string; pattern: number[]; duration: number }
> = {
  idle: {
    color: "bg-blue-400",
    glow: "oklch(62.3% 0.214 259.815)",
    pattern: [0.3, 0.15, 0.3, 0.15, 0, 0.15, 0.3, 0.15, 0.3],
    duration: 2.6,
  },
  scanning: {
    color: "bg-emerald-400",
    glow: "rgba(52,211,153,0.85)",
    pattern: [0, 0, 0, 0.15, 0.15, 0.15, 0.30, 0.30, 0.30],
    duration: 1.4,
  },
  monitoring: {
    color: "bg-cyan-400",
    glow: "rgba(34,211,238,0.85)",
    pattern: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    duration: 3.2,
  },
  listening: {
    color: "bg-violet-400",
    glow: "rgba(167,139,250,0.85)",
    pattern: [0.2, 0, 0.2, 0.1, 0, 0.1, 0.2, 0, 0.2],
    duration: 1.8,
  },
  chat: {
    color: "bg-indigo-400",
    glow: "rgba(129,140,248,0.85)",
    pattern: [0, 0.12, 0.24, 0.12, 0, 0.12, 0.24, 0.12, 0],
    duration: 2.0,
  },
  thinking: {
    color: "bg-amber-300",
    glow: "rgba(252,211,77,0.85)",
    pattern: [0, 0.07, 0.14, 0.21, 0.28, 0.21, 0.14, 0.07, 0],
    duration: 0.85,
  },
};

const IDLE_MOODS: { state: State; label: string }[] = [
  { state: "idle",       label: "Assistant"  },
  { state: "scanning",   label: "Scanning"   },
  { state: "monitoring", label: "Monitoring" },
  { state: "listening",  label: "Protecting"  },
];
const IDLE_CYCLE_MS = 4000;

function DotGrid({ state, size = "sm" }: { state: State; size?: "sm" | "md" }) {
  const p = DOT_PERSONALITIES[state];
  const shouldReduce = useReducedMotion();
  return (
    <div className={cn("grid grid-cols-3", size === "md" ? "gap-1" : "gap-[3px]")}>
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.div
          key={`${state}-${i}`}
          className={cn(
            "rounded-none",
            p.color,
            size === "md" ? "size-[6px]" : "size-[5px]"
          )}
          initial={{ opacity: 0.2, scale: 0.7 }}
          animate={
            shouldReduce
              ? { opacity: 0.6, scale: 1 }
              : {
                  opacity: [0.2, 1, 0.2],
                  scale: [0.7, 1.3, 0.7],
                  filter: [
                    `drop-shadow(0 0 0px ${p.glow})`,
                    `drop-shadow(0 0 5px ${p.glow})`,
                    `drop-shadow(0 0 0px ${p.glow})`,
                  ],
                }
          }
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.pattern[i] ?? 0,
          }}
        />
      ))}
    </div>
  );
}

// Shared inline input used in both the inline pill and chat panel
function InlineInput({
  input,
  onInputChange,
  onSubmit,
  isThinking,
  autoFocus = false,
}: {
  input: string;
  onInputChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isThinking: boolean;
  autoFocus?: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="flex-1">
      <input
        type="text"
        placeholder="Ask anything  ↵"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={isThinking}
        autoFocus={autoFocus}
        className="w-full h-[30px] rounded-full px-[12px] text-[12px] text-white/90 placeholder:text-white/20 focus:outline-none disabled:opacity-50"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.09)",
          transition: "border-color 150ms ease, background-color 150ms ease",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "rgba(255,255,255,0.18)";
          e.target.style.backgroundColor = "rgba(255,255,255,0.09)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(255,255,255,0.09)";
          e.target.style.backgroundColor = "rgba(255,255,255,0.06)";
        }}
      />
    </form>
  );
}

function PillView({ isThinking, moodIdx }: { isThinking: boolean; moodIdx: number }) {
  const mood = isThinking
    ? { state: "thinking" as State, label: "Thinking..." }
    : IDLE_MOODS[moodIdx];
  return (
    <div className="flex items-center gap-[10px] h-[42px] px-[14px]">
      <DotGrid state={mood.state} />
      <AnimatePresence mode="wait">
        <motion.span
          key={mood.state}
          initial={{ opacity: 0, y: 3, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -3, filter: "blur(3px)" }}
          transition={{ duration: 0.14, ease: EASE_OUT_QUART }}
          className={cn(
            "text-[12px] font-medium leading-none select-none tracking-[-0.01em]",
            isThinking ? "text-amber-300/90" : "text-white/50"
          )}
        >
          {mood.label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function InlineView({
  isThinking,
  moodIdx,
  input,
  onInputChange,
  onSubmit,
  onExpand,
}: {
  isThinking: boolean;
  moodIdx: number;
  input: string;
  onInputChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onExpand: () => void;
}) {
  const mood = isThinking
    ? { state: "thinking" as State, label: "Thinking..." }
    : IDLE_MOODS[moodIdx];
  return (
    <div className="flex items-center gap-[10px] h-[42px] px-[14px]">
      <DotGrid state={mood.state} />
      <span className={cn(
        "text-[12px] font-medium leading-none select-none tracking-[-0.01em] whitespace-nowrap",
        isThinking ? "text-amber-300/90" : "text-white/50"
      )}>
        {mood.label}
      </span>
      {/* Thin vertical separator */}
      <div className="w-px h-[16px] bg-white/10 shrink-0" />
      <InlineInput
        input={input}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
        isThinking={isThinking}
        autoFocus
      />
      {/* Expand button */}
      <button
        type="button"
        onClick={onExpand}
        className="shrink-0 size-[26px] rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 active:scale-95"
        style={{ transition: "color 150ms ease, background 150ms ease, transform 100ms ease" }}
        title="Open chat"
      >
        {/* Expand arrows icon */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.5 1.5H10.5V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.5 1.5L6.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M4.5 10.5H1.5V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1.5 10.5L5.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

// Chat: full panel with history
function ChatView({
  messages,
  input,
  onInputChange,
  onSubmit,
  isThinking,
  moodIdx,
}: {
  messages: Message[];
  input: string;
  onInputChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isThinking: boolean;
  moodIdx: number;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const bubbleT = { duration: 0.16, ease: EASE_OUT_QUART };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isThinking]);

  const headerMood = isThinking
    ? { state: "thinking" as State, label: "Thinking..." }
    : IDLE_MOODS[moodIdx];

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <div className="flex items-center gap-[10px] px-[15px] pt-[14px] pb-[10px] shrink-0">
        <DotGrid state={headerMood.state} size="md" />
        <AnimatePresence mode="wait">
          <motion.span
            key={headerMood.state}
            initial={{ opacity: 0, filter: "blur(3px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(3px)" }}
            transition={{ duration: 0.12, ease: EASE_OUT_QUART }}
            className={cn(
              "text-[12px] font-semibold leading-none tracking-[-0.01em]",
              isThinking ? "text-amber-300" : "text-white/70"
            )}
          >
            {headerMood.label}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-[15px] py-[6px] flex flex-col gap-[8px] [&::-webkit-scrollbar]:hidden">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={bubbleT}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "user" ? (
              <p className="text-[13px] leading-normal max-w-[85%] wrap-break-word px-[12px] py-[8px] text-indigo-300">
                {msg.content}
              </p>
            ) : (
              <div className={cn(
                "prose prose-invert max-w-[90%] px-[12px] py-[8px]",
                "prose-p:text-white/55 prose-p:text-[13px] prose-p:leading-relaxed prose-p:my-1",
                "prose-headings:text-white/80 prose-headings:font-semibold prose-headings:text-[13px] prose-headings:my-1",
                "prose-strong:text-white/75 prose-strong:font-semibold",
                "prose-code:text-indigo-300 prose-code:text-[12px] prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
                "prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-none prose-pre:text-[12px]",
                "prose-ul:text-white/55 prose-ul:text-[13px] prose-ul:my-1 prose-li:my-0",
                "prose-ol:text-white/55 prose-ol:text-[13px] prose-ol:my-1",
                "prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline",
                "prose-hr:border-white/10",
              )}>
                <Markdown>{msg.content}</Markdown>
              </div>
            )}
          </motion.div>
        ))}

        <AnimatePresence>
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={bubbleT}
              className="self-start px-[12px] py-[10px]"
            >
              <DotGrid state="thinking" />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-[15px] pb-[12px] pt-[6px] shrink-0">
        <InlineInput
          input={input}
          onInputChange={onInputChange}
          onSubmit={onSubmit}
          isThinking={isThinking}
          autoFocus
        />
      </div>
    </div>
  );
}

export default function DynamicIsland({ className }: { className?: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // true only after first message sent
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [moodIdx, setMoodIdx] = useState(0);
  const shouldReduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation(assistantMutations.chat());
  const isThinking = chatMutation.isPending;
  const hasMessages = messages.length > 0;
  // forceOpen: keep chat open while AI is responding (not while typing)
  const forceOpen = isThinking;

  // Mood cycling
  useEffect(() => {
    if (isThinking) return;
    const id = setInterval(() => setMoodIdx((i) => (i + 1) % IDLE_MOODS.length), IDLE_CYCLE_MS);
    return () => clearInterval(id);
  }, [isThinking]);

  // Click outside to close chat
  useEffect(() => {
    if (!isChatOpen) return;
    const handler = (e: MouseEvent) => {
      if (isThinking) return; // don't close while AI is responding
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsChatOpen(false);
        setIsHovered(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isChatOpen, isThinking]);

  // View mode:
  //  "pill"   — not hovered, chat not open
  //  "inline" — hovered, chat not open (horizontal expand adds input)
  //  "chat"   — message sent or AI responding (full panel)
  const mode: "pill" | "inline" | "chat" =
    (isChatOpen && hasMessages) || forceOpen
      ? "chat"
      : isHovered
      ? "inline"
      : "pill";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    const msg = input.trim();
    setMessages((p) => [...p, { role: "user", content: msg }]);
    setInput("");
    setIsChatOpen(true); // expand to full chat on first send
    chatMutation.mutate(
      { message: msg },
      {
        onSuccess: (d) => setMessages((p) => [...p, { role: "ai", content: d.response }]),
        onError: () => setMessages((p) => [...p, { role: "ai", content: "Sorry, I encountered an error." }]),
      }
    );
  };

  return (
    <motion.div
      ref={containerRef}
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { if (!forceOpen && !isChatOpen) setIsHovered(false); }}
      style={{ borderRadius: 30 }}
      transition={
        shouldReduce
          ? { duration: 0 }
          : { layout: { type: "spring", duration: 0.45, bounce: 0.12 } }
      }
      className={cn(
        "will-change-transform overflow-hidden",
        "backdrop-blur-xl bg-black/75",
        mode === "chat"
          ? "w-[480px] h-[260px] shadow-[0_16px_48px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)]"
          : mode === "inline"
          ? "w-[360px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "w-fit shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]",
        className
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {mode === "chat" ? (
          <motion.div
            key="chat"
            className="w-full h-full"
            initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)",
              transition: { delay: 0.07, duration: 0.22, ease: EASE_OUT_EXPO } }}
            exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)",
              transition: { duration: 0.13, ease: EASE_OUT_QUART } }}
          >
            <ChatView
              messages={messages}
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              isThinking={isThinking}
              moodIdx={moodIdx}
            />
          </motion.div>
        ) : mode === "inline" ? (
          <motion.div
            key="inline"
            initial={{ opacity: 0, filter: "blur(3px)" }}
            animate={{ opacity: 1, filter: "blur(0px)",
              transition: { delay: 0.04, duration: 0.18, ease: EASE_OUT_EXPO } }}
            exit={{ opacity: 0, filter: "blur(3px)",
              transition: { duration: 0.1, ease: EASE_OUT_QUART } }}
          >
            <InlineView
              isThinking={isThinking}
              moodIdx={moodIdx}
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              onExpand={() => setIsChatOpen(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="pill"
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)",
              transition: { delay: 0.05, duration: 0.18, ease: EASE_OUT_EXPO } }}
            exit={{ opacity: 0, filter: "blur(4px)",
              transition: { duration: 0.1, ease: EASE_OUT_QUART } }}
          >
            <PillView isThinking={isThinking} moodIdx={moodIdx} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
