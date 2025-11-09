import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getComments } from '../../utils/api'; // Adjusted import path
import { checkAuthStatus } from '../../utils/auth'; // Adjusted import path
import { toast } from 'react-toastify';
import { Comment } from '../../types/Comment'; // Adjusted import path

export function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchComments = async () => {
    try {
      const isAuthenticated = await checkAuthStatus();
      if (!isAuthenticated) {
        navigate('/admin');
        return;
      }
      const commentsData = await getComments();
      setComments(commentsData);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch comments');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [navigate]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-serif font-medium text-gray-900 mb-4">Manage Comments</h1>
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