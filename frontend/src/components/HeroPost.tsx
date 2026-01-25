import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../types/Article';
import { LazyImage } from './LazyImage';
interface HeroPostProps {
  post: Article;
}
export function HeroPost({
  post
}: HeroPostProps) {
  return <section className="mt-12 lg:mt-16">
      <article className="relative overflow-hidden rounded-xl">
        <div className="aspect-w-16 aspect-h-9 md:aspect-h-7 lg:aspect-h-5 h-96 md:h-80 lg:h-64">
          <LazyImage 
            src={post.image || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d'} 
            alt={post.title} 
            className="object-cover w-full h-full" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12">
          <div className="mb-3">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-white text-gray-900 rounded-full">
              Featured
            </span>
            {post.category && <span className="inline-block px-3 py-1 ml-2 text-xs font-medium bg-white text-gray-900 rounded-full">
                {post.category.name}
              </span>}
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-medium text-white mb-3">
            <Link to={`/article/${post._id}`} className="hover:underline">
              {post.title}
            </Link>
          </h2>
          <p className="text-white/80 text-base md:text-lg max-w-3xl mb-4 text-justify">
            {post.excerpt}
          </p>
          <div className="flex items-center">
            {post.authorImage ? (
              <LazyImage 
                src={post.authorImage} 
                alt={typeof post.author === 'string' ? post.author : post.author.username} 
                className="h-10 w-10 rounded-full border-2 border-white" 
              />
            ) : (
              <div className="h-10 w-10 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                {typeof post.author === 'string' ? post.author.charAt(0).toUpperCase() : post.author.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="ml-3">
              <p className="text-white font-medium">
                {typeof post.author === 'string' ? post.author : `${post.author.first_name} ${post.author.last_name}`}
              </p>
              <p className="text-white/70 text-sm">
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}{' '}
                · {post.formatted_read_time || '5 mins'}
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>;
}