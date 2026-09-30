import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import PageProgress from "@/components/PageProgress";
import Providers from "./providers";
import { getCategories } from "@/lib/api";
import { DEFAULT_LOCALE, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL, TWITTER_HANDLE } from "@/lib/seo";

const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['online shopping', 'electronics', 'fashion', 'home', 'beauty', 'deals', SITE_NAME],
  category: 'shopping',
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: DEFAULT_LOCALE,
    url: '/',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    site: TWITTER_HANDLE,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ff3f6c',
  colorScheme: 'light',
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const categories = await getCategories().catch(() => []);

  return (
    <html lang="en" className={`${figtree.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <Providers>
          <a
            href="#main-content"
            className="sr-only z-[100] rounded-sm bg-brand px-4 py-2 text-[14px] font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            Skip to content
          </a>
          <PageProgress />
          <Header categories={categories} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <BackToTop />
        </Providers>
      </body>
    </html>
  );
}
