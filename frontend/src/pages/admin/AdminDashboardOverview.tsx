import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboardData } from '../../utils/api';
import { toast } from 'react-toastify';
import { UsersIcon, FileText, MessageSquare, Tag, Folder, UserPlus, Eye, Heart, TrendingUp, Clock, AlertTriangle, UserX, BarChart2, List, ThumbsUp } from 'lucide-react';
import { AdminDashboardData } from '../../types/Admin';
import { useAuth } from '../../hooks/useAuth.ts';
import { Article } from '../../types/Article.ts';
import { CustomUser } from '../../types/CustomUser.ts';
import { Comment } from '../../types/Comment.ts';
import { Category } from '../../types/Category.ts';
import { Tag as TagType } from '../../types/Tag.ts';

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    // Use Intl.DateTimeFormat for more consistent formatting
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    return 'Invalid Date';
  }
};

export default function AdminDashboardOverview() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAdminDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      title: 'Total Categories',
      value: dashboardData.total_categories,
      icon: <Folder className="h-8 w-8 text-white" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Tags',
      value: dashboardData.total_tags,
      icon: <Tag className="h-8 w-8 text-white" />,
      color: 'bg-red-500',
    },
    {
      title: 'Weekly Visits',
      value: dashboardData.weekly_visits,
      icon: <TrendingUp className="h-8 w-8 text-white" />,
      color: 'bg-indigo-500',
    },
    {
      title: 'Articles This Week',
      value: dashboardData.articles_this_week,
      icon: <FileText className="h-8 w-8 text-white" />,
      color: 'bg-teal-500',
    },
    {
      title: 'Comments This Week',
      value: dashboardData.comments_this_week,
      icon: <MessageSquare className="h-8 w-8 text-white" />,
      color: 'bg-orange-500',
    },
    {
      title: 'Pending Comments',
      value: dashboardData.pending_comments,
      icon: <Clock className="h-8 w-8 text-white" />,
      color: 'bg-pink-500',
    },
    {
      title: 'Flagged Comments',
      value: dashboardData.flagged_comments,
      icon: <AlertTriangle className="h-8 w-8 text-white" />,
      color: 'bg-red-600',
    },
    {
      title: 'Inactive Users',
      value: dashboardData.inactive_users,
      icon: <UserX className="h-8 w-8 text-white" />,
      color: 'bg-gray-600',
    },
    {
      title: 'Avg Views/Article',
      value: dashboardData.avg_views_per_article ? dashboardData.avg_views_per_article.toFixed(2) : 'N/A',
      icon: <BarChart2 className="h-8 w-8 text-white" />,
      color: 'bg-cyan-500',
    },
    {
      title: 'Avg Comments/Article',
      value: dashboardData.avg_comments_per_article ? dashboardData.avg_comments_per_article.toFixed(2) : 'N/A',
      icon: <List className="h-8 w-8 text-white" />,
      color: 'bg-lime-500',
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-serif font-medium text-gray-900 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {overviewCards.map((card, index) => (
          <div key={index} className={`shadow-lg rounded-xl p-6 text-white ${card.color}`}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-base font-semibold">{card.title}</span>
                <span className="text-2xl font-bold">{card.value ?? 'N/A'}</span>
              </div>
              <div className="p-4 bg-white bg-opacity-20 rounded-full">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <UserPlus className="h-6 w-6 mr-2 text-blue-500" />
            Recently Registered Users
          </h3>
          <ul className="space-y-3">
            {dashboardData.recently_registered_users.map((user) => (
              <li key={user.id} className="text-sm text-gray-700 flex justify-between items-center">
                <span className="truncate">{user.username} ({user.email})</span>
                <span className="text-gray-500 text-xs">{formatDate(user.date_joined)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-green-500" />
            Recent Articles
          </h3>
          <ul className="space-y-3">
            {dashboardData.recent_articles.map((article) => (
              <li key={article.id} className="text-sm text-gray-700 flex justify-between items-center">
                <span className="truncate">{article.title} by {article.author.username}</span>
                <span className="text-gray-500 text-xs">{formatDate(article.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <MessageSquare className="h-6 w-6 mr-2 text-yellow-500" />
            Recent Comments
          </h3>
          <ul className="space-y-3">
            {dashboardData.recent_comments.map((comment) => (
              <li key={comment.id} className="text-sm text-gray-700">
                <p className="truncate">"{comment.content}"</p>
                <p className="text-xs text-gray-500 truncate">on "{comment.article.title}" by {comment.author?.username || 'Anonymous'}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <UsersIcon className="h-6 w-6 mr-2 text-blue-500" />
            Top Authors
          </h3>
          <ul className="space-y-3">
            {dashboardData.top_authors.map((author) => (
              <li key={author.id} className="text-sm text-gray-700 flex justify-between items-center">
                <span className="truncate">{author.username}</span>
                <span className="text-gray-500 text-xs">{author.total_articles} articles</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Eye className="h-6 w-6 mr-2 text-indigo-500" />
            Most Viewed Articles
          </h3>
          <ul className="space-y-3">
            {dashboardData.most_viewed_articles.map((article) => (
              <li key={article.id} className="text-sm text-gray-700 flex justify-between items-center">
                <span className="truncate">{article.title}</span>
                <span className="text-gray-500 text-xs flex items-center">{article.views} <Eye className="inline-block h-4 w-4 ml-1" /></span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Heart className="h-6 w-6 mr-2 text-red-500" />
            Most Liked Articles
          </h3>
          <ul className="space-y-3">
            {dashboardData.most_liked_articles.map((article) => (
              <li key={article.id} className="text-sm text-gray-700 flex justify-between items-center">
                <span className="truncate">{article.title}</span>
                <span className="text-gray-500 text-xs flex items-center">{article.likes} <ThumbsUp className="inline-block h-4 w-4 ml-1" /></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}