import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X } from 'lucide-react';
import { useCategories } from '../hooks/useCategories.js';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(120),
  price: z.preprocess((value) => value === '' ? undefined : Number(value), z.number({ error: 'Enter a valid price' }).finite().min(0, 'Price must be 0 or higher')),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().max(2000).optional().default(''),
  image: z.union([
    z.literal(''),
    z
      .string()
      .trim()
      .refine(
        (value) => !value || value.startsWith('/') || /^https?:\/\//.test(value),
        'Use an HTTP or HTTPS URL or upload an image',
      ),
  ]).optional().default(''),
  isAvailable: z.boolean().default(true),
});

export default function FoodForm({ initialValues, onSubmit, onCancel }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initialValues?.image || '');
  const { data: catData, isPending: catsLoading } = useCategories({ all: true });

  const categories = catData?.categories || [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name || '',
      price: initialValues?.price !== undefined ? initialValues.price : '',
      category: typeof initialValues?.category === 'object'
        ? initialValues.category?._id
        : initialValues?.category || '',
      description: initialValues?.description || '',
      image: initialValues?.image || '',
      isAvailable: initialValues?.isAvailable ?? true,
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
      formData.append('price', values.price);
      formData.append('category', values.category);
      formData.append('description', values.description || '');
      formData.append('isAvailable', values.isAvailable);
      formData.append('image', file);
      return onSubmit(formData);
    } else {
      return onSubmit(values);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <div className="field">
        <label htmlFor="food-name">Food item name *</label>
        <input
          id="food-name"
          {...register('name')}
          placeholder="e.g. Classic Cheeseburger, Margherita Pizza"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <span className="field-error" role="alert">
            {errors.name.message}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="field">
          <label htmlFor="food-category">Category *</label>
          <select
            id="food-category"
            {...register('category')}
            aria-invalid={!!errors.category}
            disabled={catsLoading}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="field-error" role="alert">
              {errors.category.message}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="food-price">Price ($) *</label>
          <input
            id="food-price"
            type="number"
            step="0.01"
            min="0"
            {...register('price')}
            placeholder="0.00"
            aria-invalid={!!errors.price}
          />
          {errors.price && (
            <span className="field-error" role="alert">
              {errors.price.message}
            </span>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor="food-description">Description</label>
        <textarea
          id="food-description"
          {...register('description')}
          placeholder="Ingredients, preparation details, allergens..."
          rows={3}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <span className="field-error" role="alert">
            {errors.description.message}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="food-image">Image URL (optional)</label>
        <input
          id="food-image"
          {...register('image')}
          placeholder="https://example.com/dish.jpg"
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
        <label htmlFor="food-file-upload">Upload food image</label>
        <div className="file-upload-box" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
          <label className="button secondary small" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={15} /> Upload dish photo
            <input
              id="food-file-upload"
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
          <div style={{ marginTop: '0.5rem', width: '100%', maxHeight: '150px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border, #e2e8f0)' }}>
            <img
              src={preview}
              alt="Food Preview"
              style={{ width: '100%', height: '150px', objectFit: 'cover' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      <label className="checkbox">
        <input type="checkbox" {...register('isAvailable')} />
        Available on restaurant menu
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
          {isSubmitting ? 'Saving…' : 'Save food item'}
        </button>
      </div>
    </form>
  );
}
