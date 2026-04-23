import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
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
          <p className="auth-subtitle">Create your account</p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <h2 className="auth-card-title">New account</h2>

          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" required minLength={6} />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input form-select" name="role" value={form.role} onChange={handleChange}>
              <option value="agent">Field Agent</option>
              <option value="admin">Admin / Coordinator</option>
            </select>
          </div>

          <button className="btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create account'}
          </button>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
