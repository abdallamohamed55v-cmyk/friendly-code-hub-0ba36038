import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  onClick?: () => void;
}

/**
 * Gold pill used on pricing cards (>= $25 plans). Shows the "Everything is Unlimited"
 * label centered across the full pill width.
 */
export function UnlimitedModelsButton({ className, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "umb-pill-v2 font-display select-none cursor-default justify-center",
        className
      )}
      aria-label="Everything is unlimited"
    >
      <span className="umb-label w-full text-center">Everything is Unlimited</span>
    </button>
  );
}

export default UnlimitedModelsButton;


