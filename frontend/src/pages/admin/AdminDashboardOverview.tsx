import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboardData } from '../../utils/api';
import { checkAuthStatus } from '../../utils/auth';
import { toast } from 'react-toastify';
import { UsersIcon } from 'lucide-react';

export function AdminDashboardOverview() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const isAuthenticated = await checkAuthStatus();
        if (!isAuthenticated) {
          navigate('/admin');
          return;
        }
        const data = await getAdminDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch dashboard data');
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-serif font-medium text-gray-900 mb-4">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Total Visitors Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500">Total Visitors</dt>
              <dd className="text-3xl font-bold text-gray-900">
                {dashboardData?.total_visitors !== undefined ? dashboardData.total_visitors : 'Loading...'}
              </dd>
            </div>
          </div>
        </div>
        {/* Other overview cards can go here */}
      </div>

      {/* Display other dashboard data */}
      {dashboardData && (
        <div className="mt-8">
          <h2 className="text-2xl font-serif font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Recently Registered Users</h3>
              <ul>
                {dashboardData.recently_registered_users.map((user: any) => (
                  <li key={user.id} className="text-sm text-gray-700">
                    {user.username} ({user.email}) - {new Date(user.date_joined).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Articles</h3>
              <ul>
                {dashboardData.recent_articles.map((article: any) => (
                  <li key={article.id} className="text-sm text-gray-700">
                    {article.title} by {article.author__username} - {new Date(article.created_at).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Comments</h3>
              <ul>
                {dashboardData.recent_comments.map((comment: any) => (
                  <li key={comment.id} className="text-sm text-gray-700">
                    "{comment.content.substring(0, 50)}..." on "{comment.article__title}" by {comment.author__username} - {new Date(comment.created_at).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Categories</h3>
              <ul>
                {dashboardData.recent_categories.map((category: any) => (
                  <li key={category.id} className="text-sm text-gray-700">
                    {category.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Tags</h3>
              <ul>
                {dashboardData.recent_tags.map((tag: any) => (
                  <li key={tag.id} className="text-sm text-gray-700">
                    {tag.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
