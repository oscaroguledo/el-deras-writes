import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FeedbackForm } from './FeedbackForm';
import { getContactInfo, getTopFiveCategories } from '../utils/api';
import { ContactInfo } from '../types/ContactInfo';
import { Category } from '../types/Category';
import { Instagram, Facebook } from 'lucide-react';
import { FaTiktok, FaWhatsapp } from 'react-icons/fa';

export function Footer() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [topCategories, setTopCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactInfoData, topCategoriesData] = await Promise.all([
          getContactInfo(),
          getTopFiveCategories(),
        ]);
        setContactInfo(contactInfoData);
        setTopCategories(topCategoriesData);
      } catch (error) {
        console.error('Failed to fetch footer data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-serif font-medium text-gray-900 mb-4">
              El_Dera's writes
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Curating thoughtful perspectives on technology, design, and the
              art of mindful living.
            </p>
            <div className="flex flex-wrap gap-4">
              {contactInfo?.instagram_link && (
                <a href={contactInfo.instagram_link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {contactInfo?.facebook_link && (
                <a href={contactInfo.facebook_link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {contactInfo?.tiktok_link && (
                <a href={contactInfo.tiktok_link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900" aria-label="TikTok">
                  <FaTiktok className="h-5 w-5" />
                </a>
              )}
              {contactInfo?.whatsapp_link && (
                <a href={contactInfo.whatsapp_link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900" aria-label="WhatsApp">
                  <FaWhatsapp className="h-5 w-5" />
                </a>
              )}
              
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Categories
            </h3>
            <ul className="space-y-2">
              {topCategories.map(category => (
                <li key={category.id}>
                  <Link to={`/?category=${encodeURIComponent(category.name)}`} className="text-sm text-gray-600 hover:text-gray-900">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Information
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-gray-600 hover:text-gray-900">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Share Your Feedback
            </h3>
            <FeedbackForm />
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} El_Dera's writes. All rights reserved.
          </p>
        </div>
      </div>
    </footer>);
}