import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { Category } from '../../types/Category';
import { Tag } from '../../types/Tag';
import { getCategories, createCategory, updateCategory, deleteCategory, getTags, createTag, updateTag, deleteTag } from '../../utils/api';

export default function AdminCategoriesTagsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      toast.error('Failed to fetch categories.');
      console.error(error);
    }
  };

  const fetchTags = async () => {
    try {
      const tagsData = await getTags();
      setTags(tagsData);
    } catch (error) {
      toast.error('Failed to fetch tags.');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Category name cannot be empty.');
      return;
    }
    try {
      await createCategory({ name: newCategoryName });
      toast.success('Category created successfully!');
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to create category.');
      console.error(error);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error('Category name cannot be empty.');
      return;
    }
    try {
      await updateCategory(editingCategory.id, { name: editingCategory.name });
      toast.success('Category updated successfully!');
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to update category.');
      console.error(error);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await deleteCategory(categoryId);
        toast.success('Category deleted successfully!');
        fetchCategories();
      } catch (error) {
        toast.error('Failed to delete category.');
        console.error(error);
      }
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      toast.error('Tag name cannot be empty.');
      return;
    }
    try {
      await createTag({ name: newTagName });
      toast.success('Tag created successfully!');
      setNewTagName('');
      fetchTags();
    } catch (error) {
      toast.error('Failed to create tag.');
      console.error(error);
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editingTag.name.trim()) {
      toast.error('Tag name cannot be empty.');
      return;
    }
    try {
      await updateTag(editingTag.id, { name: editingTag.name });
      toast.success('Tag updated successfully!');
      setEditingTag(null);
      fetchTags();
    } catch (error) {
      toast.error('Failed to update tag.');
      console.error(error);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (window.confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
      try {
        await deleteTag(tagId);
        toast.success('Tag deleted successfully!');
        fetchTags();
      } catch (error) {
        toast.error('Failed to delete tag.');
        console.error(error);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      {/* Categories Management */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-medium text-gray-900">Categories</h2>
          <form onSubmit={handleCreateCategory} className="flex">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />
            <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              <PlusIcon className="h-4 w-4 mr-1" /> Add
            </button>
          </form>
        </div>
        
        {/* Desktop Table View for Categories */}
        <div className="hidden md:block bg-white shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.length > 0 ? categories.map(category => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {editingCategory?.id === category.id ? (
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                        />
                      ) : (
                        category.name
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {editingCategory?.id === category.id ? (
                          <button onClick={handleUpdateCategory} className="text-green-600 hover:text-green-900">
                            Save
                          </button>
                        ) : (
                          <button onClick={() => setEditingCategory(category)} className="text-indigo-600 hover:text-indigo-900">
                            <EditIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteCategory(category.id)} className="text-red-600 hover:text-red-900">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No categories found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile List View for Categories */}
        <div className="md:hidden bg-white shadow overflow-hidden rounded-lg">
          {categories.length > 0 ? categories.map(category => (
            <div key={category.id} className="border-b border-gray-200 p-4 last:border-b-0">
              <div className="flex justify-between items-center mb-2">
                <div className="text-lg font-medium text-gray-900">{category.name}</div>
                <div className="flex space-x-2">
                  {editingCategory?.id === category.id ? (
                    <button onClick={handleUpdateCategory} className="text-green-600 hover:text-green-900">
                      Save
                    </button>
                  ) : (
                    <button onClick={() => setEditingCategory(category)} className="text-indigo-600 hover:text-indigo-900">
                      <EditIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button onClick={() => handleDeleteCategory(category.id)} className="text-red-600 hover:text-red-900">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-4 text-center text-sm text-gray-500">No categories found.</div>
          )}
        </div>
      </div>

      {/* Tags Management */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-medium text-gray-900">Tags</h2>
          <form onSubmit={handleCreateTag} className="flex">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name"
              className="px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />
            <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              <PlusIcon className="h-4 w-4 mr-1" /> Add
            </button>
          </form>
        </div>

        {/* Desktop Table View for Tags */}
        <div className="hidden md:block bg-white shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tags.length > 0 ? tags.map(tag => (
                  <tr key={tag.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {editingTag?.id === tag.id ? (
                        <input
                          type="text"
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                        />
                      ) : (
                        tag.name
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {editingTag?.id === tag.id ? (
                          <button onClick={handleUpdateTag} className="text-green-600 hover:text-green-900">
                            Save
                          </button>
                        ) : (
                          <button onClick={() => setEditingTag(tag)} className="text-indigo-600 hover:text-indigo-900">
                            <EditIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteTag(tag.id)} className="text-red-600 hover:text-red-900">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No tags found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile List View for Tags */}
        <div className="md:hidden bg-white shadow overflow-hidden rounded-lg">
          {tags.length > 0 ? tags.map(tag => (
            <div key={tag.id} className="border-b border-gray-200 p-4 last:border-b-0">
              <div className="flex justify-between items-center mb-2">
                <div className="text-lg font-medium text-gray-900">{tag.name}</div>
                <div className="flex space-x-2">
                  {editingTag?.id === tag.id ? (
                    <button onClick={handleUpdateTag} className="text-green-600 hover:text-green-900">
                      Save
                    </button>
                  ) : (
                    <button onClick={() => setEditingTag(tag)} className="text-indigo-600 hover:text-indigo-900">
                      <EditIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button onClick={() => handleDeleteTag(tag.id)} className="text-red-600 hover:text-red-900">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-4 text-center text-sm text-gray-500">No tags found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
