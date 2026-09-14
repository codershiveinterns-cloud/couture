const ITEMS = [
  'Free shipping over $50',
  'New arrivals weekly',
  '30-day easy returns',
  'Secure checkout',
  'Rated 4.8/5 by customers',
];

export default function Marquee() {
  // Render the list twice back-to-back; animating translateX(-50%) then
  // loops seamlessly from the second copy back to the first.
  const track = [...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden border-y border-ink/10 bg-ink py-2.5">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {track.map((item, i) => (
          <span key={i} className="flex items-center gap-10 text-xs font-medium uppercase tracking-wider text-white/80">
            {item}
            <span aria-hidden className="text-brand">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
