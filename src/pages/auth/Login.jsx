import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('All fields required');

    setLoading(true);
    try {
      // ✅ AuthContext.login now throws on error — this catch correctly fires.
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      // ✅ FIX: Your backend sends { msg: '...' } not { error: '...' }
      toast.error(err.response?.data?.msg || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-mark">T</div>
          <h1 className="auth-brand-name">TaskFlow</h1>
        </div>
        <p className="auth-tagline">Sign in to your workspace</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          <button className="btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/signup" className="auth-link">Create one</Link>
        </p>

        <div className="demo-creds">
          <span className="demo-label">Quick fill demo accounts</span>
          <div className="demo-rows">
            <button
              className="demo-fill"
              type="button"
              onClick={() => setForm({ email: 'admin@demo.com', password: 'password123' })}
            >
              Admin — admin@demo.com
            </button>
            <button
              className="demo-fill"
              type="button"
              onClick={() => setForm({ email: 'member@demo.com', password: 'password123' })}
            >
              Member — member@demo.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
