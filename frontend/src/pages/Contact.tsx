import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MailIcon, PhoneIcon, MapPinIcon, SendIcon } from 'lucide-react';
import { getContactInfo } from '@/utils/api';

interface ContactDetails {
  address?: string;
  phone?: string;
  email?: string;
}

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactDetails | null>(null);

  useEffect(() => {
    async function fetchContactInfo() {
      try {
        const info = await getContactInfo();
        setContactInfo(info);
      } catch (error) {
        console.error('Failed to fetch contact info:', error);
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
  return <div className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-6">
          Contact Us
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 p-3 rounded-full mr-4">
                <MailIcon className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium">Email</h3>
            </div>
            <p className="text-gray-600">
              <a href={`mailto:${contactInfo?.email || 'hello@el-deras-writes.com'}`} className="hover:text-gray-900">
                {contactInfo?.email || 'hello@el-deras-writes.com'}
              </a>
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 p-3 rounded-full mr-4">
                <PhoneIcon className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium">Phone</h3>
            </div>
            <p className="text-gray-600">
              <a href={`tel:${contactInfo?.phone || '+1 (234) 567-890'}`} className="hover:text-gray-900">
                {contactInfo?.phone || '+1 (234) 567-890'}
              </a>
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 p-3 rounded-full mr-4">
                <MapPinIcon className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium">Location</h3>
            </div>
            <p className="text-gray-600">
              {contactInfo?.address || '123 Content Street\nBlogville, BL 90210'}
            </p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-2xl font-serif font-medium text-gray-900 mb-6">
            Send Us a Message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email *
                </label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input id="subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Your Message *
              </label>
              <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} rows={6} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required></textarea>
            </div>
            <div>
              <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Sending...' : <>
                    Send Message <SendIcon className="ml-2 h-4 w-4" />
                  </>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>;
}