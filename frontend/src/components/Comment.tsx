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
}
export function Comment({
  comment,
  onReply,
  articleId
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const formattedDate = new Date(comment.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const handleReply = (newComment: {
    articleId: string;
    parentId?: string;
    content: string;
  }) => {
    onReply(newComment);
    setIsReplying(false);
  };
  return <div className="mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
            {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
        <div className="flex-grow">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">
                {comment.author?.username || 'Unknown User'}
                {comment.author.user_type === 'guest' && comment.ip_address && (
                  <span className="text-xs text-gray-500 ml-2">
                    (IP: {comment.ip_address})
                  </span>
                )}
              </h4>
              <span className="text-xs text-gray-500">{formattedDate}</span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 text-justify">{comment.content}</p>
            </div>
            <div className="mt-2 flex justify-end">
              <button onClick={() => setIsReplying(!isReplying)} className="text-xs font-medium text-gray-700 hover:text-gray-900">
                {isReplying ? 'Cancel Reply' : 'Reply'}
              </button>
            </div>
          </div>
          {isReplying && <div className="mt-3">
              <CommentForm articleId={articleId} parentId={comment.id} onCommentSubmit={handleReply} isReply={true} onCancel={() => setIsReplying(false)} />
            </div>}
          {comment.replies && comment.replies.length > 0 && <div className="mt-4 pl-5 border-l-2 border-gray-100">
              {comment.replies.map(reply => <Comment key={reply.id} comment={reply} onReply={onReply} articleId={articleId} />)}
            </div>}
        </div>
      </div>
    </div>;
}