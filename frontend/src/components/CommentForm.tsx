import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { getCurrentUser, registerUser, isLoggedIn } from '../utils/commentAuth';
interface CommentFormProps {
  articleId: string;
  parentId?: string;
  onCommentSubmit: (comment: {
    articleId: string;
    parentId?: string;
    content: string;
    userName: string;
    userId: string;
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = getCurrentUser();
  const userLoggedIn = isLoggedIn();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    try {
      setIsSubmitting(true);
      let userId: string;
      let userName: string;
      if (userLoggedIn && currentUser) {
        // User is already logged in
        userId = currentUser.id;
        userName = currentUser.name;
      } else {
        // First-time commenter, need to register
        if (!name.trim() || !email.trim()) {
          toast.error('Please provide your name and email');
          setIsSubmitting(false);
          return;
        }
        // Register the user
        const newUser = registerUser(name, email);
        userId = newUser.id;
        userName = newUser.name;
        // Show password info
        toast.info(`Account created! Your password has been generated.`, {
          autoClose: 5000
        });
      }
      // Submit the comment
      onCommentSubmit({
        articleId,
        parentId,
        content,
        userName,
        userId
      });
      // Clear the form
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
  return <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      <div>
        <textarea placeholder={isReply ? 'Write a reply...' : 'Join the discussion...'} value={content} onChange={e => setContent(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" rows={isReply ? 3 : 4} required />
      </div>
      {!userLoggedIn && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required />
          </div>
          <div>
            <input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required />
          </div>
        </div>}
      <div className="flex justify-end space-x-2">
        {isReply && onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Cancel
          </button>}
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50">
          {isSubmitting ? 'Posting...' : isReply ? 'Reply' : 'Post Comment'}
        </button>
      </div>
      {userLoggedIn && currentUser && <div className="text-sm text-gray-600">
          Commenting as <span className="font-medium">{currentUser.name}</span>{' '}
          &middot;{' '}
          <button type="button" onClick={() => {
        localStorage.removeItem('el_deras_comment_user');
        window.location.reload();
      }} className="text-gray-900 underline">
            Not you?
          </button>
        </div>}
    </form>;
}