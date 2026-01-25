import React, { useState, useEffect } from 'react';
import { Comment as CommentType } from '../types/Comment';
import { CommentForm } from './CommentForm';
import { truncateText, getResponsiveTruncateLength } from '../utils/userUtils';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [truncateLength, setTruncateLength] = useState(200);
  
  // Update truncate length on window resize
  useEffect(() => {
    const updateTruncateLength = () => {
      setTruncateLength(getResponsiveTruncateLength());
    };
    
    updateTruncateLength();
    window.addEventListener('resize', updateTruncateLength);
    return () => window.removeEventListener('resize', updateTruncateLength);
  }, []);
  
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

  // Determine if content should be truncated based on length and screen size
  const shouldTruncate = comment.content.length > truncateLength;
  const displayContent = shouldTruncate && !isExpanded 
    ? truncateText(comment.content, truncateLength)
    : comment.content;

  // Responsive sizing based on depth
  const avatarSize = depth > 0 ? 'h-7 w-7' : 'h-8 w-8';
  const marginLeft = depth > 0 ? 'ml-4 sm:ml-6' : '';
  const paddingLeft = depth > 0 ? 'pl-2 sm:pl-3' : '';
  const borderLeft = depth > 0 ? 'border-l border-gray-200 dark:border-gray-600' : '';

  return (
    <div className={`mb-3 sm:mb-4 ${marginLeft} ${paddingLeft} ${borderLeft}`}>
      <div className="flex items-start space-x-2 sm:space-x-3">
        <div className="flex-shrink-0">
          <div className={`${avatarSize} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm text-xs sm:text-sm`}>
            {authorInitial}
          </div>
        </div>
        <div className="flex-grow min-w-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {authorName}
                </h4>
                {comment.author?.user_type === 'admin' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex-shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">{formattedDate}</span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words comment-content">
                {displayContent}
                {shouldTruncate && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium underline"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </p>
            </div>
            <div className="mt-2 flex justify-end">
              <button 
                onClick={() => setIsReplying(!isReplying)} 
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
            </div>
          </div>
          
          {isReplying && (
            <div className="mt-2">
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
            <div className="mt-2 sm:mt-3">
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