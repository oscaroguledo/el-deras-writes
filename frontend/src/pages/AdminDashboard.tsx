import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getArticles, deleteArticle, getComments, getCategories, getTags, getUsers } from '../utils/api';
import { checkAuthStatus, logout } from '../utils/auth';
import { toast } from 'react-toastify';
import { Article } from '../types/Article';
import { Comment } from '../types/Comment';
import { Category } from '../types/Category';
import { Tag } from '../types/Tag';
import { CustomUser } from '../types/CustomUser';
import { PlusIcon, EditIcon, TrashIcon, LogOutIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

export function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [users, setUsers] = useState<CustomUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const articlesPerPage = 10; // This should match the backend's page_size

  useEffect(() => {
    const verifyAuthAndFetchData = async () => {
      try {
        const isAuthenticated = await checkAuthStatus();
        if (!isAuthenticated) {
          navigate('/admin');
          return;
        }

        const [articlesResponse, commentsData, categoriesData, tagsData, usersData] = await Promise.all([
          getArticles({ page: currentPage, page_size: articlesPerPage }),
          getComments(),
          getCategories(),
          getTags(),
          getUsers(),
        ]);

        setArticles(articlesResponse.results);
        setTotalPages(Math.ceil(articlesResponse.count / articlesPerPage));
        setComments(commentsData);
        setCategories(categoriesData);
        setTags(tagsData);
        setUsers(usersData);
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch data');
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };
    verifyAuthAndFetchData();
  }, [navigate, currentPage]); // Depend on currentPage to refetch when page changes

  const handleDeleteArticle = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      try {
        setDeleting(id);
        await deleteArticle(id);
        setArticles(articles.filter(article => article._id !== id));
        toast.success('Article deleted successfully');
      } catch (error) {
        toast.error('Failed to delete article');
        console.error(error);
      } finally {
        setDeleting(null);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/admin');
    } catch (error) {
      toast.error('Failed to logout');
      console.error(error);
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>;
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Admin Dashboard
        </h1>
        <div className="flex space-x-4">
          <Link to="/admin/create" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            <PlusIcon className="h-4 w-4 mr-1" /> New Article
          </Link>
          <button onClick={handleLogout} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            <LogOutIcon className="h-4 w-4 mr-1" /> Logout
          </button>
        </div>
      </div>

      {/* Articles Section */}
      <h2 className="text-2xl font-serif font-medium text-gray-900 mb-4">Articles</h2>
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Author
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articles.length > 0 ? articles.map(article => (
              <tr key={article._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img className="h-10 w-10 rounded object-cover" src={article.image} alt="" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {article.title}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {article.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {article.author.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(article.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Link to={`/admin/edit/${article._id}`} className="text-indigo-600 hover:text-indigo-900">
                      <EditIcon className="h-5 w-5" />
                    </Link>
                    <button onClick={() => handleDeleteArticle(article._id)} disabled={deleting === article._id} className="text-red-600 hover:text-red-900 disabled:opacity-50">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No articles found. Create your first article!
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Pagination Controls */}
        <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t border-gray-200">
          <button onClick={handlePreviousPage} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <ChevronLeftIcon className="h-5 w-5" />
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Next
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Users Section */}
      <h2 className="text-2xl font-serif font-medium text-gray-900 mb-4">Users</h2>
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bio</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length > 0 ? users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.bio}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Categories Section */}
      <h2 className="text-2xl font-serif font-medium text-gray-900 mb-4">Categories</h2>
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length > 0 ? categories.map(category => (
              <tr key={category.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.name}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tags Section */}
      <h2 className="text-2xl font-serif font-medium text-gray-900 mb-4">Tags</h2>
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tags.length > 0 ? tags.map(tag => (
              <tr key={tag.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tag.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tag.name}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No tags found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Comments Section */}
      <h2 className="text-2xl font-serif font-medium text-gray-900 mb-4">Comments</h2>
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comments.length > 0 ? comments.map(comment => (
              <tr key={comment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comment.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comment.articleId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comment.userName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comment.content}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No comments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}