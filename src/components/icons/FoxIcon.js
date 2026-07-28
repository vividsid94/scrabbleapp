// Small custom low-poly fox face icon (not from Phosphor) - two angular ear
// triangles plus a wedge-shaped muzzle, all in a single flat fill color so it
// matches the monochrome style of the surrounding icon set and adapts to
// light/dark mode via the `color` prop, same as any Phosphor icon it sits
// next to.
export default function FoxIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={style}
    >
      <polygon points="2,10 8,2 10,11" />
      <polygon points="22,10 16,2 14,11" />
      <polygon points="3,10 21,10 12,22" />
    </svg>
  );
}
