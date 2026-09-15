const ITEMS = [
  {
    title: 'Free shipping',
    desc: 'On all orders over $50',
    icon: (
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    ),
  },
  {
    title: 'Easy 30-day returns',
    desc: 'No questions asked',
    icon: <path d="M4 10a8 8 0 1 1 2.3 5.7M4 10V4m0 6h6" />,
  },
  {
    title: '100% original',
    desc: 'Authentic products only',
    icon: <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3zm-3 9l2 2 4-4" />,
  },
  {
    title: 'Secure checkout',
    desc: 'Your data stays protected',
    icon: <path d="M6 11V8a6 6 0 0112 0v3M5 11h14v10H5zM12 15v3" />,
  },
];

export default function TrustRow() {
  return (
    <section aria-label="Why shop with Couture" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <ul className="grid grid-cols-2 divide-line rounded-sm border border-line bg-white sm:grid-cols-4 sm:divide-x">
        {ITEMS.map((item, i) => (
          <li
            key={item.title}
            className={`flex items-center gap-3 px-4 py-4 sm:px-5 sm:py-5 ${i < 2 ? 'border-b border-line sm:border-b-0' : ''} ${
              i % 2 === 0 ? 'border-r border-line sm:border-r-0' : ''
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {item.icon}
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink sm:text-[14px]">{item.title}</p>
              <p className="truncate text-[12px] text-ink-3">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
