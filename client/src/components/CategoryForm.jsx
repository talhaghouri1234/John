import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X } from 'lucide-react';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(100),
  description: z.string().max(2000),
  image: z.union([
    z.literal(''),
    z
      .string()
      .trim()
      .refine(
        (value) => !value || value.startsWith('/') || /^https?:\/\//.test(value),
        'Use an HTTP or HTTPS URL or upload an image',
      ),
  ]),
  isActive: z.boolean(),
});

export default function CategoryForm({ initialValues, onSubmit, onCancel }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initialValues?.image || '');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      image: initialValues?.image || '',
      isActive: initialValues?.isActive ?? true,
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setValue('image', '');
    }
  };

  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const clearFile = () => {
    setFile(null);
    setValue('image', initialValues?.image || '');
    setPreview(initialValues?.image || '');
  };

  const handleFormSubmit = (values) => {
    if (file) {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('isActive', values.isActive);
      formData.append('image', file);
      return onSubmit(formData);
    } else {
      return onSubmit(values);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <div className="field">
        <label htmlFor="category-name">Category name</label>
        <input
          id="category-name"
          {...register('name')}
          placeholder="e.g. Appetizers, Main Course, Desserts"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <span className="field-error" role="alert">
            {errors.name.message}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="category-description">Description</label>
        <textarea
          id="category-description"
          {...register('description')}
          placeholder="Describe dishes in this category..."
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <span className="field-error" role="alert">
            {errors.description.message}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="category-image">Image URL (optional)</label>
        <input
          id="category-image"
          {...register('image')}
          placeholder="https://example.com/image.jpg"
          aria-invalid={!!errors.image}
          onChange={(e) => {
            setValue('image', e.target.value);
            if (!file) setPreview(e.target.value);
          }}
        />
        {errors.image && (
          <span className="field-error" role="alert">
            {errors.image.message}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="category-file-upload">Or upload category image</label>
        <div className="file-upload-box" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
          <label className="button secondary small" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={15} /> Choose image file
            <input
              id="category-file-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
          {file && (
            <span style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              {file.name}
              <button type="button" onClick={clearFile} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={14} />
              </button>
            </span>
          )}
        </div>
        {preview && (
          <div style={{ marginTop: '0.5rem', width: '100%', maxHeight: '140px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border, #e2e8f0)' }}>
            <img
              src={preview}
              alt="Category Preview"
              style={{ width: '100%', height: '140px', objectFit: 'cover' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      <label className="checkbox">
        <input type="checkbox" {...register('isActive')} />
        Active category
      </label>

      <div className="modal-actions">
        <button
          type="button"
          className="button secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button className="button" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save category'}
        </button>
      </div>
    </form>
  );
}
