import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderOpen, Layers3, CircleCheck, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="hero-label">
          <span className="status-dot" />A calmer kind of workspace
        </div>
        <h1>
          Less scattered.
          <br />
          More <em>together.</em>
        </h1>
        <p>
          A thoughtful home for your team and everything you organize. Find clarity, make
          connections, and give your best ideas room to grow.
        </p>
        <div className="hero-actions">
          <Link className="button" to="/register">
            Make yourself at home <ArrowUpRight size={17} />
          </Link>
          <Link className="text-link" to="/login">
            Already a member? Sign in ↗
          </Link>
        </div>
        <div className="hero-note">
          <ShieldMark />
          Secure accounts. Thoughtful permissions. Yours to build on.
        </div>
      </div>
      <div className="hero-visual" aria-label="An organized workspace illustration">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="floating-note">
          <Sparkles size={16} /> A little more clarity.
        </div>
        <div className="demo-window">
          <div className="demo-top">
            <span className="brand">
              <Layers3 size={19} />
              forma
            </span>
            <span className="badge">YOUR WORKSPACE</span>
          </div>
          <div className="demo-heading">
            <small>Good morning, Alex</small>
            <h3>Everything in its place.</h3>
          </div>
          <div className="demo-stats">
            <div>
              <span>Categories</span>
              <strong>10</strong>
            </div>
            <div>
              <span>Team members</span>
              <strong>03</strong>
            </div>
            <div>
              <span>Possibilities</span>
              <strong>∞</strong>
            </div>
          </div>
          {[
            ['Books & ideas', 'A world worth exploring', '#e8eedf'],
            ['Home & living', 'Make room for the everyday', '#f1ece0'],
            ['Creative essentials', 'For your next big thing', '#e6edef'],
          ].map(([name, detail, color]) => (
            <div className="demo-row" key={name}>
              <span style={{ background: color }}>
                <FolderOpen size={20} />
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
            All together now.<small>Your next chapter starts here.</small>
          </div>
        </div>
        <span className="visual-caption">A PLACE FOR EVERYTHING THAT MATTERS</span>
      </div>
    </section>
  );
}
function ShieldMark() {
  return <CircleCheck size={15} />;
}
