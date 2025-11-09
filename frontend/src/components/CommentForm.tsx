import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { getUser } from '../utils/auth';

interface CommentFormProps {
  articleId: string;
  parentId?: string;
  onCommentSubmit: (comment: {
    articleId: string;
    parentId?: string;
    content: string;
  }) => void;
  isReply?: boolean;
  onCancel?: () => void;
}

export function CommentForm({
  articleId,
  parentId,
  onCommentSubmit,
  isReply = false,
  onCancel
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = getUser();
  const userLoggedIn = !!user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    try {
      setIsSubmitting(true);
      onCommentSubmit({
        articleId,
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
    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      <div>
        <textarea
          placeholder={isReply ? 'Write a reply...' : 'Join the discussion...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          rows={isReply ? 3 : 4}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        {isReply && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Posting...' : isReply ? 'Reply' : 'Post Comment'}
        </button>
      </div>
      {userLoggedIn && user && (
        <div className="text-sm text-gray-600">
          Commenting as <span className="font-medium">{user.username}</span>
        </div>
      )}
    </form>
  );
}