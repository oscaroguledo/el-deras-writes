import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../types/Article';

interface BlogPostCardProps {
  post: Article;
}

export function BlogPostCard({
  post
}: BlogPostCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg transition-all duration-200 hover:shadow-md h-full">
      <Link to={`/article/${post.id}`} className="block overflow-hidden">
        <div className="aspect-w-16 aspect-h-9 bg-gray-100">
          <img src={post.image} alt={post.title} className="object-cover w-full h-full transition-transform duration-500 hover:scale-105" />
        </div>
      </Link>
      <div className="flex flex-col flex-grow p-5 bg-white">
        <div className="mb-3">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {post.category.name}
          </span>
        </div>
        <h3 className="text-xl font-serif font-medium text-gray-900 mb-2">
          <Link to={`/article/${post.id}`} className="hover:underline decoration-gray-300 underline-offset-2">
            {post.title}
          </Link>
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
          {post.excerpt}
        </p>
        <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
          {post.authorImage ? <img src={post.authorImage} alt={post.author.username} className="h-8 w-8 rounded-full" /> : <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
              {post.author && post.author.username.charAt(0).toUpperCase()}
            </div>}
          <div className="ml-3">
          <p className="text-sm text-gray-500">{post.author.username}</p>
            <p className="text-gray-500 text-xs">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}{' '}
              · {post.readTime || '5 min read'}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
