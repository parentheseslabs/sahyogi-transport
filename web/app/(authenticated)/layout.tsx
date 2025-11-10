'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  LayoutDashboard,
  Users,
  Truck,
  FileText,
  Receipt,
  Menu,
  X,
  LogOut,
  Mail,
  Settings,
  ShoppingCart,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  createdAt: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/leads', icon: Users },
    { name: 'Brokers', href: '/brokers', icon: Truck },
    { name: 'Customer Enquiries', href: '/enquiries', icon: FileText },
    { name: 'Transport Rate Enquiries', href: '/transport-broker-rate-enquiries', icon: Mail },
    { name: 'Truck Orders', href: '/transport-orders', icon: ShoppingCart },
    { name: 'Customer Orders', href: '/customer-orders', icon: Package },
    { name: 'Quotes', href: '/quotes', icon: Receipt },
    { name: 'Admin', href: '/admin/add-dummy-data', icon: Settings },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="bg-black text-white h-12 flex-shrink-0 shadow-lg">
        <div className="px-3 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 hover:bg-gray-800 rounded transition-colors"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-white text-black p-1 rounded">
                <Truck size={16} />
              </div>
              <span className="font-semibold text-sm">Sahyogi Transport</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5">
              <Mail size={14} />
              <span className="text-xs">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded hover:bg-gray-200 transition-colors text-xs font-medium"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 top-12 bottom-0 z-40 bg-white border-r border-gray-200 flex-shrink-0
            transform transition-all duration-300 ease-in-out lg:transform-none
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${sidebarMinimized ? 'w-16' : 'w-48'}
          `}
        >
          {/* Minimize/Expand Button */}
          <div className="hidden lg:flex justify-end p-2 border-b border-gray-200">
            <button
              onClick={() => setSidebarMinimized(!sidebarMinimized)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={sidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
            >
              {sidebarMinimized ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <nav className={`space-y-0.5 h-full overflow-y-auto ${
            sidebarMinimized ? 'py-2' : 'p-2'
          }`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center rounded transition-colors text-sm font-medium ${
                    sidebarMinimized 
                      ? 'justify-center h-10 mx-2' 
                      : 'gap-2 px-3 py-2'
                  } ${
                    isActive 
                      ? 'bg-black text-white' 
                      : 'text-black hover:bg-black hover:text-white'
                  }`}
                  title={sidebarMinimized ? item.name : undefined}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!sidebarMinimized && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 w-full">{children}</div>
        </main>
      </div>
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}
