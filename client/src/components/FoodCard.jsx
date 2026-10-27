import { motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';

export default function FoodCard({ food }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ y: -4 }}
      className="card food-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        padding: 0,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '180px',
          background: 'var(--surface-raised, #f1f5f9)',
          overflow: 'hidden',
        }}
      >
        {food.image ? (
          <img
            src={food.image}
            alt={food.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              color: 'var(--muted, #94a3b8)',
            }}
          >
            <UtensilsCrossed size={48} strokeWidth={1.2} />
          </div>
        )}
        <span
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            background: 'rgba(0, 0, 0, 0.75)',
            color: '#fff',
            padding: '0.25rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
          }}
        >
          ${Number(food.price).toFixed(2)}
        </span>
        {food.category?.name && (
          <span
            style={{
              position: 'absolute',
              bottom: '0.75rem',
              left: '0.75rem',
              background: 'var(--surface, #ffffff)',
              color: 'var(--foreground, #0f172a)',
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {food.category.name}
          </span>
        )}
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{food.name}</h3>
          <span className={`badge ${food.isAvailable ? '' : 'inactive'}`} style={{ fontSize: '0.7rem' }}>
            {food.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted, #64748b)', lineHeight: '1.45', flexGrow: 1 }}>
          {food.description || 'Prepared fresh with premium ingredients by our culinary team.'}
        </p>
      </div>
    </motion.article>
  );
}
