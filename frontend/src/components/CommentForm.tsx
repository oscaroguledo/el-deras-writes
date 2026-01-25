import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth.ts';

interface CommentFormProps {
  articleId: string;
  parentId?: string;
  onCommentSubmit: (comment: {
    parentId?: string;
    content: string;
  }) => void;
  isReply?: boolean;
  onCancel?: () => void;
}

export function CommentForm({
  parentId,
  onCommentSubmit,
  isReply = false,
  onCancel
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const userLoggedIn = isAuthenticated;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    try {
      setIsSubmitting(true);
      onCommentSubmit({
        parentId,
        content,
      });
      setContent('');
      if (isReply && onCancel) {
        onCancel();
      }
    } catch (error) {
      toast.error('Failed to post comment. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-2 sm:space-y-3 ${isReply ? 'mb-3' : 'mb-4 sm:mb-6'}`}>
      <div>
        <textarea
          placeholder={isReply ? 'Write a reply...' : 'Join the discussion...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-none ${
            isReply ? 'min-h-[60px] sm:min-h-[80px]' : 'min-h-[80px] sm:min-h-[100px]'
          }`}
          rows={isReply ? 2 : 3}
          required
        />
      </div>
      <div className="flex justify-end space-x-1.5 sm:space-x-2">
        {isReply && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 border border-transparent rounded-md hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Posting...' : isReply ? 'Reply' : 'Post Comment'}
        </button>
      </div>
      {userLoggedIn && user && (
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Commenting as <span className="font-medium">{user.username}</span>
        </div>
      )}
    </form>
  );
}