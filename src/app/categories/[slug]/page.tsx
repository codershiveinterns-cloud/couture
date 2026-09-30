import type { Metadata } from 'next';
import { getCategoryBySlug, getProducts, parseProductQuery } from '@/lib/api';
import LiveProductGrid from '@/components/storefront/LiveProductGrid';
import { breadcrumbJsonLd, categoryBreadcrumbs, itemListJsonLd, pageMetadata, serializeJsonLd, truncateDescription } from '@/lib/seo';

// Render per-request so catalog changes show without a rebuild.
export const dynamic = 'force-dynamic';

const titleFromSlug = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .slice(0, 80);

export async function generateMetadata({ params }: PageProps<'/categories/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  // Unknown slugs may be admin-created categories that only exist in the browser catalog.
  if (!category) return { title: titleFromSlug(slug) || 'Category', robots: { index: false } };
  return pageMetadata({
    title: category.name,
    description:
      truncateDescription(category.description) ||
      `Shop ${category.name} at Couture: curated picks, weekly drops, fast shipping and easy returns.`,
    path: `/categories/${category.slug}`,
    images: category.imageUrl ? [category.imageUrl] : undefined,
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps<'/categories/[slug]'>) {
  const { slug } = await params;
  const sp = await searchParams;

  // Server render = base catalog; LiveProductGrid applies admin edits (and resolves
  // admin-created categories, or shows the not-found panel) in the browser.
  const category = await getCategoryBySlug(slug);
  const result = category ? await getProducts({ ...parseProductQuery(sp), category: slug, pageSize: 12 }) : null;

  const jsonLd =
    category && result
      ? serializeJsonLd([
          breadcrumbJsonLd(categoryBreadcrumbs(category)),
          itemListJsonLd(result.data, category.name, `/categories/${category.slug}`),
        ])
      : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      <LiveProductGrid basePath={`/categories/${slug}`} searchParams={sp} result={result} category={category} categorySlug={slug} />
    </>
  );
}
