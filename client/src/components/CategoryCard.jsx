import { FolderOpen, ArrowUpRight } from 'lucide-react';
export default function CategoryCard({ category }) {
  return <article className="card category-card">{category.image ? <img src={category.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="category-card-art"><FolderOpen size={35} strokeWidth={1.2} /><ArrowUpRight size={18} /></div>}<div className="category-card-title"><h3>{category.name}</h3><span className={`badge ${category.isActive ? '' : 'inactive'}`}>{category.isActive ? 'Active' : 'Inactive'}</span></div><p>{category.description || 'Explore what this category has to offer.'}</p></article>;
}
