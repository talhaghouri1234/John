import { Pencil, Trash2, UtensilsCrossed } from 'lucide-react';
import Pagination from './Pagination.jsx';

export default function FoodTable({
  foods,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  search,
  onSearch,
}) {
  return (
    <>
      {onSearch && (
        <div className="toolbar">
          <input
            aria-label="Search food items"
            placeholder="Search food items…"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Dish</th>
              <th>Category</th>
              <th>Price</th>
              <th>Description</th>
              <th>Status</th>
              {onEdit && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {foods.map((food) => (
              <tr key={food._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {food.image ? (
                      <img
                        src={food.image}
                        alt={food.name}
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '1px solid var(--border, #e2e8f0)',
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span
                        className="category-icon"
                        style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <UtensilsCrossed size={18} />
                      </span>
                    )}
                    <strong>{food.name}</strong>
                  </div>
                </td>
                <td>
                  <span className="badge">
                    {food.category?.name || 'Uncategorized'}
                  </span>
                </td>
                <td>
                  <strong style={{ color: 'var(--accent, #10b981)', fontSize: '1.05rem' }}>
                    ${Number(food.price).toFixed(2)}
                  </strong>
                </td>
                <td>
                  <span className="table-description">{food.description || '—'}</span>
                </td>
                <td>
                  <span className={`badge ${food.isAvailable ? '' : 'inactive'}`}>
                    {food.isAvailable ? 'Available' : 'Out of Stock'}
                  </span>
                </td>
                {onEdit && (
                  <td className="actions text-right">
                    <button
                      className="icon-button"
                      aria-label={`Edit ${food.name}`}
                      onClick={() => onEdit(food)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Delete ${food.name}`}
                      onClick={() => onDelete(food)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {foods.length === 0 && (
          <div className="empty">
            <UtensilsCrossed size={30} className="mx-auto mb-3" />
            <h3>No food items found</h3>
            <p>Add delicious dishes to your restaurant menu.</p>
          </div>
        )}
      </div>
      {pagination && <Pagination pagination={pagination} onPageChange={onPageChange} />}
    </>
  );
}
