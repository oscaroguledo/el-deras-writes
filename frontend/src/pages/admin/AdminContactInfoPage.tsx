import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getContactInfo, updateContactInfo } from '../../utils/api';
import { ContactInfo } from '../../types/ContactInfo';
import { MapPin, Phone, Mail, MessageCircle, Instagram, Facebook, Linkedin, Github } from 'lucide-react';

export default function AdminContactInfoPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    address: '',
    phone: '',
    email: '',
    whatsapp_link: '',
    tiktok_link: '',
    instagram_link: '',
    facebook_link: '',
    linkedin_link: '',
    github_link: '',
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchCurrentContactInfo = async () => {
      try {
        setLoading(true);
        const info = await getContactInfo();
        setContactInfo(info);
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
      await updateContactInfo(contactInfo);
      toast.success('Contact information updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update contact info:', error);
      toast.error('Failed to update contact information.');
    }
  };

  const renderInfoField = (label: string, value: string | null, icon: React.ReactNode, link?: boolean) => (
    <div className="flex items-center text-gray-700">
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">{icon}</div>
      <div className="ml-4">
        <strong className="block">{label}:</strong>
        {link && value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
            {value}
          </a>
        ) : (
          <span className="break-all">{value || 'N/A'}</span>
        )}
      </div>
    </div>
  );

  const renderInputField = (id: keyof ContactInfo, label: string, type: string, icon: React.ReactNode) => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {icon}
      </div>
      <input
        type={type}
        id={id}
        value={contactInfo[id] || ''}
        onChange={(e) => setContactInfo({ ...contactInfo, [id]: e.target.value })}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        placeholder={label}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif font-medium text-gray-900">Manage Contact Information</h1>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Edit
          </button>
        )}
      </div>
      <div className="bg-white shadow-lg overflow-hidden rounded-xl p-6">
        {isEditing ? (
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInputField('address', 'Address', 'text', <MapPin className="text-gray-400" />)}
            {renderInputField('phone', 'Phone', 'text', <Phone className="text-gray-400" />)}
            {renderInputField('email', 'Email', 'email', <Mail className="text-gray-400" />)}
            {renderInputField('whatsapp_link', 'WhatsApp Link', 'url', <MessageCircle className="text-gray-400" />)}
            {renderInputField('tiktok_link', 'TikTok Link', 'url', <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 h-5 w-5"><path d="M12.52.02C13.83 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.65 4.32 1.71V10c-1.64.04-3.28-.48-4.62-1.49-1.34-1.02-2.3-2.4-2.86-4.01H12.52V.02z"/><path d="M12.52 10.02v3.33c0 2.51-1.33 4.83-3.51 6.2-2.18 1.37-4.88 1.5-7.23.42v-3.33c.94.54 2.04.83 3.19.83 2.28 0 4.18-1.88 4.18-4.18s-1.9-4.18-4.18-4.18S4.34 9.34 4.34 11.62H.02c0-4.41 3.58-7.98 7.98-7.98s7.98 3.57 7.98 7.98z"/></svg>)}
            {renderInputField('instagram_link', 'Instagram Link', 'url', <Instagram className="text-gray-400" />)}
            {renderInputField('facebook_link', 'Facebook Link', 'url', <Facebook className="text-gray-400" />)}
            {renderInputField('linkedin_link', 'LinkedIn Link', 'url', <Linkedin className="text-gray-400" />)}
            {renderInputField('github_link', 'GitHub Link', 'url', <Github className="text-gray-400" />)}
            <div className="md:col-span-2 flex justify-end space-x-2">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800">
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInfoField('Address', contactInfo.address, <MapPin className="text-blue-500" />)}
            {renderInfoField('Phone', contactInfo.phone, <Phone className="text-green-500" />)}
            {renderInfoField('Email', contactInfo.email, <Mail className="text-red-500" />)}
            {renderInfoField('WhatsApp', contactInfo.whatsapp_link, <MessageCircle className="text-green-400" />, true)}
            {renderInfoField('TikTok', contactInfo.tiktok_link, <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black h-6 w-6"><path d="M12.52.02C13.83 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.65 4.32 1.71V10c-1.64.04-3.28-.48-4.62-1.49-1.34-1.02-2.3-2.4-2.86-4.01H12.52V.02z"/><path d="M12.52 10.02v3.33c0 2.51-1.33 4.83-3.51 6.2-2.18 1.37-4.88 1.5-7.23.42v-3.33c.94.54 2.04.83 3.19.83 2.28 0 4.18-1.88 4.18-4.18s-1.9-4.18-4.18-4.18S4.34 9.34 4.34 11.62H.02c0-4.41 3.58-7.98 7.98-7.98s7.98 3.57 7.98 7.98z"/></svg>, true)}
            {renderInfoField('Instagram', contactInfo.instagram_link, <Instagram className="text-pink-500" />, true)}
            {renderInfoField('Facebook', contactInfo.facebook_link, <Facebook className="text-blue-600" />, true)}
            {renderInfoField('LinkedIn', contactInfo.linkedin_link, <Linkedin className="text-blue-700" />, true)}
            {renderInfoField('GitHub', contactInfo.github_link, <Github className="text-gray-800" />, true)}
          </div>
        )}
      </div>
    </div>
  );
}
