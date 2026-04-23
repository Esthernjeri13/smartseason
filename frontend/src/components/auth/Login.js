import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role) {
    if (role === 'admin') { setEmail('admin@smartseason.com'); setPassword('admin123'); }
    else { setEmail('james@smartseason.com'); setPassword('agent123'); }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-orb orb1" />
        <div className="auth-bg-orb orb2" />
        <div className="auth-grid" />
      </div>

      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="rgba(126,196,74,0.15)" />
              <path d="M18 8 C18 8 10 14 10 20 C10 24.4 13.6 28 18 28 C22.4 28 26 24.4 26 20 C26 14 18 8 18 8Z" fill="var(--accent-primary)" opacity="0.9"/>
              <path d="M18 12 C18 12 13 16.5 13 20 C13 22.8 15.2 25 18 25 C20.8 25 23 22.8 23 20 C23 16.5 18 12 18 12Z" fill="var(--bg-base)" opacity="0.6"/>
              <circle cx="18" cy="20" r="3" fill="var(--accent-primary)"/>
            </svg>
          </div>
          <h1 className="auth-title">SmartSeason</h1>
          <p className="auth-subtitle">Field Monitoring System</p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <h2 className="auth-card-title">Sign in</h2>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@smartseason.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign in'}
          </button>

          <div className="auth-divider"><span>Demo accounts</span></div>

          <div className="demo-btns">
            <button type="button" className="demo-btn" onClick={() => fillDemo('admin')}>
              <span className="demo-role admin">Admin</span>
              <span className="demo-cred">admin@smartseason.com</span>
            </button>
            <button type="button" className="demo-btn" onClick={() => fillDemo('agent')}>
              <span className="demo-role agent">Agent</span>
              <span className="demo-cred">james@smartseason.com</span>
            </button>
          </div>

          <p className="auth-footer">
            No account? <Link to="/register">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
