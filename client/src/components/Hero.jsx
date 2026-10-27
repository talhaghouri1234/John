import { Link } from 'react-router-dom';
import { ArrowUpRight, Layers3, CircleCheck, Sparkles, UtensilsCrossed } from 'lucide-react';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="hero-label">
          <span className="status-dot" />Restaurant Food Menu System
        </div>
        <h1>
          Fresh Flavors.
          <br />
          Perfect <em>Order.</em>
        </h1>
        <p>
          A complete Restaurant Food Menu Management System built with MongoDB, Express.js, React.js, and Node.js.
          Manage culinary categories, delicious dishes, and real-time menus with image uploads.
        </p>
        <div className="hero-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link className="button" to="/menu">
            Explore Food Menu <UtensilsCrossed size={17} />
          </Link>
          <Link className="button secondary" to="/login">
            Manager Sign In <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="hero-note">
          <ShieldMark />
          JWT Authentication &bull; Multer Image Uploads &bull; Mongoose ODM
        </div>
      </div>
      <div className="hero-visual" aria-label="Restaurant Food Menu Illustration">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="floating-note">
          <Sparkles size={16} /> Freshly prepared daily.
        </div>
        <div className="demo-window">
          <div className="demo-top">
            <span className="brand">
              <Layers3 size={19} />
              forma bistro
            </span>
            <span className="badge">FOOD MENU SYSTEM</span>
          </div>
          <div className="demo-heading">
            <small>Chef&apos;s Specials &bull; Today</small>
            <h3>Culinary Menu Highlights</h3>
          </div>
          <div className="demo-stats">
            <div>
              <span>Categories</span>
              <strong>10</strong>
            </div>
            <div>
              <span>Menu Dishes</span>
              <strong>12+</strong>
            </div>
            <div>
              <span>Rating</span>
              <strong>4.9★</strong>
            </div>
          </div>
          {[
            ['Prime Ribeye Steak', '$29.99 • USDA Prime (12oz)', '#e8eedf'],
            ['Wood-Fired Margherita', '$15.50 • Buffalo Mozzarella', '#f1ece0'],
            ['Molten Chocolate Cake', '$9.50 • Belgian Dark Chocolate', '#e6edef'],
          ].map(([name, detail, color]) => (
            <div className="demo-row" key={name}>
              <span style={{ background: color }}>
                <UtensilsCrossed size={18} />
              </span>
              <div>
                <strong>{name}</strong>
                <small>{detail}</small>
              </div>
              <ArrowUpRight size={14} />
            </div>
          ))}
        </div>
        <div className="floating-check">
          <CircleCheck size={22} />
          <div>
            Ready to order.<small>Browse our full food menu.</small>
          </div>
        </div>
        <span className="visual-caption">RESTAURANT FOOD MENU MANAGEMENT</span>
      </div>
    </section>
  );
}
function ShieldMark() {
  return <CircleCheck size={15} />;
}
