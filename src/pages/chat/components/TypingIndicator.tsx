import { motion } from "framer-motion";

interface TypingUser {
  id: string;
  name?: string | null;
  avatar?: string | null;
}

interface ColorPair {
  bg: string;
  text?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  colorForUser: (userId?: string | null) => ColorPair | null | undefined;
}

export const TypingIndicator = ({ typingUsers, colorForUser }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground"
    >
      <div className="flex -space-x-1.5">
        {typingUsers.slice(0, 3).map((u) => {
          const c = colorForUser(u.id);
          return u.avatar ? (
            <img
              key={u.id}
              src={u.avatar}
              alt=""
              className="w-5 h-5 rounded-full ring-2 ring-background object-cover"
            />
          ) : (
            <div
              key={u.id}
              className="w-5 h-5 rounded-full ring-2 ring-background flex items-center justify-center text-[9px] font-bold text-foreground"
              style={{ background: c?.bg || "hsl(var(--accent))" }}
            >
              {(u.name || "?")[0]?.toUpperCase()}
            </div>
          );
        })}
      </div>
      <div className="flex gap-0.5">
        <span
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span>
        {typingUsers.map((u) => u.name).join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
        typing…
      </span>
    </motion.div>
  );
};

export default TypingIndicator;
