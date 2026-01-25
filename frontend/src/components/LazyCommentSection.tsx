import React, { useEffect, useState, useCallback } from 'react';
import { Comment as CommentType } from '../types/Comment';
import { CommentForm } from './CommentForm';
import { Comment } from './Comment';
import { LazyContent } from './LazyContent';
import SkeletonCommentCard from './SkeletonCommentCard';
import { MessageCircleIcon } from 'lucide-react';
import { getCommentsByArticle, createComment } from '../utils/api';
import { toast } from 'react-toastify';

interface LazyCommentSectionProps {
  articleId: string;
}

export function LazyCommentSection({ articleId }: LazyCommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Helper function to count total comments including replies
  const countTotalComments = (comments: CommentType[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? countTotalComments(comment.replies) : 0);
    }, 0);
  };

  const fetchComments = useCallback(async () => {
    if (hasLoaded) return; // Prevent multiple loads
    
    try {
      setLoading(true);
      const fetchedComments = await getCommentsByArticle(articleId);
      // Comments are already properly nested by the backend
      setComments(fetchedComments);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments.');
    } finally {
      setLoading(false);
    }
  }, [articleId, hasLoaded]);

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
      // Reset hasLoaded to allow refetch
      setHasLoaded(false);
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment.');
    }
  };

  const CommentSkeleton = () => (
    <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
      <div className="h-20 sm:h-24 bg-gray-100 rounded-lg animate-pulse"></div>
      {[...Array(3)].map((_, index) => (
        <SkeletonCommentCard key={index} />
      ))}
    </div>
  );

  const CommentContent = () => {
    // Trigger loading when component becomes visible
    useEffect(() => {
      fetchComments();
    }, [fetchComments]);

    if (loading) {
      return <CommentSkeleton />;
    }

    return (
      <div className="mt-6 sm:mt-8">
        <CommentForm articleId={articleId} onCommentSubmit={handleCommentSubmit} />
        {comments.length > 0 ? (
          <div className="mt-6 sm:mt-8 space-y-2 sm:space-y-3">
            {comments.map((comment) => (
              <LazyContent
                key={comment.id}
                fallback={<SkeletonCommentCard />}
                threshold={0.1}
                rootMargin="50px"
              >
                <Comment 
                  comment={comment} 
                  onReply={handleCommentSubmit} 
                  articleId={articleId} 
                />
              </LazyContent>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <p className="text-sm sm:text-base">Be the first to leave a comment!</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100">
      <h2 className="text-xl sm:text-2xl font-serif font-medium text-gray-900 mb-4 sm:mb-6 flex items-center">
        <MessageCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
        Comments {comments.length > 0 && `(${countTotalComments(comments)})`}
      </h2>
      
      <LazyContent
        fallback={<CommentSkeleton />}
        threshold={0.1}
        rootMargin="100px"
        triggerOnce={true}
      >
        <CommentContent />
      </LazyContent>
    </section>
  );
}