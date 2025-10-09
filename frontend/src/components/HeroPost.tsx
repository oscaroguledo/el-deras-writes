import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../types/Article';
interface HeroPostProps {
  post: Article;
}
export function HeroPost({
  post
}: HeroPostProps) {
  return <section className="mt-12 lg:mt-16">
      <article className="relative overflow-hidden rounded-xl">
        <div className="aspect-w-16 aspect-h-9 md:aspect-h-7 lg:aspect-h-5">
          <img src={post.image || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d'} alt={post.title} className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12">
          <div className="mb-3">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-white text-gray-900 rounded-full">
              Featured
            </span>
            {post.category && <span className="inline-block px-3 py-1 ml-2 text-xs font-medium bg-white text-gray-900 rounded-full">
                {post.category}
              </span>}
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-medium text-white mb-3">
            <Link to={`/article/${post._id}`} className="hover:underline">
              {post.title}
            </Link>
          </h2>
          <p className="text-white/80 text-base md:text-lg max-w-3xl mb-4">
            {post.excerpt}
          </p>
          <div className="flex items-center">
            {post.authorImage ? <img src={post.authorImage} alt={post.author} className="h-10 w-10 rounded-full border-2 border-white" /> : <div className="h-10 w-10 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                {post.author && post.author.charAt(0).toUpperCase()}
              </div>}
            <div className="ml-3">
              <p className="text-white font-medium">{post.author}</p>
              <p className="text-white/70 text-sm">
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
    </section>;
}