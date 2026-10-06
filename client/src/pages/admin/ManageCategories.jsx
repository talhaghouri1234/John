import { useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCategories, useCategoryMutation } from '../../hooks/useCategories.js';
import { errorMessage } from '../../api/axios.js';
import CategoryTable from '../../components/CategoryTable.jsx';
import CategoryForm from '../../components/CategoryForm.jsx';
import Modal from '../../components/Modal.jsx';
import Loader from '../../components/Loader.jsx';
import ErrorState from '../../components/ErrorState.jsx';

export default function ManageCategories() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const query = useCategories({ page, limit: 6, search, ...(filter ? { isActive: filter } : {}) });
  const create = useCategoryMutation('create');
  const update = useCategoryMutation('update');
  const remove = useCategoryMutation('remove');
  const save = async (values) => {
    try { if (editor._id) await update.mutateAsync({ id: editor._id, values }); else await create.mutateAsync(values); toast.success('Category saved'); setEditor(null); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  const confirmDelete = async () => {
    try { await remove.mutateAsync(deleting._id); toast.success('Category deleted'); setDeleting(null); if (query.data.categories.length === 1 && page > 1) setPage(page - 1); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  return <><div className="page-heading"><div><p className="eyebrow">A place for everything</p><h1>Categories</h1><p>Build a clear structure for everything you do.</p></div><button className="button" onClick={() => setEditor({})}><Plus size={17} />New category</button></div><section className="card"><div className="section-label"><h2>All categories <span className="muted">({query.data?.pagination.total ?? '…'})</span></h2><select aria-label="Filter category status" className="w-auto" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select></div><div className="toolbar"><input aria-label="Search categories" placeholder="Search categories…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div>{query.isPending ? <Loader /> : query.isError ? <ErrorState error={query.error} retry={query.refetch} /> : <CategoryTable categories={query.data.categories} pagination={query.data.pagination} onPageChange={setPage} onEdit={setEditor} onDelete={setDeleting} />}</section>{editor && <Modal title={editor._id ? 'Edit category' : 'New category'} onClose={() => setEditor(null)} busy={create.isPending || update.isPending}><CategoryForm initialValues={editor} onSubmit={save} onCancel={() => setEditor(null)} /></Modal>}{deleting && <Modal title="Delete category?" onClose={() => setDeleting(null)} busy={remove.isPending}><p>This will permanently delete <strong>{deleting.name}</strong>. This action cannot be undone.</p><div className="modal-actions"><button className="button secondary" disabled={remove.isPending} onClick={() => setDeleting(null)}>Cancel</button><button className="button danger" disabled={remove.isPending} onClick={confirmDelete}>{remove.isPending ? 'Deleting…' : 'Delete category'}</button></div></Modal>}</>;
}
