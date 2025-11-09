import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FeedbackForm } from './FeedbackForm';
import { getContactInfo, getTopFiveCategories } from '../utils/api';
import { ContactInfo } from '../types/ContactInfo';
import { Category } from '../types/Category';

export function Footer() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [topCategories, setTopCategories] = useState<Category[]>([]);

  useEffect(() => {
    getContactInfo()
      .then(data => setContactInfo(data))
      .catch(error => console.error('Failed to fetch contact info:', error));

    getTopFiveCategories()
      .then(data => setTopCategories(data))
      .catch(error => console.error('Failed to fetch top categories:', error));
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
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              )}
              {contactInfo?.facebook_link && (
                <a href={contactInfo.facebook_link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900" aria-label="Facebook">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
              )}
              {contactInfo?.tiktok_link && (
                <a href={contactInfo.tiktok_link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900" aria-label="TikTok">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.003 2.003a5.002 5.002 0 0 0 4.997 4.997v3.503a5.502 5.502 0 1 1-5.497-5.497V2.003zM18.003 8.503a7.502 7.502 0 1 0-7.497 7.497v-3.503a4.002 4.002 0 1 1 4.002-4.002v3.503a7.502 7.502 0 0 0 3.495-3.495z" />
                  </svg>
                </a>
              )}
              {contactInfo?.whatsapp_link && (
                <a href={contactInfo.whatsapp_link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900" aria-label="WhatsApp">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.52 3.48A11.815 11.815 0 0 0 12.003.002C6.477.002 2 4.478 2 10.004c0 1.767.464 3.487 1.343 5.003L.002 22l6.13-3.21a11.903 11.903 0 0 0 5.87 1.51c5.526 0 10.003-4.476 10.003-10.002 0-2.67-1.04-5.18-2.883-7.32zm-8.517 16.28a9.36 9.36 0 0 1-4.773-1.297l-.342-.204-3.64 1.907 1.938-3.552-.223-.355a9.26 9.26 0 0 1-1.41-4.743c0-5.102 4.153-9.255 9.256-9.255 2.468 0 4.787.96 6.527 2.703a9.19 9.19 0 0 1 2.703 6.527c0 5.103-4.153 9.256-9.256 9.256zM17.49 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.1-.47-.149-.669.15-.198.297-.767.967-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.173.198-.297.298-.495.1-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  </svg>
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