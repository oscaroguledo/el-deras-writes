import React, { useEffect, useState } from 'react';
import { Comment as CommentType } from '../types/Comment';
import { CommentForm } from './CommentForm';
import { Comment } from './Comment';
import { MessageCircleIcon } from 'lucide-react';
interface CommentSectionProps {
  articleId: string;
}
export function CommentSection({
  articleId
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Load comments from localStorage
    const loadComments = () => {
      setLoading(true);
      try {
        const savedComments = localStorage.getItem(`article_comments_${articleId}`);
        const parsedComments = savedComments ? JSON.parse(savedComments) : [];
        // Organize comments into a hierarchy
        const commentMap = new Map<string, CommentType>();
        const topLevelComments: CommentType[] = [];
        // First pass: create a map of all comments by ID
        parsedComments.forEach((comment: CommentType) => {
          commentMap.set(comment.id, {
            ...comment,
            replies: []
          });
        });
        // Second pass: organize into parent-child relationships
        parsedComments.forEach((comment: CommentType) => {
          const commentWithReplies = commentMap.get(comment.id)!;
          if (comment.parentId && commentMap.has(comment.parentId)) {
            // This is a reply, add it to its parent's replies
            const parent = commentMap.get(comment.parentId)!;
            parent.replies = [...(parent.replies || []), commentWithReplies];
          } else {
            // This is a top-level comment
            topLevelComments.push(commentWithReplies);
          }
        });
        setComments(topLevelComments);
      } catch (error) {
        console.error('Error loading comments:', error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };
    loadComments();
  }, [articleId]);
  const handleCommentSubmit = (newComment: {
    articleId: string;
    parentId?: string;
    content: string;
    userName: string;
    userId: string;
  }) => {
    // Create a new comment object
    const comment: CommentType = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      articleId: newComment.articleId,
      parentId: newComment.parentId,
      userId: newComment.userId,
      userName: newComment.userName,
      content: newComment.content,
      createdAt: new Date().toISOString()
    };
    // Save to localStorage (flat structure for storage)
    const savedComments = localStorage.getItem(`article_comments_${articleId}`);
    const allComments = savedComments ? JSON.parse(savedComments) : [];
    const updatedComments = [...allComments, comment];
    localStorage.setItem(`article_comments_${articleId}`, JSON.stringify(updatedComments));
    // Update state (hierarchical structure for display)
    if (comment.parentId) {
      // This is a reply, need to find the parent and add it
      const updateCommentsWithReply = (comments: CommentType[]): CommentType[] => {
        return comments.map(c => {
          if (c.id === comment.parentId) {
            // Found the parent, add this reply
            return {
              ...c,
              replies: [...(c.replies || []), comment]
            };
          } else if (c.replies && c.replies.length > 0) {
            // Check in the replies
            return {
              ...c,
              replies: updateCommentsWithReply(c.replies)
            };
          }
          return c;
        });
      };
      setComments(updateCommentsWithReply(comments));
    } else {
      // Top-level comment, just add it to the list
      setComments([...comments, {
        ...comment,
        replies: []
      }]);
    }
  };
  return <section className="mt-12 pt-8 border-t border-gray-100">
      <h2 className="text-2xl font-serif font-medium text-gray-900 mb-6 flex items-center">
        <MessageCircleIcon className="h-6 w-6 mr-2" />
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>
      <CommentForm articleId={articleId} onCommentSubmit={handleCommentSubmit} />
      {loading ? <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div> : comments.length > 0 ? <div className="mt-8">
          {comments.map(comment => <Comment key={comment.id} comment={comment} onReply={handleCommentSubmit} />)}
        </div> : <div className="text-center py-8 text-gray-500">
          <p>Be the first to leave a comment!</p>
        </div>}
    </section>;
}