import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getContactInfo, updateContactInfo } from '../../utils/api';
import { ContactInfo } from '../../types/ContactInfo';
import SkeletonLoader from '../../components/SkeletonLoader';
import { Phone, Mail, Plus, X, Instagram, Facebook, Twitter, Youtube, Globe } from 'lucide-react';
import { FaTiktok, FaWhatsapp, FaLinkedinIn, FaGithub } from 'react-icons/fa';

export default function AdminContactInfoPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: '',
    email: '',
    social_media_links: {},
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchCurrentContactInfo = async () => {
      try {
        setLoading(true);
        const info = await getContactInfo();
        setContactInfo({
          phone: info.phone || '',
          email: info.email || '',
          social_media_links: info.social_media_links || {},
        });
      } catch (error) {
        console.error('Failed to fetch contact info:', error);
        toast.error('Failed to load contact information.');
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentContactInfo();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty social media links before saving
      const filteredSocialMediaLinks = Object.fromEntries(
        Object.entries(contactInfo.social_media_links).filter(([platform, url]) => platform.trim() !== '' && url.trim() !== '')
      );

      await updateContactInfo({ ...contactInfo, social_media_links: filteredSocialMediaLinks });
      toast.success('Contact information updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to update contact info:', error);
      let errorMessage = 'Failed to update contact information.';
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = Object.values(error.response.data).flat().join(', ') || errorMessage;
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setContactInfo({ ...contactInfo, [id]: value });
  };

  const handleSocialMediaChange = (oldPlatform: string, field: 'platform' | 'url', value: string) => {
    const updatedLinks = { ...contactInfo.social_media_links };
    const newPlatform = field === 'platform' ? value : oldPlatform;
    const newUrl = field === 'url' ? value : updatedLinks[oldPlatform];

    // Remove old entry if platform name changed
    if (field === 'platform' && oldPlatform !== newPlatform) {
      delete updatedLinks[oldPlatform];
    }
    updatedLinks[newPlatform] = newUrl;
    setContactInfo({ ...contactInfo, social_media_links: updatedLinks });
  };

  const handleAddSocialMedia = () => {
    const newKey = `new_platform_${Date.now()}`; // Unique key for new entry
    setContactInfo({
      ...contactInfo,
      social_media_links: {
        ...contactInfo.social_media_links,
        [newKey]: '', // Add an empty link
      },
    });
  };

  const handleRemoveSocialMedia = (platformToRemove: string) => {
    const updatedLinks = { ...contactInfo.social_media_links };
    delete updatedLinks[platformToRemove];
    setContactInfo({ ...contactInfo, social_media_links: updatedLinks });
  };

  const getSocialMediaIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'facebook':
        return <Facebook className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      case 'tiktok':
        return <FaTiktok className="h-5 w-5" />;
      case 'whatsapp':
        return <FaWhatsapp className="h-5 w-5" />;
      case 'linkedin':
        return <FaLinkedinIn className="h-5 w-5" />;
      case 'github':
        return <FaGithub className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />; // Generic icon for others
    }
  };

  const renderInfoField = (label: string, value: string | null, icon?: React.ReactNode, link?: boolean) => {
    if (!value) return null; // Don't render if value is empty/null

    return (
      <div className="flex items-start text-gray-700">
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">{icon}</div>
        <div className="ml-4 flex-grow">
          <strong className="block">{label}:</strong>
          {link && value ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
              {value}
            </a>
          ) : (
            <span className="break-all">{value}</span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <SkeletonLoader className="h-8 w-64" />
          <SkeletonLoader className="h-10 w-20" />
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-xl p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone, Email Skeletons */}
            <SkeletonLoader className="h-16 w-full" />
            <SkeletonLoader className="h-16 w-full" />

            {/* Social Media Links Skeletons */}
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-start text-gray-700 dark:text-gray-300">
                <SkeletonLoader className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="ml-4 flex-grow">
                  <SkeletonLoader className="h-4 w-24 mb-1" />
                  <SkeletonLoader className="h-4 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-2xl md:text-3xl font-serif font-medium text-gray-900 dark:text-gray-100">Manage Contact Information</h1>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-colors duration-200"
          >
            Edit
          </button>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-xl p-4 md:p-6 transition-colors duration-200">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  id="phone"
                  value={contactInfo.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200"
                  placeholder="Phone"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={contactInfo.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200"
                  placeholder="Email"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Social Media Links</h3>
              {Object.entries(contactInfo.social_media_links).map(([platform, url], index) => (
                <div key={platform} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                  <div className="col-span-1 sm:col-span-2">
                    <label htmlFor={`platform-${index}`} className="sr-only">Platform</label>
                    <input
                      type="text"
                      id={`platform-${index}`}
                      value={platform}
                      onChange={(e) => handleSocialMediaChange(platform, 'platform', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200"
                      placeholder="Platform Name (e.g., Twitter)"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label htmlFor={`url-${index}`} className="sr-only">URL</label>
                    <input
                      type="url"
                      id={`url-${index}`}
                      value={url}
                      onChange={(e) => handleSocialMediaChange(platform, 'url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200"
                      placeholder="URL"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveSocialMedia(platform)} 
                    className="col-span-1 p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex justify-center items-center transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddSocialMedia}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Social Media
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)} 
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInfoField('Phone', contactInfo.phone, <Phone className="text-green-500 dark:text-green-400" />)}
            {renderInfoField('Email', contactInfo.email, <Mail className="text-red-500 dark:text-red-400" />)}

            {Object.entries(contactInfo.social_media_links).map(([platform, url]) => (
              <div key={platform} className="flex items-start text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    {getSocialMediaIcon(platform)}
                </div>
                <div className="ml-4 flex-grow">
                  <strong className="block">{platform}:</strong>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline break-all transition-colors duration-200">
                    {url}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
