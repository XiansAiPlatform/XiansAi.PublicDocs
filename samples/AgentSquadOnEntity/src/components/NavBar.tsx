import React from 'react';

const NavBar: React.FC = () => {
  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-200 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-800">Agent Squad</h1>
      <div className="flex gap-4 items-center text-sm">
        {/* Placeholder navigation items */}
        <a href="#" className="text-gray-600 hover:text-gray-900">
          Home
        </a>
        <a href="#" className="text-gray-600 hover:text-gray-900">
          Docs
        </a>
        <a href="#" className="text-gray-600 hover:text-gray-900">
          Settings
        </a>
      </div>
    </header>
  );
};

export default NavBar; 