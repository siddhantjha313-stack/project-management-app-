import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardStats } from '../services/api';

interface DashboardStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Welcome, {user?.name}! 👋</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="Total Tasks" value={stats?.total || 0} color="bg-blue-500" />
        <StatCard title="To Do" value={stats?.todo || 0} color="bg-gray-500" />
        <StatCard title="In Progress" value={stats?.inProgress || 0} color="bg-yellow-500" />
        <StatCard title="Completed" value={stats?.done || 0} color="bg-green-500" />
        <StatCard title="Overdue" value={stats?.overdue || 0} color="bg-red-500" />
      </div>

      <div className="mt-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Your Tasks</h2>
        {/* Task list component goes here */}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
  <div className={`${color} text-white p-6 rounded-lg shadow`}>
    <p className="text-sm opacity-75">{title}</p>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

export default Dashboard;