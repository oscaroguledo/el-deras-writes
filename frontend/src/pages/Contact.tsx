import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MailIcon, PhoneIcon, SendIcon, Instagram, Facebook, Twitter, Youtube, Globe } from 'lucide-react';
import { FaTiktok, FaWhatsapp, FaLinkedinIn, FaGithub } from 'react-icons/fa';
import { getContactInfo } from '@/utils/api';
import { ContactInfo } from '../types/ContactInfo'; // Import ContactInfo type
import SkeletonLoader from '../components/SkeletonLoader';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null); // Use ContactInfo type
  const [loadingContactInfo, setLoadingContactInfo] = useState(true); // New loading state

  useEffect(() => {
    async function fetchContactInfo() {
      try {
        setLoadingContactInfo(true);
        const info = await getContactInfo();
        setContactInfo(info);
      } catch (error) {
        console.error('Failed to fetch contact info:', error);
      } finally {
        setLoadingContactInfo(false);
      }
    }
    fetchContactInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Your message has been sent successfully!');
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSocialMediaIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-6 w-6" />;
      case 'facebook':
        return <Facebook className="h-6 w-6" />;
      case 'tiktok':
        return <FaTiktok className="h-6 w-6" />;
      case 'whatsapp':
        return <FaWhatsapp className="h-6 w-6" />;
      case 'linkedin':
        return <FaLinkedinIn className="h-6 w-6" />;
      case 'github':
        return <FaGithub className="h-6 w-6" />;
      case 'twitter':
        return <Twitter className="h-6 w-6" />;
      case 'youtube':
        return <Youtube className="h-6 w-6" />;
      default:
        return <Globe className="h-6 w-6" />; // Generic icon for others
    }
  };

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 dark:text-gray-100 mb-6">
          Contact Us
        </h1>
        {loadingContactInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <SkeletonLoader className="h-32 w-full" />
            <SkeletonLoader className="h-32 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mr-4">
                  <MailIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Email</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-justify">
                <a href={`mailto:${contactInfo?.email || 'hello@el-deras-writes.com'}`} className="hover:text-gray-900 dark:hover:text-gray-100">
                  {contactInfo?.email || 'hello@el-deras-writes.com'}
                </a>
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mr-4">
                  <PhoneIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Phone</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-justify">
                <a href={`tel:${contactInfo?.phone || '+1 (234) 567-890'}`} className="hover:text-gray-900 dark:hover:text-gray-100">
                  {contactInfo?.phone || '+1 (234) 567-890'}
                </a>
              </p>
            </div>
          </div>
        )}

        {loadingContactInfo ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mb-12">
            <SkeletonLoader className="h-8 w-1/2 mb-6" />
            <div className="flex flex-wrap gap-6">
              <SkeletonLoader className="h-12 w-32" />
              <SkeletonLoader className="h-12 w-32" />
              <SkeletonLoader className="h-12 w-32" />
            </div>
          </div>
        ) : (
          contactInfo?.social_media_links && Object.keys(contactInfo.social_media_links).length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mb-12">
              <h2 className="text-2xl font-serif font-medium text-gray-900 dark:text-gray-100 mb-6">
                Connect With Us
              </h2>
              <div className="flex flex-wrap gap-6">
                {Object.entries(contactInfo.social_media_links).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    aria-label={platform}
                  >
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mr-3">
                      {getSocialMediaIcon(platform)}
                    </div>
                    <span className="text-lg font-medium capitalize">{platform}</span>
                  </a>
                ))}
              </div>
            </div>
          )
        )}

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-serif font-medium text-gray-900 dark:text-gray-100 mb-6">
            Send Us a Message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Name *
                </label>
                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Email *
                </label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <input id="subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Message *
              </label>
              <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} rows={6} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required></textarea>
            </div>
            <div>
              <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Sending...' : <>
                    Send Message <SendIcon className="ml-2 h-4 w-4" />
                  </>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}