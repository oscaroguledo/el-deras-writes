import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { PlusIcon, EditIcon, TrashIcon, Search } from 'lucide-react';
import { Category } from '../../types/Category';
import { Tag } from '../../types/Tag';
import { getCategories, createCategory, updateCategory, deleteCategory, getTags, createTag, updateTag, deleteTag } from '../../utils/api';
import { ConfirmationModal } from '../../components/ConfirmationModal'; // Import the new modal
import { debounce } from 'lodash';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function AdminCategoriesTagsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'category' | 'tag' } | null>(null);

  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  const fetchCategories = useCallback(async (search: string = '') => {
    try {
      const categoriesData = await getCategories({ search });
      setCategories(categoriesData);
    } catch (error) {
      toast.error('Failed to fetch categories.');
      console.error(error);
    }
  }, []);

  const fetchTags = useCallback(async (search: string = '') => {
    try {
      const tagsData = await getTags({ search });
      setTags(tagsData);
    } catch (error) {
      toast.error('Failed to fetch tags.');
      console.error(error);
    }
  }, []);

  const debouncedFetchCategories = useRef(
    debounce((search: string) => fetchCategories(search), 500)
  ).current;

  const debouncedFetchTags = useRef(
    debounce((search: string) => fetchTags(search), 500)
  ).current;

  useEffect(() => {
    setLoading(true);
    debouncedFetchCategories(categorySearchQuery);
    debouncedFetchTags(tagSearchQuery);
    setLoading(false); // Set loading to false after both debounced calls are initiated
    return () => {
      debouncedFetchCategories.cancel();
      debouncedFetchTags.cancel();
    };
  }, [categorySearchQuery, tagSearchQuery, debouncedFetchCategories, debouncedFetchTags]);

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
      fetchCategories(categorySearchQuery); // Re-fetch with current search query
    } catch (error: any) {
      let errorMessage = 'Failed to create category.';
      if (error.response && error.response.data && error.response.data.name) {
        errorMessage = `Category: ${error.response.data.name.join(', ')}`;
      }
      toast.error(errorMessage);
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
      fetchCategories(categorySearchQuery); // Re-fetch with current search query
    } catch (error: any) {
      let errorMessage = 'Failed to update category.';
      if (error.response && error.response.data && error.response.data.name) {
        errorMessage = `Category: ${error.response.data.name.join(', ')}`;
      }
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const handleDeleteCategoryClick = (categoryId: string) => {
    setItemToDelete({ id: categoryId, type: 'category' });
    setShowConfirmModal(true);
  };

  const handleDeleteTagClick = (tagId: string) => {
    setItemToDelete({ id: tagId, type: 'tag' });
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'category') {
        await deleteCategory(itemToDelete.id);
        toast.success('Category deleted successfully!');
        fetchCategories(categorySearchQuery); // Re-fetch with current search query
      } else if (itemToDelete.type === 'tag') {
        await deleteTag(itemToDelete.id);
        toast.success('Tag deleted successfully!');
        fetchTags(tagSearchQuery); // Re-fetch with current search query
      }
    } catch (error) {
      toast.error(`Failed to delete ${itemToDelete.type}.`);
      console.error(error);
    } finally {
      setShowConfirmModal(false);
      setItemToDelete(null);
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
      fetchTags(tagSearchQuery); // Re-fetch with current search query
    } catch (error: any) {
      let errorMessage = 'Failed to create tag.';
      if (error.response && error.response.data && error.response.data.name) {
        errorMessage = `Tag: ${error.response.data.name.join(', ')}`;
      }
      toast.error(errorMessage);
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
      fetchTags(tagSearchQuery); // Re-fetch with current search query
    } catch (error: any) {
      let errorMessage = 'Failed to update tag.';
      if (error.response && error.response.data && error.response.data.name) {
        errorMessage = `Tag: ${error.response.data.name.join(', ')}`;
      }
      toast.error(errorMessage);
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 md:p-8">
        {/* Categories Management Skeleton */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <SkeletonLoader className="h-8 w-1/2 mb-4" /> {/* Title */}
          <SkeletonLoader className="h-10 w-full mb-4" /> {/* Search Bar */}
          <div className="flex mb-4">
            <SkeletonLoader className="h-10 w-full rounded-l-md" /> {/* New Category Input */}
            <SkeletonLoader className="h-10 w-10 rounded-r-md" /> {/* Plus Icon Button */}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-4 w-3/4" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <SkeletonLoader className="h-5 w-5" />
                        <SkeletonLoader className="h-5 w-5" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tags Management Skeleton */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <SkeletonLoader className="h-8 w-1/2 mb-4" /> {/* Title */}
          <SkeletonLoader className="h-10 w-full mb-4" /> {/* Search Bar */}
          <div className="flex mb-4">
            <SkeletonLoader className="h-10 w-full rounded-l-md" /> {/* New Tag Input */}
            <SkeletonLoader className="h-10 w-10 rounded-r-md" /> {/* Plus Icon Button */}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-4 w-3/4" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <SkeletonLoader className="h-5 w-5" />
                        <SkeletonLoader className="h-5 w-5" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 md:p-8">
      {/* Categories Management */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-medium text-gray-900">Categories</h2>
        </div>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        className="w-full bg-white rounded-md py-2 pl-10 pr-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            fetchCategories(categorySearchQuery);
                          }
                        }}
                      />        </div>
        <form onSubmit={handleCreateCategory} className="flex mb-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
          <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            <PlusIcon className="h-4 w-4" />
          </button>
        </form>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map(category => (
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
                        <button onClick={handleUpdateCategory} className="text-green-600 hover:text-green-900">Save</button>
                      ) : (
                        <button onClick={() => setEditingCategory(category)} className="text-indigo-600 hover:text-indigo-900"><EditIcon className="h-5 w-5" /></button>
                      )}
                      <button onClick={() => handleDeleteCategoryClick(category.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tags Management */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-medium text-gray-900">Tags</h2>
        </div>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search tags..."
                        className="w-full bg-white rounded-md py-2 pl-10 pr-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            fetchTags(tagSearchQuery);
                          }
                        }}
                      />        </div>
        <form onSubmit={handleCreateTag} className="flex mb-4">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name"
            className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
          <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            <PlusIcon className="h-4 w-4" />
          </button>
        </form>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tags.map(tag => (
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
                        <button onClick={handleUpdateTag} className="text-green-600 hover:text-green-900">Save</button>
                      ) : (
                        <button onClick={() => setEditingTag(tag)} className="text-indigo-600 hover:text-indigo-900"><EditIcon className="h-5 w-5" /></button>
                      )}
                      <button onClick={() => handleDeleteTagClick(tag.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${itemToDelete?.type === 'category' ? 'Category' : 'Tag'}`}
        message={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone.`}
      />
    </div>
  );
}
