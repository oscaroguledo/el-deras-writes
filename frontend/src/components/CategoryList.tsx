import { Link } from 'react-router-dom';
import { Category } from '../types/Category';

interface CategoryListProps {
  sections: Category[];
  activeSlug?: string | null;
}

/** Sidebar: each section with its sub-sections nested underneath. */
export function CategoryList({ sections, activeSlug }: CategoryListProps) {
  const link = (c: Category, className: string) => (
    <Link
      to={`/?category=${encodeURIComponent(c.slug)}`}
      className={`${className} ${activeSlug === c.slug ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'} hover:text-gray-900 dark:hover:text-gray-100`}
    >
      {c.name}
      {c.article_count > 0 && <span className="ml-1 text-xs text-gray-400">({c.article_count})</span>}
    </Link>
  );

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4">
      <h3 className="text-lg font-serif font-medium text-gray-900 dark:text-gray-100 mb-4">Browse</h3>
      <ul className="space-y-4">
        {sections.map(section => (
          <li key={section.id}>
            {link(section, 'text-sm font-medium')}
            {section.children.length > 0 && (
              <ul className="mt-2 ml-3 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-3">
                {section.children.map(child => (
                  <li key={child.id}>{link(child, 'text-sm')}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
