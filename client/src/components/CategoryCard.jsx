import { FolderOpen, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
export default function CategoryCard({ category }) {
  return <motion.article layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ y: -3 }} className="card category-card">{category.image ? <img src={category.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="category-card-art"><FolderOpen size={35} strokeWidth={1.2} /><ArrowUpRight size={18} /></div>}<div className="category-card-title"><h3>{category.name}</h3><span className={`badge ${category.isActive ? '' : 'inactive'}`}>{category.isActive ? 'Active' : 'Inactive'}</span></div><p>{category.description || 'Explore what this category has to offer.'}</p></motion.article>;
}
