import React, { useState } from 'react';
import { PlusCircleIcon, MapPinIcon, HomeIcon, BriefcaseIcon, TrashIcon, PencilIcon } from 'lucide-react';
import { toast } from 'sonner';
interface Address {
  id: string;
  name: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  phone?: string;
}
export const Addresses: React.FC = () => {
  // Mock addresses data
  const initialAddresses: Address[] = [{
    id: 'addr1',
    name: 'John Doe',
    type: 'home',
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'United States',
    isDefault: true,
    phone: '(123) 456-7890'
  }, {
    id: 'addr2',
    name: 'John Doe',
    type: 'work',
    street: '456 Business Ave',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'United States',
    isDefault: false,
    phone: '(123) 456-7890'
  }];
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    name: '',
    type: 'home',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    isDefault: false,
    phone: ''
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {
      name,
      value,
      type
    } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddressId) {
      // Update existing address
      setAddresses(addresses.map(address => address.id === editingAddressId ? {
        ...formData,
        id: editingAddressId
      } : formData.isDefault ? {
        ...address,
        isDefault: false
      } : address));
      toast.success('Address updated successfully');
    } else {
      // Add new address
      const newAddress = {
        ...formData,
        id: `addr${Date.now()}`
      };
      if (formData.isDefault) {
        setAddresses(addresses.map(address => ({
          ...address,
          isDefault: false
        })).concat(newAddress));
      } else {
        setAddresses([...addresses, newAddress]);
      }
      toast.success('Address added successfully');
    }
    resetForm();
  };
  const handleEditAddress = (address: Address) => {
    setFormData({
      name: address.name,
      type: address.type,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
      phone: address.phone || ''
    });
    setEditingAddressId(address.id);
    setShowAddressForm(true);
  };
  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter(address => address.id !== id));
    toast.success('Address removed');
  };
  const handleSetDefaultAddress = (id: string) => {
    setAddresses(addresses.map(address => ({
      ...address,
      isDefault: address.id === id
    })));
    toast.success('Default address updated');
  };
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'home',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      isDefault: false,
      phone: ''
    });
    setEditingAddressId(null);
    setShowAddressForm(false);
  };
  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <HomeIcon size={16} />;
      case 'work':
        return <BriefcaseIcon size={16} />;
      default:
        return <MapPinIcon size={16} />;
    }
  };
  return <div>
      <h1 className="text-2xl font-bold text-main dark:text-white mb-6">
        My Addresses
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-main dark:text-white">
            Saved Addresses
          </h2>
          <button onClick={() => setShowAddressForm(!showAddressForm)} className="flex items-center text-primary hover:text-primary-dark">
            <PlusCircleIcon size={18} className="mr-1" />
            <span>Add New Address</span>
          </button>
        </div>
        {addresses.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map(address => <div key={address.id} className={`border rounded-lg p-4 ${address.isDefault ? 'border-primary' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    <span className="mr-1">
                      {getAddressTypeIcon(address.type)}
                    </span>
                    <span className="font-medium text-main dark:text-white capitalize">
                      {address.type}
                    </span>
                  </div>
                  {address.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Default
                    </span>}
                </div>
                <p className="text-main dark:text-white font-medium">
                  {address.name}
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {address.street}
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {address.country}
                </p>
                {address.phone && <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                    {address.phone}
                  </p>}
                <div className="flex mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => handleEditAddress(address)} className="flex items-center text-sm text-gray-600 hover:text-primary dark:text-gray-300 mr-4">
                    <PencilIcon size={14} className="mr-1" />
                    Edit
                  </button>
                  <button onClick={() => handleDeleteAddress(address.id)} className="flex items-center text-sm text-gray-600 hover:text-red-500 dark:text-gray-300 mr-4" disabled={address.isDefault}>
                    <TrashIcon size={14} className="mr-1" />
                    Delete
                  </button>
                  {!address.isDefault && <button onClick={() => handleSetDefaultAddress(address.id)} className="flex items-center text-sm text-gray-600 hover:text-primary dark:text-gray-300">
                      Set as default
                    </button>}
                </div>
              </div>)}
          </div> : <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <MapPinIcon size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-3">
              No addresses saved yet
            </p>
            <button onClick={() => setShowAddressForm(true)} className="text-primary hover:underline">
              Add your first address
            </button>
          </div>}
        {showAddressForm && <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-main dark:text-white mb-4">
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </h3>
            <form onSubmit={handleAddressSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address Type
                  </label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white">
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Street Address
                  </label>
                  <input type="text" name="street" value={formData.street} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State / Province
                  </label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Postal / Zip Code
                  </label>
                  <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country
                  </label>
                  <input type="text" name="country" value={formData.country} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleInputChange} className="rounded border-gray-300 text-primary focus:ring-primary" />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      Set as default address
                    </span>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md">
                  {editingAddressId ? 'Update Address' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>}
      </div>
    </div>;
};
export default Addresses;