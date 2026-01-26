import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboardData } from '../../utils/api';
import { toast } from 'react-toastify';
import { UsersIcon, FileText, MessageSquare, Tag, Folder, UserPlus, Eye, Heart, TrendingUp, Clock, AlertTriangle, UserX, BarChart2, List, ThumbsUp } from 'lucide-react';
import { AdminDashboardData } from '../../types/Admin';
import { useAuth } from '../../hooks/useAuth.ts';
import SkeletonLoader from '../../components/SkeletonLoader';
import ErrorBoundary from '../../components/ErrorBoundary';

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    return 'Invalid Date';
  }
};

// Safe array access helper
const safeArray = <T,>(arr: T[] | undefined | null): T[] => {
  return Array.isArray(arr) ? arr : [];
};

// Safe value access helper
const safeValue = (value: any, fallback: any = 'N/A') => {
  return value !== undefined && value !== null ? value : fallback;
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
      <div className="p-3 sm:p-4 md:p-8">
        {/* Title Skeleton */}
        <SkeletonLoader className="h-6 sm:h-8 w-48 sm:w-72 mb-4 sm:mb-6" />

        {/* Overview Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <SkeletonLoader className="h-3 sm:h-4 w-16 sm:w-24 mb-2" />
                  <SkeletonLoader className="h-4 sm:h-6 w-12 sm:w-16" />
                </div>
                <SkeletonLoader className="h-8 w-8 sm:h-12 sm:w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Lists Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, listIndex) => (
            <div key={listIndex} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6">
              <SkeletonLoader className="h-5 sm:h-6 w-32 sm:w-48 mb-3 sm:mb-4" /> {/* List Title */}
              <ul className="space-y-3">
                {[...Array(5)].map((_, itemIndex) => (
                  <li key={itemIndex} className="flex justify-between items-center">
                    <SkeletonLoader className="h-3 sm:h-4 w-3/4" />
                    <SkeletonLoader className="h-3 sm:h-4 w-1/4" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        No dashboard data available.
      </div>
    );
  }

  const overviewCards = [
    {
      title: 'Total Visitors',
      value: safeValue(dashboardData.total_visitors, 0),
      icon: <UsersIcon className="h-full w-full text-white" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Articles',
      value: safeValue(dashboardData.total_articles, 0),
      icon: <FileText className="h-full w-full text-white" />,
      color: 'bg-green-500',
    },
    {
      title: 'Total Comments',
      value: safeValue(dashboardData.total_comments, 0),
      icon: <MessageSquare className="h-full w-full text-white" />,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Categories',
      value: safeValue(dashboardData.total_categories, 0),
      icon: <Folder className="h-full w-full text-white" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Tags',
      value: safeValue(dashboardData.total_tags, 0),
      icon: <Tag className="h-full w-full text-white" />,
      color: 'bg-red-500',
    },
    {
      title: 'Weekly Visits',
      value: safeValue(dashboardData.weekly_visits, 0),
      icon: <TrendingUp className="h-full w-full text-white" />,
      color: 'bg-indigo-500',
    },
    {
      title: 'Articles This Week',
      value: safeValue(dashboardData.articles_this_week, 0),
      icon: <FileText className="h-full w-full text-white" />,
      color: 'bg-teal-500',
    },
    {
      title: 'Comments This Week',
      value: safeValue(dashboardData.comments_this_week, 0),
      icon: <MessageSquare className="h-full w-full text-white" />,
      color: 'bg-orange-500',
    },
    {
      title: 'Pending Comments',
      value: safeValue(dashboardData.pending_comments, 0),
      icon: <Clock className="h-full w-full text-white" />,
      color: 'bg-pink-500',
    },
    {
      title: 'Flagged Comments',
      value: safeValue(dashboardData.flagged_comments, 0),
      icon: <AlertTriangle className="h-full w-full text-white" />,
      color: 'bg-red-600',
    },
    {
      title: 'Inactive Users',
      value: safeValue(dashboardData.inactive_users, 0),
      icon: <UserX className="h-full w-full text-white" />,
      color: 'bg-gray-600',
    },
    {
      title: 'Avg Views/Article',
      value: dashboardData.avg_views_per_article ? dashboardData.avg_views_per_article.toFixed(2) : 'N/A',
      icon: <BarChart2 className="h-full w-full text-white" />,
      color: 'bg-cyan-500',
    },
    {
      title: 'Avg Comments/Article',
      value: dashboardData.avg_comments_per_article ? dashboardData.avg_comments_per_article.toFixed(2) : 'N/A',
      icon: <List className="h-full w-full text-white" />,
      color: 'bg-lime-500',
    },
  ];

  return (
    <ErrorBoundary>
      <div className="p-3 sm:p-4 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">Dashboard Overview</h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 mb-8">
          {overviewCards.map((card, index) => (
            <div key={index} className={`shadow-lg rounded-xl p-3 sm:p-6 text-white ${card.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm md:text-base font-semibold leading-tight">{card.title}</span>
                  <span className="text-lg sm:text-xl md:text-2xl font-bold mt-1">{card.value ?? 'N/A'}</span>
                </div>
                <div className="p-2 sm:p-4 bg-white bg-opacity-20 rounded-full flex-shrink-0">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8">
                    {React.cloneElement(card.icon, { className: "h-full w-full text-white" })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 flex items-center">
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-500" />
              Recently Registered Users
            </h3>
            <ul className="space-y-3">
              {safeArray(dashboardData.recently_registered_users).length > 0 ? (
                safeArray(dashboardData.recently_registered_users).map((user) => (
                  <li key={user.id} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between items-center">
                    <span className="truncate">{safeValue(user.username, 'Unknown')} ({safeValue(user.email, 'No email')})</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">{formatDate(user.date_joined)}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 dark:text-gray-400 italic">No recent users</li>
              )}
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 flex items-center">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-green-500" />
              Recent Articles
            </h3>
            <ul className="space-y-3">
              {safeArray(dashboardData.recent_articles).length > 0 ? (
                safeArray(dashboardData.recent_articles).map((article) => {
                  // Get author name - handle both string and object types
                  let authorName = 'Unknown';
                  if (typeof article.author === 'string') {
                    authorName = article.author;
                  } else if (article.author) {
                    authorName = `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim() || article.author.username || 'Unknown';
                  }
                  
                  return (
                    <li key={article.id} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between items-center">
                      <span className="truncate">{safeValue(article.title, 'Untitled')} by {authorName}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{formatDate(article.created_at)}</span>
                    </li>
                  );
                })
              ) : (
                <li className="text-sm text-gray-500 dark:text-gray-400 italic">No recent articles</li>
              )}
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-yellow-500" />
              Recent Comments
            </h3>
            <ul className="space-y-3">
              {safeArray(dashboardData.recent_comments).length > 0 ? (
                safeArray(dashboardData.recent_comments).map((comment) => {
                  // Get full name or fallback to username
                  const authorName = comment.author 
                    ? `${comment.author.first_name || ''} ${comment.author.last_name || ''}`.trim() || comment.author.username || 'Anonymous'
                    : 'Anonymous';
                  
                  return (
                    <li key={comment.id} className="text-sm text-gray-700 dark:text-gray-300">
                      <p className="truncate">"{safeValue(comment.content, 'No content')}"</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        on "{safeValue(comment.article?.title, 'Unknown article')}" by {authorName}
                      </p>
                    </li>
                  );
                })
              ) : (
                <li className="text-sm text-gray-500 dark:text-gray-400 italic">No recent comments</li>
              )}
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 flex items-center">
              <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-500" />
              Top Authors
            </h3>
            <ul className="space-y-3">
              {safeArray(dashboardData.top_authors).length > 0 ? (
                safeArray(dashboardData.top_authors).map((author) => {
                  // Get full name or fallback to username
                  const authorName = author 
                    ? `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.username || 'Unknown'
                    : 'Unknown';
                  
                  return (
                    <li key={author.id} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between items-center">
                      <span className="truncate">{authorName}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{safeValue(author.total_articles, 0)} articles</span>
                    </li>
                  );
                })
              ) : (
                <li className="text-sm text-gray-500 dark:text-gray-400 italic">No authors found</li>
              )}
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 flex items-center">
              <Eye className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-indigo-500" />
              Most Viewed Articles
            </h3>
            <ul className="space-y-3">
              {safeArray(dashboardData.most_viewed_articles).length > 0 ? (
                safeArray(dashboardData.most_viewed_articles).map((article) => (
                  <li key={article.id} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between items-center">
                    <span className="truncate">{safeValue(article.title, 'Untitled')}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center">
                      {safeValue(article.views, 0)} <Eye className="inline-block h-4 w-4 ml-1" />
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 dark:text-gray-400 italic">No articles found</li>
              )}
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 flex items-center">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-red-500" />
              Most Liked Articles
            </h3>
            <ul className="space-y-3">
              {safeArray(dashboardData.most_liked_articles).length > 0 ? (
                safeArray(dashboardData.most_liked_articles).map((article) => (
                  <li key={article.id} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between items-center">
                    <span className="truncate">{safeValue(article.title, 'Untitled')}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center">
                      {safeValue(article.likes, 0)} <ThumbsUp className="inline-block h-4 w-4 ml-1" />
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 dark:text-gray-400 italic">No articles found</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}