import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboardData } from '../../utils/api';
import { toast } from 'react-toastify';
import { UsersIcon, FileText, MessageSquare, Tag, Folder, UserPlus } from 'lucide-react';
import { AdminDashboardData } from '../../types/Admin';
import { useAuth } from '../../hooks/useAuth';

export default function AdminDashboardOverview() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const isAuthenticated = await checkAuthStatus();
        if (!isAuthenticated) {
          toast.error('You must be logged in to view this page.');
          navigate('/admin');
          return;
        }
        const data = await getAdminDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to fetch dashboard data. Please try again later.');
        // Optional: navigate away or show a specific error message
        // navigate('/admin/error'); 
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, checkAuthStatus]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-gray-500">
        No dashboard data available.
      </div>
    );
  }

  const overviewCards = [
    {
      title: 'Total Visitors',
      value: dashboardData.total_visitors,
      icon: <UsersIcon className="h-8 w-8 text-white" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Articles',
      value: dashboardData.total_articles,
      icon: <FileText className="h-8 w-8 text-white" />,
      color: 'bg-green-500',
    },
    {
      title: 'Total Comments',
      value: dashboardData.total_comments,
      icon: <MessageSquare className="h-8 w-8 text-white" />,
      color: 'bg-yellow-500',
    },
    {
      title: 'Top Category',
      value: dashboardData.top_category,
      icon: <Folder className="h-8 w-8 text-white" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Most Used Tag',
      value: dashboardData.most_used_tag,
      icon: <Tag className="h-8 w-8 text-white" />,
      color: 'bg-red-500',
    },
    {
      title: 'New Users This Month',
      value: dashboardData.new_users_this_month,
      icon: <UserPlus className="h-8 w-8 text-white" />,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-serif font-medium text-gray-900 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {overviewCards.map((card, index) => (
          <div key={index} className={`shadow-lg rounded-xl p-6 text-white ${card.color}`}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-lg font-semibold">{card.title}</span>
                <span className="text-4xl font-bold">{card.value ?? 'N/A'}</span>
              </div>
              <div className="p-4 bg-white bg-opacity-20 rounded-full">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white shadow-lg rounded-xl p-6 col-span-1 lg:col-span-1 xl:col-span-1">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <UserPlus className="h-6 w-6 mr-2 text-blue-500" />
            Recently Registered Users
          </h3>
          <ul className="space-y-3">
            {dashboardData.recently_registered_users.map((user) => (
              <li key={user.id} className="text-sm text-gray-700 flex justify-between items-center">
                <span>{user.username} ({user.email})</span>
                <span className="text-gray-500 text-xs">{new Date(user.date_joined).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 col-span-1 lg:col-span-1 xl:col-span-1">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-green-500" />
            Recent Articles
          </h3>
          <ul className="space-y-3">
            {dashboardData.recent_articles.map((article) => (
              <li key={article.id} className="text-sm text-gray-700 flex justify-between items-center">
                <span>{article.title} by {article.author__username}</span>
                <span className="text-gray-500 text-xs">{new Date(article.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 col-span-1 lg:col-span-1 xl:col-span-1">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <MessageSquare className="h-6 w-6 mr-2 text-yellow-500" />
            Recent Comments
          </h3>
          <ul className="space-y-3">
            {dashboardData.recent_comments.map((comment) => (
              <li key={comment.id} className="text-sm text-gray-700">
                <p className="truncate">"{comment.content}"</p>
                <p className="text-xs text-gray-500">on "{comment.article__title}" by {comment.author__username}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}