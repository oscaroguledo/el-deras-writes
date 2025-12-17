import React, { useState } from 'react';
import { useArticles } from '../hooks/useArticles';
import { useAuth } from '../hooks/useAuth';
import { useDatabaseContext } from '../contexts/DatabaseContext';


const BlogExample: React.FC = () => {
  const { database, isInitialized, isLoading, error } = useDatabaseContext();
  const { articles, loading: articlesLoading, createArticle, deleteArticle } = useArticles('published');
  const { user, isAuthenticated, login, logout } = useAuth();
  
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    excerpt: ''
  });
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  if (isLoading) {
    return <div className="p-4">Initializing database...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Database error: {error}</div>;
  }

  if (!isInitialized) {
    return <div className="p-4">Database not initialized</div>;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginForm.email, loginForm.password);
    if (!success) {
      alert('Login failed');
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please login first');
      return;
    }

    try {
      await createArticle({
        title: newArticle.title,
        content: newArticle.content,
        excerpt: newArticle.excerpt,
        author_id: user.id,
        status: 'published',
        views: 0,
        likes: 0
      });
      
      setNewArticle({ title: '', content: '', excerpt: '' });
      alert('Article created successfully!');
    } catch (error) {
      alert('Failed to create article');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteArticle(id);
        alert('Article deleted successfully!');
      } catch (error) {
        alert('Failed to delete article');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">SQLite Blog Demo</h1>
      
      {/* Authentication Section */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Authentication</h2>
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="admin@blog.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password:</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="hashed_password_here"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Login
            </button>
          </form>
        ) : (
          <div>
            <p className="mb-2">Welcome, {user?.username}!</p>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Create Article Section */}
      {isAuthenticated && (
        <div className="mb-8 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Create New Article</h2>
          <form onSubmit={handleCreateArticle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title:</label>
              <input
                type="text"
                value={newArticle.title}
                onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Excerpt:</label>
              <textarea
                value={newArticle.excerpt}
                onChange={(e) => setNewArticle({ ...newArticle, excerpt: e.target.value })}
                className="w-full p-2 border rounded h-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content:</label>
              <textarea
                value={newArticle.content}
                onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                className="w-full p-2 border rounded h-32"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Article
            </button>
          </form>
        </div>
      )}

      {/* Articles List */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Published Articles</h2>
        {articlesLoading ? (
          <p>Loading articles...</p>
        ) : articles.length === 0 ? (
          <p>No articles found. Create one above!</p>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{article.title}</h3>
                  {isAuthenticated && user?.id === article.author_id && (
                    <button
                      onClick={() => handleDeleteArticle(article.id)}
                      className="px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
                {article.excerpt && (
                  <p className="text-gray-600 mb-2">{article.excerpt}</p>
                )}
                <div className="text-sm text-gray-500 mb-2">
                  Views: {article.views} | Likes: {article.likes}
                </div>
                <div className="text-sm text-gray-500">
                  Created: {new Date(article.created_at).toLocaleDateString()}
                </div>
                <div className="mt-2 text-sm">
                  <p>{article.content.substring(0, 200)}...</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Database Info */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Database Info</h3>
        <p className="text-sm text-gray-600">
          This blog is running entirely in your browser using SQLite via WebAssembly.
          All data is stored locally in your browser's localStorage.
        </p>
        <div className="mt-2 space-x-2 space-y-2">
          <div className="space-x-2">
            <button
              onClick={() => {
                const data = JSON.stringify(Array.from(database.exportDatabase()));
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'blog-database.json';
                a.click();
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Export Database
            </button>
            <button
              onClick={async () => {
                if (confirm('This will clear all data. Are you sure?')) {
                  await database.clearDatabase();
                  window.location.reload();
                }
              }}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Clear Database
            </button>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => {
                alert('Sample data creation feature not implemented yet.');
              }}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Create Sample Data
            </button>
            <button
              onClick={() => {
                alert('Backend migration feature not implemented yet.');
              }}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            >
              Migrate from Backend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogExample;