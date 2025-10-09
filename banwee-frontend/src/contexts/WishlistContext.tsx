import React, { useEffect, useState, createContext, useContext } from 'react';
interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
}
interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
export const WishlistProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  useEffect(() => {
    // Load wishlist from local storage
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      setItems(JSON.parse(savedWishlist));
    }
  }, []);
  // Save wishlist to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(items));
  }, [items]);
  const addItem = (item: WishlistItem) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(i => i.id === item.id);
      if (existingItem) {
        // Item already in wishlist, don't add again
        return currentItems;
      } else {
        // Add new item
        return [...currentItems, item];
      }
    });
  };
  const removeItem = (id: string) => {
    setItems(items => items.filter(item => item.id !== id));
  };
  const isInWishlist = (id: string) => {
    return items.some(item => item.id === id);
  };
  const clearWishlist = () => {
    setItems([]);
  };
  return <WishlistContext.Provider value={{
    items,
    addItem,
    removeItem,
    isInWishlist,
    clearWishlist
  }}>
      {children}
    </WishlistContext.Provider>;
};