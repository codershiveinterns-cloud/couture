'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { ADMIN_TABLE, AdminCard, AdminPage } from '@/components/admin/AdminPage';
import { AdminThumb, FOCUS_RING, ROW_ACTION, ROW_ACTION_DANGER, TableSkeleton } from '@/components/admin/products/shared';
import { Button, EmptyState, Input, Modal, Textarea } from '@/components/ui';
import { toast } from '@/context/ToastContext';
import { useCatalog } from '@/hooks/useCatalog';
import type { CategoryRecord } from '@/lib/mockTypes';
import {
  categoryToInput,
  createCategory,
  deleteCategory,
  EMPTY_CATEGORY_INPUT,
  IMAGE_URL_HINT,
  isAllowedImageUrl,
  slugify,
  updateCategory,
  type CategoryField,
  type CategoryInput,
} from '@/lib/services/catalogStore';
import type { FieldErrors } from '@/lib/validation';

interface EditorState {
  /** null = creating. */
  category: CategoryRecord | null;
  input: CategoryInput;
  slug: string;
  /** Once the admin edits the slug (or when editing an existing category) it stops following the name. */
  slugTouched: boolean;
}

export function CategoriesManager() {
  const { categories, products, isHydrated } = useCatalog();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [errors, setErrors] = useState<FieldErrors<CategoryField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryRecord | null>(null);

  /** All products per category, drafts included (category.productCount only counts published ones). */
  const totals = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1));
    return map;
  }, [products]);

  const openEditor = (category: CategoryRecord | null) => {
    setErrors({});
    setFormError(null);
    setEditor({
      category,
      input: category ? categoryToInput(category) : { ...EMPTY_CATEGORY_INPUT },
      slug: category?.slug ?? '',
      slugTouched: category !== null,
    });
  };

  const patchInput = (patch: Partial<CategoryInput>, clear: CategoryField) => {
    setEditor((current) => {
      if (!current) return current;
      const input = { ...current.input, ...patch };
      const slug = !current.slugTouched && patch.name !== undefined ? slugify(patch.name) : current.slug;
      return { ...current, input, slug };
    });
    if (errors[clear]) setErrors((current) => ({ ...current, [clear]: undefined }));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    const input: CategoryInput = { ...editor.input, slug: editor.slug.trim() || undefined };
    const result = editor.category ? updateCategory(editor.category.id, input) : createCategory(input);
    if (!result.ok) {
      setErrors((result.fieldErrors ?? {}) as FieldErrors<CategoryField>);
      setFormError(result.error);
      return;
    }
    toast.success(editor.category ? `"${result.data.name}" updated` : `"${result.data.name}" created`);
    setEditor(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const result = deleteCategory(pendingDelete.id);
    if (result.ok) toast.success(`"${pendingDelete.name}" deleted`);
    else toast.error(result.error);
    setPendingDelete(null);
  };

  const imageUrl = editor?.input.imageUrl.trim() ?? '';
  const imageInvalid = imageUrl !== '' && !isAllowedImageUrl(imageUrl);
  const formId = 'admin-category-form';

  return (
    <AdminPage
      title="Categories"
      description="Group products so shoppers can browse the store."
      actions={
        <Button size="sm" onClick={() => openEditor(null)}>
          Add category
        </Button>
      }
    >
      <AdminCard padded={false}>
        {!isHydrated ? (
          <TableSkeleton />
        ) : categories.length === 0 ? (
          <EmptyState
            className="border-0"
            title="No categories yet"
            description="Create a category before adding products."
            action={<Button onClick={() => openEditor(null)}>Add category</Button>}
          />
        ) : (
          <div className={ADMIN_TABLE.wrap}>
            <table className={ADMIN_TABLE.table}>
              <caption className="sr-only">Categories</caption>
              <thead>
                <tr>
                  <th scope="col" className={ADMIN_TABLE.th}>Category</th>
                  <th scope="col" className={ADMIN_TABLE.th}>Slug</th>
                  <th scope="col" className={ADMIN_TABLE.th}>Description</th>
                  <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>Products</th>
                  <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const total = totals.get(category.id) ?? 0;
                  const drafts = Math.max(0, total - category.productCount);
                  return (
                    <tr key={category.id} className={ADMIN_TABLE.row}>
                      <td className={ADMIN_TABLE.td}>
                        <div className="flex items-center gap-3">
                          <AdminThumb url={category.imageUrl} alt="" />
                          <span className="font-bold text-ink">{category.name}</span>
                        </div>
                      </td>
                      <td className={`${ADMIN_TABLE.td} whitespace-nowrap font-mono text-[13px]`}>/{category.slug}</td>
                      <td className={ADMIN_TABLE.td}>
                        <span className="line-clamp-2 max-w-[360px]">{category.description || '—'}</span>
                      </td>
                      <td className={`${ADMIN_TABLE.td} whitespace-nowrap text-right tabular-nums`}>
                        <Link href="/admin/products" className={`rounded-sm font-bold text-ink hover:text-brand ${FOCUS_RING}`}>
                          {category.productCount}
                        </Link>
                        {drafts > 0 && <span className="ml-1 text-[12px] text-ink-3">+{drafts} draft{drafts === 1 ? '' : 's'}</span>}
                      </td>
                      <td className={`${ADMIN_TABLE.td} whitespace-nowrap text-right`}>
                        <button type="button" className={ROW_ACTION} aria-label={`Edit ${category.name}`} onClick={() => openEditor(category)}>
                          Edit
                        </button>
                        <button type="button" className={ROW_ACTION_DANGER} aria-label={`Delete ${category.name}`} onClick={() => setPendingDelete(category)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <Modal
        open={editor !== null}
        onClose={() => setEditor(null)}
        closeOnOutsideClick={false}
        title={editor?.category ? 'Edit category' : 'Add category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              {editor?.category ? 'Save changes' : 'Create category'}
            </Button>
          </>
        }
      >
        {editor && (
          <form id={formId} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {formError && (
              <p role="alert" className="rounded-sm border border-brand/30 bg-brand-light px-3 py-2 text-[13px] font-bold text-brand">
                {formError}
              </p>
            )}
            <Input
              id="category-name"
              label="Name"
              required
              value={editor.input.name}
              onChange={(event) => patchInput({ name: event.target.value }, 'name')}
              error={errors.name}
            />
            <Input
              id="category-slug"
              label="Slug"
              hint={
                editor.category
                  ? 'Changing the slug changes the category URL.'
                  : 'Generated from the name. Edit it to choose your own URL.'
              }
              value={editor.slug}
              onChange={(event) => {
                setEditor({ ...editor, slug: event.target.value, slugTouched: true });
                if (errors.slug) setErrors((current) => ({ ...current, slug: undefined }));
              }}
              onBlur={() => setEditor({ ...editor, slug: slugify(editor.slug), slugTouched: editor.slug.trim() !== '' && editor.slugTouched })}
              error={errors.slug}
            />
            <Textarea
              id="category-description"
              label="Description"
              rows={3}
              value={editor.input.description}
              onChange={(event) => patchInput({ description: event.target.value }, 'description')}
              error={errors.description}
            />
            <div className="flex items-start gap-3">
              <AdminThumb url={imageUrl} alt="Category image preview" size={72} />
              <Input
                id="category-image"
                label="Image URL"
                type="url"
                inputMode="url"
                placeholder="https://images.unsplash.com/photo-…"
                hint="Optional. Only images.unsplash.com URLs are supported."
                value={editor.input.imageUrl}
                onChange={(event) => patchInput({ imageUrl: event.target.value }, 'imageUrl')}
                error={errors.imageUrl ?? (imageInvalid ? IMAGE_URL_HINT : null)}
                wrapperClassName="min-w-0 flex-1"
              />
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        size="sm"
        title="Delete category?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          <strong className="text-ink">{pendingDelete?.name}</strong> will be removed from the store navigation. Categories that still contain
          products cannot be deleted.
        </p>
      </Modal>
    </AdminPage>
  );
}

export default CategoriesManager;
