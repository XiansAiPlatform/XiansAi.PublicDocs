import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiUser, FiSettings, FiLogOut, FiPlus, FiFileText } from 'react-icons/fi';
import Logo from './Logo';

const NavBar: React.FC = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDocumentMenuOpen, setIsDocumentMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const documentMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (documentMenuRef.current && !documentMenuRef.current.contains(event.target as Node)) {
        setIsDocumentMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="h-14 bg-white border-b border-neutral-200 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Logo className="h-10" />
            <nav className="hidden sm:flex items-center gap-6">
              <a href="#" className="text-sm font-medium text-neutral-900 hover:text-primary transition-colors">Planner</a>
              <a href="#" className="text-sm font-medium text-neutral-900 hover:text-primary transition-colors">Valuables</a>
              <a href="#" className="text-sm font-medium text-neutral-900 hover:text-primary transition-colors">Relationships</a>
              <a href="#" className="text-sm font-medium text-neutral-900 hover:text-primary transition-colors">Documents</a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Document Creation Button */}
            <div className="relative" ref={documentMenuRef}>
              <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                onClick={() => setIsDocumentMenuOpen(!isDocumentMenuOpen)}
              >
                <FiPlus className="w-4 h-4" />
                <span>Document</span>
                <FiChevronDown className={`w-4 h-4 transition-transform ${isDocumentMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDocumentMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] w-48 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50">
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors font-normal"
                    onClick={() => setIsDocumentMenuOpen(false)}
                  >
                    <FiFileText size={16} />
                    Testament
                  </a>
                  
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors font-normal"
                    onClick={() => setIsDocumentMenuOpen(false)}
                  >
                    <FiFileText size={16} />
                    Power of Attorney
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 relative" ref={profileMenuRef}>
              <button
                className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-primary transition-colors"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-neutral-600" />
                </div>
                <span className="hidden sm:inline">Account</span>
                <FiChevronDown className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-4 top-[calc(100%+0.5rem)] w-56 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-sm font-medium text-neutral-900 text-balance">John Doe</p>
                    <p className="text-xs text-neutral-500 font-normal">john.doe@company.com</p>
                  </div>
                  
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors font-normal"
                  >
                    <FiUser size={16} />
                    Profile
                  </a>
                  
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors font-normal"
                  >
                    <FiSettings size={16} />
                    Settings
                  </a>
                  
                  <hr className="my-1 border-neutral-100" />
                  
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-normal"
                  >
                    <FiLogOut size={16} />
                    Sign out
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar; 