import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(100),
  description: z.string().max(2000),
  image: z.union([
    z.literal(''),
    z
      .string()
      .url('Enter a valid URL')
      .refine((value) => /^https?:\/\//.test(value), 'Use an HTTP or HTTPS URL'),
  ]),
  isActive: z.boolean(),
});

export default function CategoryForm({ initialValues, onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
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
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {['name', 'description', 'image'].map((field) => (
        <div className="field" key={field}>
          <label htmlFor={`category-${field}`}>
            {field === 'image'
              ? 'Image URL (optional)'
              : field === 'description'
                ? 'Description'
                : 'Category name'}
          </label>
          {field === 'description' ? (
            <textarea
              id={`category-${field}`}
              {...register(field)}
              aria-invalid={!!errors[field]}
            />
          ) : (
            <input id={`category-${field}`} {...register(field)} aria-invalid={!!errors[field]} />
          )}
          {errors[field] && (
            <span className="field-error" role="alert">
              {errors[field].message}
            </span>
          )}
        </div>
      ))}
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
