import { cn } from "@/lib/utils";

/**
 * Section backdrop: a fine lattice that fades out radially, over a soft accent
 * bloom.
 *
 * Zero JavaScript and zero dependencies — it is three gradients and a mask, so
 * it renders identically on every device, stays crisp at any zoom or DPI, and
 * costs nothing on mobile. It replaced a WebGL shader (React Bits' Silk), which
 * at the low opacity this needs degraded into a grey smudge with visible
 * banding. Geometry survives being turned down; soft noise does not.
 *
 * Must sit inside a `relative isolate` parent.
 */
export function GridBackdrop({
  className,
  /** "lines" suits wide content areas, "dots" suits card grids. */
  pattern = "dots",
  /** Bloom hue. Defaults to the site's violet primary. */
  bloom = "violet",
}: {
  className?: string;
  pattern?: "dots" | "lines";
  bloom?: "violet" | "amber" | "none";
}) {
  const lattice =
    pattern === "dots"
      ? {
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklch, var(--color-foreground) 22%, transparent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }
      : {
          backgroundImage: [
            "linear-gradient(to right, color-mix(in oklch, var(--color-foreground) 12%, transparent) 1px, transparent 1px)",
            "linear-gradient(to bottom, color-mix(in oklch, var(--color-foreground) 12%, transparent) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "64px 64px",
        };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      {/*
        The lattice is masked twice: an ellipse keeps it off the edges of the
        section, and a vertical fade keeps it from butting hard against the
        neighbouring section's border.
      */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          ...lattice,
          maskImage:
            "radial-gradient(ellipse 75% 60% at 50% 45%, black 20%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 60% at 50% 45%, black 20%, transparent 100%)",
        }}
      />

      {bloom !== "none" ? (
        <div
          className="absolute left-1/2 top-1/2 aspect-square w-[120%] max-w-[64rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
          style={{
            background:
              bloom === "amber"
                ? "radial-gradient(circle, color-mix(in oklch, var(--color-amber-500) 10%, transparent) 0%, transparent 65%)"
                : "radial-gradient(circle, color-mix(in oklch, var(--color-violet-500) 13%, transparent) 0%, transparent 65%)",
          }}
        />
      ) : null}
    </div>
  );
}
