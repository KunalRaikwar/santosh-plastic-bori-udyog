import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/', label: '🏠 डैशबोर्ड', icon: '🏠' },
  { path: '/purchases', label: '📦 माल खरीदी', icon: '📦' },
  { path: '/sales', label: '🛒 माल बिक्री', icon: '🛒' },
  { path: '/stock', label: '📋 स्टॉक', icon: '📋' },
  { path: '/customers', label: '👥 ग्राहक', icon: '👥' },
  { path: '/suppliers', label: '🏭 सप्लायर', icon: '🏭' },
  { path: '/payments', label: '💰 भुगतान', icon: '💰' },
  { path: '/ledger', label: '📒 हिसाब', icon: '📒' },
  { path: '/workers', label: '👷 कर्मचारी', icon: '👷' },
  { path: '/expenses', label: '🚚 खर्चा', icon: '🚚' },
  { path: '/profit-loss', label: '📊 लाभ / हानि', icon: '📊' },
  { path: '/reports', label: '📈 रिपोर्ट', icon: '📈' },
  { path: '/bills', label: '🧾 बिल', icon: '🧾' },
  { path: '/settings', label: '⚙️ सेटिंग्स', icon: '⚙️' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-lg font-bold text-primary leading-tight">Santosh Plastic<br/>Bori Udyog</h1>
            <p className="text-xs text-gray-400 mt-1">व्यापार प्रबंधन</p>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto py-2">
            {menuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-2.5 mx-2 my-0.5 rounded-lg text-sm transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3 text-base">{item.icon}</span>
                {item.label.replace(item.icon + ' ', '')}
              </Link>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{user?.name || 'Owner'}</p>
                <p className="text-xs text-gray-400">{user?.role === 'owner' ? 'मालिक' : 'स्टाफ'}</p>
              </div>
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-danger px-2 py-1 rounded">
                लॉगआउट
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:px-6 no-print sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <p className="text-sm text-gray-500 hidden sm:block">
            {new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
