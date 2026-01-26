import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FeedbackForm } from './FeedbackForm';
import { getContactInfo, getCategories } from '../utils/api';
import { ContactInfo } from '../types/ContactInfo';
import { Category } from '../types/Category';
import { Globe, Mail, Phone, MapPin, ChevronUp } from 'lucide-react';
import { FaTiktok, FaWhatsapp, FaLinkedinIn, FaGithub, FaInstagram, FaFacebook, FaTwitter, FaYoutube } from 'react-icons/fa';

export default function Footer() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [topCategories, setTopCategories] = useState<Category[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  // Show scroll to top button when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSocialMediaIcon = (platform: string) => {
    const iconClass = "h-5 w-5";
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <FaInstagram className={iconClass} />;
      case 'facebook':
        return <FaFacebook className={iconClass} />;
      case 'tiktok':
        return <FaTiktok className={iconClass} />;
      case 'whatsapp':
        return <FaWhatsapp className={iconClass} />;
      case 'linkedin':
        return <FaLinkedinIn className={iconClass} />;
      case 'github':
        return <FaGithub className={iconClass} />;
      case 'twitter':
        return <FaTwitter className={iconClass} />;
      case 'youtube':
        return <FaYoutube className={iconClass} />;
      default:
        return <Globe className={iconClass} />; // Generic icon for others
    }
  };

  return (
    <>
      <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="py-8 sm:py-12 lg:py-16">
            {/* Mobile: Collapsible sections */}
            <div className="block md:hidden">
              {/* Brand Section - Always visible on mobile */}
              <div className="mb-8">
                <h3 className="text-xl font-serif font-medium text-gray-900 dark:text-gray-100 mb-4">
                  El Dera's writes
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
                  Curating thoughtful perspectives on technology, design, and the
                  art of mindful living.
                </p>
                
                {/* Social Media Icons - Mobile */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {contactInfo?.social_media_links &&
                    Object.entries(contactInfo.social_media_links).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:shadow-md"
                        aria-label={`Follow us on ${platform}`}
                      >
                        {getSocialMediaIcon(platform)}
                      </a>
                    ))}
                </div>

                {/* Contact Info - Mobile */}
                {contactInfo && (
                  <div className="space-y-3 mb-6">
                    {contactInfo.email && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Mail className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />
                        <a href={`mailto:${contactInfo.email}`} className="hover:text-gray-900 dark:hover:text-gray-100">
                          {contactInfo.email}
                        </a>
                      </div>
                    )}
                    {contactInfo.phone && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Phone className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />
                        <a href={`tel:${contactInfo.phone}`} className="hover:text-gray-900 dark:hover:text-gray-100">
                          {contactInfo.phone}
                        </a>
                      </div>
                    )}
                    {contactInfo.address && (
                      <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                        <MapPin className="h-4 w-4 mr-3 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span>{contactInfo.address}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Login - Always visible on mobile */}
              <div className="mb-6">
                <Link 
                  to="/admin" 
                  className="w-full flex items-center justify-center py-3 px-4 bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-sm hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors duration-200 text-sm font-medium"
                >
                  Admin Login
                </Link>
              </div>

              {/* Feedback Form - Always visible on mobile */}
              <div className="mb-6 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Share Your Feedback
                </h4>
                <FeedbackForm />
              </div>

              {/* Expandable Sections Button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 mb-4"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {isExpanded ? 'Hide' : 'Show'} Categories & Links
                </span>
                <ChevronUp className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Collapsible Content */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-2 gap-6 pb-6">
                  {/* Categories - Mobile */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Categories
                    </h4>
                    <ul className="space-y-2">
                      {topCategories.map(category => (
                        <li key={category.id}>
                          <Link 
                            to={`/?category=${encodeURIComponent(category.name.trim())}`} 
                            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 block py-1"
                            onClick={() => setIsExpanded(false)}
                          >
                            {category.name.trim()}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Information - Mobile */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Information
                    </h4>
                    <ul className="space-y-2">
                      <li>
                        <Link to="/about" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 block py-1">
                          About
                        </Link>
                      </li>
                      <li>
                        <Link to="/contact" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 block py-1">
                          Contact
                        </Link>
                      </li>
                      <li>
                        <Link to="/terms" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 block py-1">
                          Terms
                        </Link>
                      </li>
                      <li>
                        <Link to="/privacy" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 block py-1">
                          Privacy
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {/* Brand Section - Desktop */}
              <div className="lg:col-span-1">
                <h3 className="text-xl font-serif font-medium text-gray-900 dark:text-gray-100 mb-4">
                  El Dera's writes
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
                  Curating thoughtful perspectives on technology, design, and the
                  art of mindful living.
                </p>
                
                {/* Social Media Icons - Desktop */}
                <div className="flex flex-wrap gap-3">
                  {contactInfo?.social_media_links &&
                    Object.entries(contactInfo.social_media_links).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:shadow-md hover:scale-110"
                        aria-label={`Follow us on ${platform}`}
                      >
                        {getSocialMediaIcon(platform)}
                      </a>
                    ))}
                </div>

                {/* Contact Info - Desktop */}
                {contactInfo && (
                  <div className="mt-6 space-y-3">
                    {contactInfo.email && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Mail className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />
                        <a href={`mailto:${contactInfo.email}`} className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                          {contactInfo.email}
                        </a>
                      </div>
                    )}
                    {contactInfo.phone && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Phone className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />
                        <a href={`tel:${contactInfo.phone}`} className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                          {contactInfo.phone}
                        </a>
                      </div>
                    )}
                    {contactInfo.address && (
                      <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                        <MapPin className="h-4 w-4 mr-3 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span>{contactInfo.address}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Categories - Desktop */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">
                  Categories
                </h3>
                <ul className="space-y-3">
                  {topCategories.map(category => (
                    <li key={category.id}>
                      <Link 
                        to={`/?category=${encodeURIComponent(category.name.trim())}`} 
                        className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 block py-1 hover:translate-x-1 transform"
                      >
                        {category.name.trim()}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Information - Desktop */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">
                  Information
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/about" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 block py-1 hover:translate-x-1 transform">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 block py-1 hover:translate-x-1 transform">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 block py-1 hover:translate-x-1 transform">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 block py-1 hover:translate-x-1 transform">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 block py-1 hover:translate-x-1 transform">
                      Admin Login
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Feedback Section - Desktop */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">
                  Share Your Feedback
                </h3>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <FeedbackForm />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 dark:border-gray-700 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                © {new Date().getFullYear()} El Dera's writes. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <span>Made with ❤️ for thoughtful readers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 bg-gray-900 dark:bg-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110 z-50"
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        )}
      </footer>
    </>
  );
}