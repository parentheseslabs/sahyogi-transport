'use client';

import { useEffect, useState } from 'react';
import { Users, Truck, FileText, Receipt, Plus, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
}

interface DashboardStats {
  totalLeads: number;
  activeBrokers: number;
  openEnquiries: number;
  pendingQuotes: number;
}

interface RecentActivity {
  id: number;
  type: 'lead' | 'enquiry' | 'quote' | 'transport';
  title: string;
  description: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    activeBrokers: 0,
    openEnquiries: 0,
    pendingQuotes: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch stats and recent activity in parallel
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('http://localhost:3001/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/dashboard/recent-activity?limit=8', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    {
      name: 'Total Leads',
      value: stats.totalLeads.toString(),
      icon: Users,
      color: 'bg-blue-500',
      link: '/leads',
    },
    {
      name: 'Active Brokers',
      value: stats.activeBrokers.toString(),
      icon: Truck,
      color: 'bg-green-500',
      link: '/brokers',
    },
    {
      name: 'Open Enquiries',
      value: stats.openEnquiries.toString(),
      icon: FileText,
      color: 'bg-yellow-500',
      link: '/enquiries',
    },
    {
      name: 'Pending Quotes',
      value: stats.pendingQuotes.toString(),
      icon: Receipt,
      color: 'bg-purple-500',
      link: '/quotes',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead': return Users;
      case 'enquiry': return FileText;
      case 'quote': return Receipt;
      case 'transport': return Truck;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lead': return 'bg-blue-100 text-blue-600';
      case 'enquiry': return 'bg-yellow-100 text-yellow-600';
      case 'quote': return 'bg-purple-100 text-purple-600';
      case 'transport': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <div>
        <h1 className="text-xl font-bold text-black">Dashboard</h1>
        <p className="text-black text-sm">
          Welcome back, {user?.email || 'User'}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {statsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              onClick={() => router.push(stat.link)}
              className="bg-white rounded border border-gray-200 p-3 hover:shadow hover:border-gray-300 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-black font-medium">{stat.name}</p>
                  <p className="text-2xl font-bold text-black mt-1">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-2 rounded text-white`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded border border-gray-200 p-3">
        <h2 className="text-base font-bold text-black mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button 
            onClick={() => router.push('/leads/new')}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-black text-white rounded text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={12} />
            Add Lead
          </button>
          <button 
            onClick={() => router.push('/brokers/new')}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-black text-white rounded text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={12} />
            Add Broker
          </button>
          <button 
            onClick={() => router.push('/enquiries/new')}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-black text-white rounded text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={12} />
            New Enquiry
          </button>
          <button 
            onClick={() => router.push('/transport-broker-rate-enquiries/new')}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-black text-white rounded text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={12} />
            Transport Enquiry
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded border border-gray-200 p-3">
        <h2 className="text-base font-bold text-black mb-3">Recent Activity</h2>
        {loading ? (
          <div className="text-center py-6 text-black">
            <Clock size={32} className="mx-auto mb-2 text-gray-400 animate-spin" />
            <p className="text-sm">Loading recent activity...</p>
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="text-center py-6 text-black">
            <FileText size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1 text-gray-500">Activities will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <div className={`p-1.5 rounded ${getActivityColor(activity.type)}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
            {recentActivity.length >= 8 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => router.push('/activity')}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  View all activity →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
