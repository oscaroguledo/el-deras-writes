import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { XIcon } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Article, ArticleInput } from '../types/Article';
import { useCategories } from '../hooks/CategoryProvider';
import { CustomUser } from '../types/CustomUser';
import { uploadSingleFile } from '../utils/gitHub';

interface ArticleFormProps {
  initialData?: Article;
  onSubmit: (formData: ArticleInput) => Promise<void>;
  isSubmitting: boolean;
  loggedInUser?: CustomUser;
}

export function ArticleForm({
  initialData,
  onSubmit,
  isSubmitting,
  loggedInUser,
}: ArticleFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const { sections } = useCategories();
  const [category, setCategory] = useState(initialData?.category_slug || '');
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status || 'published');
  const [tags, setTags] = useState((initialData?.tags || []).join(', '));
  const authorName = initialData?.author || (loggedInUser ? `${loggedInUser.first_name} ${loggedInUser.last_name}`.trim() || loggedInUser.username : '');
  const [readTime, setReadTime] = useState(initialData?.readTime || 5);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState(initialData?.image || '');

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMainImage = () => {
    setMainImage(null);
    setMainImagePreview('');
    if (mainImageInputRef.current) {
      mainImageInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !excerpt || !category) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!initialData && !mainImage) {
      toast.error('Please upload a main image');
      return;
    }

    try {
      let imageUrl = mainImagePreview;
      
      // If there's a new image file, upload it to GitHub
      if (mainImage) {
        toast.info('Uploading image...');
        const uploadResult = await uploadSingleFile(mainImage, 'articles');
        imageUrl = uploadResult.cdnUrl;
        toast.success('Image uploaded successfully!');
      }

      const articleData: ArticleInput = {
        title,
        content,
        excerpt,
        category, // slug; the backend also accepts a name or id
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        status,
        readTime,
        image: imageUrl,
      };
      await onSubmit(articleData);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      let errorMessage = 'Failed to save article';
      
      // Handle GitHub upload errors
      if (error.message && error.message.includes('GitHub')) {
        errorMessage = 'Failed to upload image. Please try again.';
      } else if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.name) { // Specific for category/tag name uniqueness
          errorMessage = `Category: ${error.response.data.name.join(', ')}`;
        } else {
          // Attempt to parse other common error structures
          errorMessage = Object.values(error.response.data).flat().join(', ') || errorMessage;
        }
      }
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400"
          placeholder="Article title"
          required
        />
      </div>
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Excerpt/Summary *
        </label>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400"
          placeholder="Brief summary of the article"
          rows={3}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400"
            required
          >
            <option value="">Select a category</option>
            {sections.map((section) => (
              <optgroup key={section.id} label={section.name}>
                <option value={section.slug}>{section.name} (general)</option>
                {section.children.map((child) => (
                  <option key={child.id} value={child.slug}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="readTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Read Time (minutes)
          </label>
          <input
            id="readTime"
            type="number"
            value={readTime}
            onChange={(e) => setReadTime(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400"
            placeholder="5"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags (comma separated)
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400"
            placeholder="faith, family"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Author
          </label>
          <input
            id="author"
            type="text"
            value={authorName}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400"
            readOnly
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Main Image *
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md bg-white dark:bg-gray-800">
          {mainImagePreview ? (
            <div className="relative w-full">
              <img
                src={mainImagePreview}
                alt="Article thumbnail"
                className="mx-auto max-h-64 object-contain"
              />
              <button
                type="button"
                onClick={removeMainImage}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    ref={mainImageInputRef}
                    onChange={handleMainImageChange}
                    accept="image/*"
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 10MB</p>
            </div>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Content *
        </label>
        <div className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            className="h-64 mb-12"
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike', 'sub', 'sup'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'image'],
                [{ align: [] }],
                ['clean'],
              ],
            }}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Article' : 'Create Article'}
        </button>
      </div>
    </form>
  );
}