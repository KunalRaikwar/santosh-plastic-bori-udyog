import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi, forgotPassword as forgotPasswordApi } from '../api/api';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Forgot password form state
  const [forgotForm, setForgotForm] = useState({
    username: 'admin',
    securityPin: '123456',
    newPassword: '',
    confirmPassword: ''
  });
  const [forgotMsg, setForgotMsg] = useState({ type: '', text: '' });
  const [forgotLoading, setForgotLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('कृपया Username और Password दोनों दर्ज करें।');
      return;
    }
    setLoading(true);
    try {
      const res = await loginApi({ username, password });
      loginUser(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'गलत Username या Password।');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotMsg({ type: '', text: '' });

    if (!forgotForm.username.trim() || !forgotForm.newPassword) {
      setForgotMsg({ type: 'error', text: 'कृपया Username और नया Password दर्ज करें।' });
      return;
    }

    if (forgotForm.newPassword.length < 4) {
      setForgotMsg({ type: 'error', text: 'Password कम से कम 4 अक्षरों का होना चाहिए।' });
      return;
    }

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setForgotMsg({ type: 'error', text: 'नया पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खा रहे हैं।' });
      return;
    }

    setForgotLoading(true);
    try {
      const res = await forgotPasswordApi({
        username: forgotForm.username.trim(),
        securityPin: forgotForm.securityPin.trim(),
        newPassword: forgotForm.newPassword
      });
      setForgotMsg({ type: 'success', text: res.data.message || 'पासवर्ड सफलतापूर्वक बदल गया!' });
      setUsername(forgotForm.username);
      setPassword(forgotForm.newPassword);
      setTimeout(() => {
        setShowForgot(false);
        setForgotMsg({ type: '', text: '' });
        setForgotForm({ username: 'admin', securityPin: '123456', newPassword: '', confirmPassword: '' });
      }, 2000);
    } catch (err) {
      setForgotMsg({
        type: 'error',
        text: err.response?.data?.message || 'पासवर्ड बदलने में समस्या हुई।'
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 w-full max-w-md p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl text-2xl mb-3 shadow-2xs">
            🏢
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">
            Santosh Plastic<br />Bori Udyog
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">व्यापार व बिलिंग प्रबंधन प्रणाली</p>
        </div>

        {!showForgot ? (
          /* Normal Login Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                यूज़रनेम (Username)
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                placeholder="उदा: admin"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  पासवर्ड (Password)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setError('');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  पासवर्ड भूल गए?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                placeholder="••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-3 text-sm font-bold shadow-md rounded-xl transition"
            >
              {loading ? 'लॉगिन हो रहा है...' : 'लॉगिन करें (Login)'}
            </button>

            <div className="pt-2 text-center border-t border-gray-100">
              <p className="text-xs text-gray-500">
                डिफ़ॉल्ट लॉगिन: <strong className="text-gray-800">admin</strong> / <strong className="text-gray-800">admin123</strong>
              </p>
            </div>
          </form>
        ) : (
          /* Forgot / Reset Password View */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                🔑 पासवर्ड रीसेट करें
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setForgotMsg({ type: '', text: '' });
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                ✕ बंद करें
              </button>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  यूज़रनेम (Username) *
                </label>
                <input
                  type="text"
                  value={forgotForm.username}
                  onChange={e => setForgotForm({ ...forgotForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="admin"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  सिक्योरिटी पिन (Security PIN) *
                </label>
                <input
                  type="text"
                  value={forgotForm.securityPin}
                  onChange={e => setForgotForm({ ...forgotForm, securityPin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                  placeholder="123456"
                  required
                />
                <p className="text-2xs text-gray-400 mt-0.5">डिफ़ॉल्ट पिन: <strong>123456</strong></p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    नया पासवर्ड *
                  </label>
                  <input
                    type="password"
                    value={forgotForm.newPassword}
                    onChange={e => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="नया पासवर्ड"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    कन्फर्म पासवर्ड *
                  </label>
                  <input
                    type="password"
                    value={forgotForm.confirmPassword}
                    onChange={e => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="पुनः दर्ज करें"
                    required
                  />
                </div>
              </div>

              {forgotMsg.text && (
                <div
                  className={`p-2.5 text-xs font-medium rounded-lg border ${
                    forgotMsg.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {forgotMsg.type === 'success' ? '✓ ' : '⚠️ '}
                  {forgotMsg.text}
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotMsg({ type: '', text: '' });
                  }}
                  className="btn btn-outline flex-1 justify-center py-2.5 text-xs font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn btn-primary flex-1 justify-center py-2.5 text-xs font-bold"
                >
                  {forgotLoading ? 'बदल रहा है...' : '💾 पासवर्ड बदलें'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
