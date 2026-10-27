import { useState } from 'react';
import { UtensilsCrossed, Sparkles } from 'lucide-react';
import { useFoods } from '../../hooks/useFoods.js';
import { useCategories } from '../../hooks/useCategories.js';
import FoodCard from '../../components/FoodCard.jsx';
import Pagination from '../../components/Pagination.jsx';
import Loader from '../../components/Loader.jsx';
import ErrorState from '../../components/ErrorState.jsx';

export default function RestaurantMenu() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const foodsQuery = useFoods({
    page,
    limit: 9,
    search,
    isAvailable: true,
    ...(selectedCategory ? { category: selectedCategory } : {}),
  });

  const categoriesQuery = useCategories({ all: true, isActive: true }, true);
  const categories = categoriesQuery.data?.categories || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
          <Sparkles size={16} /> Culinary Excellence
        </p>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>Restaurant Food Menu</h1>
        <p style={{ color: 'var(--muted, #64748b)', maxWidth: '600px', margin: '0 auto' }}>
          Explore our handcrafted dishes made with fresh, locally sourced ingredients. Select a category below or search your favorite dish.
        </p>
      </div>

      {/* Category Filter Tabs */}
      {categoriesQuery.isError && <ErrorState error={categoriesQuery.error} retry={categoriesQuery.refetch} />}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: '2rem',
        }}
      >
        <button
          className={`button ${!selectedCategory ? '' : 'secondary'} small`}
          onClick={() => {
            setSelectedCategory('');
            setPage(1);
          }}
        >
          All Dishes
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            className={`button ${selectedCategory === cat._id ? '' : 'secondary'} small`}
            onClick={() => {
              setSelectedCategory(cat._id);
              setPage(1);
            }}
          >
            {cat.image && <img src={cat.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search Toolbar */}
      <div className="toolbar" style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        <input
          aria-label="Search restaurant menu"
          placeholder="Search by dish name, flavor, or ingredients…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Foods Grid */}
      {foodsQuery.isPending ? (
        <Loader />
      ) : foodsQuery.isError ? (
        <ErrorState error={foodsQuery.error} retry={foodsQuery.refetch} />
      ) : (
        <>
          {foodsQuery.data.foods.length ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              {foodsQuery.data.foods.map((food) => (
                <FoodCard key={food._id} food={food} />
              ))}
            </div>
          ) : (
            <div className="card empty" style={{ textAlign: 'center', padding: '3rem' }}>
              <UtensilsCrossed size={40} className="mx-auto mb-3" style={{ opacity: 0.5 }} />
              <h3>No culinary dishes found</h3>
              <p>Try searching for a different item or select another category.</p>
            </div>
          )}
          <Pagination pagination={foodsQuery.data.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
