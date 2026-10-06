import { Link } from 'react-router-dom';
import { Category } from '../types/Category';

interface BrowseSectionsProps {
  sections: Category[];
}

/** Home page block: each section with its sub-sections as cards linking to the filtered list. */
export function BrowseSections({ sections }: BrowseSectionsProps) {
  if (sections.length === 0) return null;

  const to = (c: Category) => `/?category=${encodeURIComponent(c.slug)}`;

  return (
    <section aria-labelledby="browse-heading" className="mt-8 mb-10">
      <h2 id="browse-heading" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Browse
      </h2>
      <div className="space-y-6">
        {sections.map(section => (
          <div key={section.id}>
            <Link
              to={to(section)}
              className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:underline"
            >
              {section.name}
            </Link>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {section.children.map(child => (
                <Link
                  key={child.id}
                  to={to(child)}
                  className="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-gray-400 dark:hover:border-gray-500 transition"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">{child.name}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
