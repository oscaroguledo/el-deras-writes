import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTopFiveCategories } from '../utils/api';
import { Category } from '../types/Category';

export function CategoryList() {
  const [topCategories, setTopCategories] = useState<Category[]>([]);

  useEffect(() => {
    getTopFiveCategories()
      .then(data => setTopCategories(data))
      .catch(error => console.error('Failed to fetch top categories:', error));
  }, []);

  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <h3 className="text-lg font-serif font-medium text-gray-900 mb-4">
        Popular Categories
      </h3>
      <ul className="space-y-2">
        {topCategories.map(category => (
          <li key={category.id}>
            <Link to={`/?category=${category.name}`} className="text-gray-600 hover:text-gray-900 text-sm">
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
