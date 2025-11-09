import React, { useEffect, useState, useCallback } from 'react';
import { Comment as CommentType } from '../types/Comment';
import { CommentForm } from './CommentForm';
import { Comment } from './Comment';
import { MessageCircleIcon } from 'lucide-react';
import { getCommentsByArticle, createComment } from '../utils/api';
import { toast } from 'react-toastify';

interface CommentSectionProps {
  articleId: string;
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedComments = await getCommentsByArticle(articleId);
      const commentMap = new Map<string, CommentType>();
      const topLevelComments: CommentType[] = [];

      fetchedComments.forEach((comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      fetchedComments.forEach((comment) => {
        if (comment.parent && commentMap.has(comment.parent)) {
          const parent = commentMap.get(comment.parent)!;
          parent.replies = [...(parent.replies || []), commentMap.get(comment.id)!];
        } else {
          topLevelComments.push(commentMap.get(comment.id)!);
        }
      });

      setComments(topLevelComments);
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
    articleId: string;
    parentId?: string;
    content: string;
  }) => {
    try {
      await createComment({
        article: newComment.articleId,
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
    <section className="mt-12 pt-8 border-t border-gray-100">
      <h2 className="text-2xl font-serif font-medium text-gray-900 mb-6 flex items-center">
        <MessageCircleIcon className="h-6 w-6 mr-2" />
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>
      <CommentForm articleId={articleId} onCommentSubmit={handleCommentSubmit} />
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="mt-8">
          {comments.map((comment) => (
            <Comment key={comment.id} comment={comment} onReply={handleCommentSubmit} articleId={articleId} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Be the first to leave a comment!</p>
        </div>
      )}
    </section>
  );
}