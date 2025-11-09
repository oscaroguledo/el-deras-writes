import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../types/Category';

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <h3 className="text-lg font-serif font-medium text-gray-900 mb-4">
        Popular Categories
      </h3>
      <ul className="space-y-2">
        {categories.map(category => (
          <li key={category.id}>
            <Link to={`/?category=${encodeURIComponent(category.name)}`} className="text-gray-600 hover:text-gray-900 text-sm">
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
