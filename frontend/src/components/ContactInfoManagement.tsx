import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getContactInfo, updateContactInfo } from '../utils/api';

interface ContactInfoManagementProps {
  fetchContactInfo: () => void; // Callback to refresh contact info in parent
}

interface ContactDetails {
  address: string;
  phone: string;
  email: string;
}

export function ContactInfoManagement({ fetchContactInfo }: ContactInfoManagementProps) {
  const [contactInfo, setContactInfo] = useState<ContactDetails>({ address: '', phone: '', email: '' });
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
      fetchContactInfo(); // Refresh parent component's data
    } catch (error) {
      console.error('Failed to update contact info:', error);
      toast.error('Failed to update contact information.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-serif font-medium text-gray-900">Contact Information</h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Edit
          </button>
        )}
      </div>
      <div className="bg-white shadow overflow-hidden rounded-lg p-6">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                id="address"
                value={contactInfo.address}
                onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                id="phone"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                id="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800">
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-700"><strong>Address:</strong> {contactInfo.address || 'N/A'}</p>
            <p className="text-gray-700"><strong>Phone:</strong> {contactInfo.phone || 'N/A'}</p>
            <p className="text-gray-700"><strong>Email:</strong> {contactInfo.email || 'N/A'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
