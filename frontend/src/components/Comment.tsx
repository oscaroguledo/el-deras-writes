import React, { useState } from 'react';
import { Comment as CommentType } from '../types/Comment';
import { CommentForm } from './CommentForm';

interface CommentProps {
  comment: CommentType;
  onReply: (comment: {
    articleId: string;
    parentId?: string;
    content: string;
  }) => void;
  articleId: string;
  depth?: number; // Track nesting depth
}

export function Comment({
  comment,
  onReply,
  articleId,
  depth = 0
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  
  const formattedDate = new Date(comment.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleReply = (newComment: {
    articleId: string;
    parentId?: string;
    content: string;
  }) => {
    onReply(newComment);
    setIsReplying(false);
  };

  // Get author display name
  const authorName = comment.author 
    ? `${comment.author.first_name} ${comment.author.last_name}`.trim() || comment.author.username
    : 'Anonymous';

  const authorInitial = comment.author 
    ? (comment.author.first_name?.charAt(0) || comment.author.username?.charAt(0) || 'A').toUpperCase()
    : 'A';

  return (
    <div className={`mb-6 ${depth > 0 ? 'ml-8 pl-4 border-l-2 border-gray-100 dark:border-gray-700' : ''}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm">
            {authorInitial}
          </div>
        </div>
        <div className="flex-grow">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {authorName}
                </h4>
                {comment.author?.user_type === 'admin' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{comment.content}</p>
            </div>
            <div className="mt-3 flex justify-end">
              <button 
                onClick={() => setIsReplying(!isReplying)} 
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
              >
                {isReplying ? 'Cancel Reply' : 'Reply'}
              </button>
            </div>
          </div>
          
          {isReplying && (
            <div className="mt-3">
              <CommentForm 
                articleId={articleId} 
                parentId={comment.id} 
                onCommentSubmit={handleReply} 
                isReply={true} 
                onCancel={() => setIsReplying(false)} 
              />
            </div>
          )}
          
          {/* Render nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              {comment.replies.map(reply => (
                <Comment 
                  key={reply.id} 
                  comment={reply} 
                  onReply={onReply} 
                  articleId={articleId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}