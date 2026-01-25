import React, { useEffect, useState, useCallback } from 'react';
import { Comment as CommentType } from '../types/Comment';
import { CommentForm } from './CommentForm';
import { Comment } from './Comment';
import { MessageCircleIcon } from 'lucide-react';
import { getCommentsByArticle, createComment } from '../utils/api';
import { toast } from 'react-toastify';
import SkeletonLoader from './SkeletonLoader';

interface CommentSectionProps {
  articleId: string;
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to count total comments including replies
  const countTotalComments = (comments: CommentType[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? countTotalComments(comment.replies) : 0);
    }, 0);
  };

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedComments = await getCommentsByArticle(articleId);
      // Comments are now properly nested by the backend serializer
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments.');
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCommentSubmit = async (newComment: {
    parentId?: string;
    content: string;
  }) => {
    try {
      await createComment(articleId, {
        content: newComment.content,
        parent: newComment.parentId,
      });
      toast.success('Comment posted successfully!');
      fetchComments(); // Refetch comments after posting
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment.');
    }
  };

  return (
    <section className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-serif font-medium text-gray-900 dark:text-gray-100 mb-6 flex items-center">
        <MessageCircleIcon className="h-6 w-6 mr-2" />
        Comments {comments.length > 0 && `(${countTotalComments(comments)})`}
      </h2>
      <CommentForm articleId={articleId} onCommentSubmit={handleCommentSubmit} />
      {loading ? (
        <div className="mt-8">
          {/* Comment Form Skeleton */}
          <SkeletonLoader className="h-24 w-full mb-4" />
          {/* Individual Comment Skeletons */}
          {[...Array(3)].map((_, index) => (
            <div key={index} className="mb-4">
              <SkeletonLoader className="h-6 w-32 mb-2" /> {/* Author */}
              <SkeletonLoader className="h-16 w-full" /> {/* Content */}
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="mt-8">
          {comments.map((comment) => (
            <Comment key={comment.id} comment={comment} onReply={handleCommentSubmit} articleId={articleId} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Be the first to leave a comment!</p>
        </div>
      )}
    </section>
  );
}