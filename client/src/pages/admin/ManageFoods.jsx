import { useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFoods, useFoodMutation } from '../../hooks/useFoods.js';
import { useCategories } from '../../hooks/useCategories.js';
import { errorMessage } from '../../api/axios.js';
import FoodTable from '../../components/FoodTable.jsx';
import FoodForm from '../../components/FoodForm.jsx';
import Modal from '../../components/Modal.jsx';
import Loader from '../../components/Loader.jsx';
import ErrorState from '../../components/ErrorState.jsx';

export default function ManageFoods() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const query = useFoods({
    page,
    limit: 8,
    search,
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(availabilityFilter ? { isAvailable: availabilityFilter } : {}),
  });

  const categoriesQuery = useCategories({ all: true });
  const categories = categoriesQuery.data?.categories || [];

  const create = useFoodMutation('create');
  const update = useFoodMutation('update');
  const remove = useFoodMutation('remove');

  const save = async (values) => {
    try {
      if (editor._id) {
        await update.mutateAsync({ id: editor._id, values });
      } else {
        await create.mutateAsync(values);
      }
      toast.success('Food item saved successfully');
      setEditor(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(deleting._id);
      toast.success('Food item deleted');
      setDeleting(null);
      if (query.data.foods.length === 1 && page > 1) setPage(page - 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Restaurant Food Menu</p>
          <h1>Food Items</h1>
          <p>Manage restaurant dishes, pricing, categories, and images.</p>
        </div>
        <button className="button" onClick={() => setEditor({})}>
          <Plus size={17} />
          New food item
        </button>
      </div>

      <section className="card">
        <div className="section-label">
          <h2>
            All food items <span className="muted">({query.data?.pagination.total ?? '…'})</span>
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              aria-label="Filter by category"
              className="w-auto"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter availability"
              className="w-auto"
              value={availabilityFilter}
              onChange={(e) => {
                setAvailabilityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All availability</option>
              <option value="true">Available</option>
              <option value="false">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="toolbar">
          <input
            aria-label="Search food items"
            placeholder="Search food items by name or description…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {query.isPending ? (
          <Loader />
        ) : query.isError ? (
          <ErrorState error={query.error} retry={query.refetch} />
        ) : (
          <FoodTable
            foods={query.data.foods}
            pagination={query.data.pagination}
            onPageChange={setPage}
            onEdit={setEditor}
            onDelete={setDeleting}
          />
        )}
      </section>

      {editor && (
        <Modal
          title={editor._id ? 'Edit food item' : 'New food item'}
          onClose={() => setEditor(null)}
          busy={create.isPending || update.isPending}
        >
          <FoodForm
            initialValues={editor}
            onSubmit={save}
            onCancel={() => setEditor(null)}
          />
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete food item?" onClose={() => setDeleting(null)} busy={remove.isPending}>
          <p>
            This will permanently delete <strong>{deleting.name}</strong> from the food menu. This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={remove.isPending}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
            <button className="button danger" disabled={remove.isPending} onClick={confirmDelete}>
              {remove.isPending ? 'Deleting…' : 'Delete food item'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
