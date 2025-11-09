import React from 'react';

export function AdminFooter() {
  return (
    <footer className="bg-gray-800 text-white p-4 text-center text-sm mt-auto">
      <p>&copy; {new Date().getFullYear()} Admin Panel. All rights reserved.</p>
    </footer>
  );
}
