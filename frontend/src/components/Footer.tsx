import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FeedbackForm } from './FeedbackForm';
import { getContactInfo, getCategories } from '../utils/api';
import { ContactInfo } from '../types/ContactInfo';
import { Category } from '../types/Category';
import { Instagram, Facebook, Twitter, Youtube, Globe } from 'lucide-react'; // Added more Lucide icons
import { FaTiktok, FaWhatsapp, FaLinkedinIn, FaGithub } from 'react-icons/fa'; // Added more react-icons

export default function Footer() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [topCategories, setTopCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactInfoData, topCategoriesData] = await Promise.all([
          getContactInfo(),
          getCategories(),
        ]);
        setContactInfo(contactInfoData);
        setTopCategories(topCategoriesData.slice(0, 5)); // Get first 5 categories
      } catch (error) {
        console.error('Failed to fetch footer data:', error);
      }
    };
    fetchData();
  }, []);

  const getSocialMediaIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'facebook':
        return <Facebook className="h-5 w-5" />;
      case 'tiktok':
        return <FaTiktok className="h-5 w-5" />;
      case 'whatsapp':
        return <FaWhatsapp className="h-5 w-5" />;
      case 'linkedin':
        return <FaLinkedinIn className="h-5 w-5" />;
      case 'github':
        return <FaGithub className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />; // Generic icon for others
    }
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-serif font-medium text-gray-900 mb-3 sm:mb-4">
              El Dera's writes
            </h3>
            <p className="text-gray-600 text-sm mb-3 sm:mb-4 leading-relaxed">
              Curating thoughtful perspectives on technology, design, and the
              art of mindful living.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {contactInfo?.social_media_links &&
                Object.entries(contactInfo.social_media_links).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-900 transition-colors duration-200 p-1"
                    aria-label={platform}
                  >
                    {getSocialMediaIcon(platform)}
                  </a>
                ))}
            </div>
          </div>

          {/* Categories Section */}
          <div className="col-span-1">
            <h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
              Categories
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {topCategories.map(category => (
                <li key={category.id}>
                  <Link 
                    to={`/?category=${encodeURIComponent(category.name.trim())}`} 
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 block py-0.5"
                  >
                    {category.name.trim()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information Section */}
          <div className="col-span-1">
            <h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
              Information
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link to="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 block py-0.5">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 block py-0.5">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 block py-0.5">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 block py-0.5">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 block py-0.5">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Feedback Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
              Share Your Feedback
            </h3>
            <FeedbackForm />
          </div>
        </div>
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100">
          <p className="text-center text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} El Dera's writes. All rights reserved.
          </p>
        </div>
      </div>
    </footer>);
}