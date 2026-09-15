import SectionTitle from './SectionTitle';

const TESTIMONIALS = [
  {
    name: 'Priya S.',
    city: 'Mumbai',
    color: 'bg-nav-women',
    quote: 'Fast delivery and the product quality was exactly as described. Already on my second order.',
  },
  {
    name: 'Marcus T.',
    city: 'Austin',
    color: 'bg-nav-beauty',
    quote: 'Great selection and the checkout was refreshingly simple. No surprises at the last step.',
  },
  {
    name: 'Elena R.',
    city: 'Lisbon',
    color: 'bg-nav-kids',
    quote: 'Customer support helped me track my order without any hassle. Five stars, easily.',
  },
];

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.replace('.', '')[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Testimonials() {
  return (
    <section aria-labelledby="testimonials-title" className="bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <SectionTitle title="What Customers Say" id="testimonials-title" />
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <li key={t.name}>
              <blockquote className="relative flex h-full flex-col rounded-sm border border-line bg-white p-5 pt-7 transition-shadow duration-200 hover:shadow-[0_2px_16px_4px_rgba(40,44,63,0.07)] sm:p-6 sm:pt-8">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-4 top-1 font-serif text-[72px] leading-none text-brand-light select-none"
                >
                  &ldquo;
                </span>
                <div className="relative mb-3 flex items-center gap-0.5 text-success" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
                    </svg>
                  ))}
                </div>
                <p className="relative flex-1 text-[14px] leading-relaxed text-ink-2 sm:text-[15px]">{t.quote}</p>
                <footer className="relative mt-5 flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${t.color} text-[12px] font-bold text-white`}
                  >
                    {initials(t.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold text-ink">{t.name}</span>
                    <span className="block text-[12px] text-ink-3">{t.city}</span>
                  </span>
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
