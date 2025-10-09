import React, { useEffect, useState, lazy } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRightIcon, SearchIcon, TagIcon } from 'lucide-react';
// Blog post type
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  author: {
    name: string;
    avatar: string;
  };
  category: string;
  tags: string[];
}
export const Blog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const tagFilter = searchParams.get('tag');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  // Blog categories
  const categories = ['All', 'Organic Farming', 'Sustainability', 'African Agriculture', 'Health & Wellness', 'Recipes', 'Community Impact'];
  // Popular tags
  const popularTags = ['Organic', 'Fair Trade', 'Skincare', 'Nutrition', 'Superfoods', 'Recipes', 'Sustainability', 'Farming', 'Natural', 'Vegan'];
  // Mock blog posts data
  const blogPosts: BlogPost[] = [{
    id: '1',
    title: 'The Benefits of Shea Butter for Skin and Hair',
    excerpt: 'Discover the amazing properties of raw, unrefined shea butter from West Africa and how it can transform your beauty routine.',
    content: '',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    date: 'August 15, 2023',
    author: {
      name: 'Sarah Johnson',
      avatar: 'https://randomuser.me/api/portraits/women/12.jpg'
    },
    category: 'Health & Wellness',
    tags: ['Skincare', 'Natural', 'Beauty']
  }, {
    id: '2',
    title: 'Sustainable Farming Practices in Ghana',
    excerpt: 'Learn about how our partner farms in Ghana are implementing sustainable farming practices to protect the environment.',
    content: '',
    image: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    date: 'July 28, 2023',
    author: {
      name: 'Michael Addo',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    category: 'Sustainability',
    tags: ['Farming', 'Sustainability', 'Organic']
  }, {
    id: '3',
    title: 'Moringa: The Miracle Tree of Africa',
    excerpt: 'Explore the nutritional benefits of moringa, known as the "miracle tree," and its potential to combat malnutrition.',
    content: '',
    image: 'https://images.unsplash.com/photo-1515362655824-9a74989f318e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    date: 'July 10, 2023',
    author: {
      name: 'Dr. Amina Diallo',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg'
    },
    category: 'Health & Wellness',
    tags: ['Nutrition', 'Superfoods']
  }, {
    id: '4',
    title: 'African Superfoods: Baobab and Its Amazing Benefits',
    excerpt: "Discover the powerful nutritional profile of baobab fruit and how it's becoming a global superfood sensation.",
    content: '',
    image: 'https://images.unsplash.com/photo-1611808786599-82da0b05969e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    date: 'June 22, 2023',
    author: {
      name: 'James Wilson',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg'
    },
    category: 'Health & Wellness',
    tags: ['Nutrition', 'Superfoods']
  }, {
    id: '5',
    title: 'Empowering Women Cooperatives in West Africa',
    excerpt: "How our partnership with women's cooperatives is creating economic opportunities and supporting communities.",
    content: '',
    image: 'https://images.unsplash.com/photo-1604881991720-f91add269bed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    date: 'June 5, 2023',
    author: {
      name: 'Fatima Nkosi',
      avatar: 'https://randomuser.me/api/portraits/women/22.jpg'
    },
    category: 'Community Impact',
    tags: ['Fair Trade', 'Community', 'Empowerment']
  }, {
    id: '6',
    title: 'Delicious Recipes Using African Ingredients',
    excerpt: 'Try these modern recipes incorporating traditional African ingredients for a nutritious and flavorful meal.',
    content: '',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    date: 'May 18, 2023',
    author: {
      name: 'Chef Kwame Osei',
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg'
    },
    category: 'Recipes',
    tags: ['Recipes', 'Cooking', 'Nutrition']
  }];
  // Filter blog posts based on category, tag, or search term
  const filteredPosts = blogPosts.filter(post => {
    let matches = true;
    if (categoryFilter && categoryFilter !== 'All') {
      matches = matches && post.category === categoryFilter;
    }
    if (tagFilter) {
      matches = matches && post.tags.includes(tagFilter);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = post.title.toLowerCase().includes(searchLower) || post.excerpt.toLowerCase().includes(searchLower) || post.category.toLowerCase().includes(searchLower) || post.tags.some(tag => tag.toLowerCase().includes(searchLower));
      matches = matches && matchesSearch;
    }
    return matches;
  });
  // Simulate loading
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [categoryFilter, tagFilter, searchTerm]);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The filtering is handled by the useEffect
  };
  const handleCategoryClick = (category: string) => {
    if (category === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    searchParams.delete('tag'); // Reset tag filter when changing category
    setSearchParams(searchParams);
  };
  const handleTagClick = (tag: string) => {
    searchParams.set('tag', tag);
    setSearchParams(searchParams);
  };
  return <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm">
        <Link to="/" className="text-gray-500 hover:text-primary dark:text-gray-400">
          Home
        </Link>
        <ChevronRightIcon size={16} className="mx-2" />
        <span className="text-main dark:text-white">Blog</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="lg:w-2/3">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-main dark:text-white mb-4">
              {categoryFilter ? `${categoryFilter} Articles` : 'Our Blog'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Discover insights about organic products, sustainable farming
              practices, and the rich agricultural heritage of Africa.
            </p>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(category => <button key={category} onClick={() => handleCategoryClick(category)} className={`px-4 py-2 rounded-full text-sm ${!categoryFilter && category === 'All' || categoryFilter === category ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {category}
              </button>)}
          </div>

          {/* Blog Posts */}
          {loading ? <div className="space-y-8">
              {[...Array(3)].map((_, index) => <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                      <div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </div>)}
            </div> : filteredPosts.length > 0 ? <div className="space-y-8">
              {filteredPosts.map(post => <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                  <Link to={`/blog/${post.id}`}>
                    <img src={post.image} alt={post.title} className="w-full h-64 object-cover hover:opacity-90 transition-opacity" loading="lazy" />
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center mb-3">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                        {post.category}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm ml-3">
                        {post.date}
                      </span>
                    </div>
                    <Link to={`/blog/${post.id}`}>
                      <h2 className="text-xl font-bold text-main dark:text-white mb-3 hover:text-primary dark:hover:text-primary-light transition-colors">
                        {post.title}
                      </h2>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full mr-3" loading="lazy" />
                        <div>
                          <p className="font-medium text-main dark:text-white">
                            {post.author.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Author
                          </p>
                        </div>
                      </div>
                      <Link to={`/blog/${post.id}`} className="text-primary hover:underline">
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>)}
            </div> : <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-main dark:text-white mb-2">
                No articles found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We couldn't find any articles matching your criteria.
              </p>
              <button onClick={() => {
            searchParams.delete('category');
            searchParams.delete('tag');
            setSearchParams(searchParams);
            setSearchTerm('');
          }} className="text-primary hover:underline">
                Clear all filters
              </button>
            </div>}
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/3">
          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-lg text-main dark:text-white mb-4">
              Search
            </h3>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input type="text" placeholder="Search articles..." className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <SearchIcon size={18} />
                </button>
              </div>
            </form>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-lg text-main dark:text-white mb-4">
              Categories
            </h3>
            <ul className="space-y-3">
              {categories.filter(cat => cat !== 'All').map(category => <li key={category}>
                    <button onClick={() => handleCategoryClick(category)} className="flex items-center justify-between w-full text-left hover:text-primary transition-colors">
                      <span className={`${categoryFilter === category ? 'text-primary font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                        {category}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {blogPosts.filter(post => post.category === category).length}
                      </span>
                    </button>
                  </li>)}
            </ul>
          </div>

          {/* Popular Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-lg text-main dark:text-white mb-4">
              Popular Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => <button key={tag} onClick={() => handleTagClick(tag)} className={`flex items-center px-3 py-1 rounded-full text-xs ${tagFilter === tag ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  <TagIcon size={12} className="mr-1" />
                  {tag}
                </button>)}
            </div>
          </div>

          {/* Recent Posts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-lg text-main dark:text-white mb-4">
              Recent Posts
            </h3>
            <div className="space-y-4">
              {blogPosts.slice(0, 3).map(post => <div key={post.id} className="flex">
                  <Link to={`/blog/${post.id}`} className="w-20 h-20 flex-shrink-0">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover rounded-md" loading="lazy" />
                  </Link>
                  <div className="ml-3">
                    <Link to={`/blog/${post.id}`}>
                      <h4 className="font-medium text-main dark:text-white hover:text-primary dark:hover:text-primary-light transition-colors text-sm">
                        {post.title}
                      </h4>
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {post.date}
                    </p>
                  </div>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Blog;