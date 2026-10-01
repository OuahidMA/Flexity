import { cn } from "@/lib/utils";

const positionClass = {
  top: "top-0",
  bottom: "bottom-0",
  both: "inset-y-0",
};

const fullMask =
  "linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%)";

function getMask(position, startPercent, midPercent, endPercent) {
  if (position === "both") {
    return fullMask;
  }

  const direction = position === "top" ? "to top" : "to bottom";
  return `linear-gradient(${direction}, rgba(0,0,0,0) ${startPercent}%, rgba(0,0,0,1) ${midPercent}%, rgba(0,0,0,1) ${endPercent}%, rgba(0,0,0,0) ${endPercent + 12.5}%)`;
}

function getEdgeMask(position) {
  if (position === "both") {
    return fullMask;
  }

  const direction = position === "top" ? "to top" : "to bottom";
  return `linear-gradient(${direction}, rgba(0,0,0,0) 87.5%, rgba(0,0,0,1) 100%)`;
}

export function ProgressiveBlur({
  className,
  height = "30%",
  position = "bottom",
  blurLevels = [0.5, 1, 2, 4, 8, 16, 32, 64],
}) {
  const middleLayers = Array(Math.max(0, blurLevels.length - 2)).fill(null);
  const edgeMask = getEdgeMask(position);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "gradient-blur pointer-events-none absolute inset-x-0 z-10",
        positionClass[position],
        className
      )}
      style={{
        height: position === "both" ? "100%" : height,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          backdropFilter: `blur(${blurLevels[0]}px)`,
          WebkitBackdropFilter: `blur(${blurLevels[0]}px)`,
          maskImage: getMask(position, 0, 12.5, 25),
          WebkitMaskImage: getMask(position, 0, 12.5, 25),
        }}
      />
      {middleLayers.map((_, index) => {
        const blurIndex = index + 1;
        const startPercent = blurIndex * 12.5;
        const midPercent = (blurIndex + 1) * 12.5;
        const endPercent = (blurIndex + 2) * 12.5;
        const mask = getMask(
          position,
          startPercent,
          midPercent,
          endPercent
        );

        return (
          <div
            key={`blur-${index}`}
            className="absolute inset-0"
            style={{
              zIndex: index + 2,
              backdropFilter: `blur(${blurLevels[blurIndex]}px)`,
              WebkitBackdropFilter: `blur(${blurLevels[blurIndex]}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
      <div
        className="absolute inset-0"
        style={{
          zIndex: blurLevels.length,
          backdropFilter: `blur(${blurLevels[blurLevels.length - 1]}px)`,
          WebkitBackdropFilter: `blur(${blurLevels[blurLevels.length - 1]}px)`,
          maskImage: edgeMask,
          WebkitMaskImage: edgeMask,
        }}
      />
    </div>
  );
}
