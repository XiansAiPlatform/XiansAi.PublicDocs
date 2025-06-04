import React, { useEffect, useRef } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { Representative } from '../types/representative.types';
import { getThemeColors } from '../../../../../components/theme';

interface RepresentativeCardProps {
  representative: Representative;
  index: number;
  isEditing: boolean;
  canRemove: boolean;
  onToggleEdit: (index: number) => void;
  onUpdate: (index: number, field: keyof Representative, value: string) => void;
  onRemove: (index: number) => void;
  onExitEdit: () => void;
}

const RepresentativeCard: React.FC<RepresentativeCardProps> = ({
  representative,
  index,
  isEditing,
  canRemove,
  onToggleEdit,
  onUpdate,
  onRemove,
  onExitEdit
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const theme = getThemeColors('purple');  // Primary theme using custom purple
  const successTheme = getThemeColors('blue');  // Success actions using blue
  const errorTheme = getThemeColors('error');  // Error actions using semantic error

  // Handle click outside to cancel edit mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onExitEdit();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, onExitEdit]);

  const handleCardClick = () => {
    if (!isEditing) {
      onToggleEdit(index);
    }
  };

  return (
    <div 
      ref={cardRef}
      className={`border rounded-lg p-4 bg-white shadow-sm transition-all cursor-pointer ${
        isEditing 
          ? `${theme.border.replace('-200', '-500')} ring-2 ${theme.border.replace('border-', 'ring-')}`
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-center mb-3">

        <div className="flex items-center space-x-2">
          {!representative.id && !isEditing && (
            <button
              className={`text-gray-400 hover:${theme.bg.replace('bg-', 'text-')} transition-colors p-1`}
              title="Click to edit"
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}
          {isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExitEdit();
              }}
              className={`${successTheme.bg.replace('bg-', 'text-')} hover:${successTheme.bgDark.replace('bg-', 'text-')} text-xs px-2 py-1 ${successTheme.bgLight} rounded border ${successTheme.border}`}
              title="Save and exit edit mode"
            >
              ✓ Done
            </button>
          )}
          {canRemove && isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className={`${errorTheme.bg.replace('bg-', 'text-')} hover:${errorTheme.bgDark.replace('bg-', 'text-')} text-xs p-1 rounded`}
              title="Remove representative"
            >
              <FiTrash2 size={14} />
            </button>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <EditMode 
          representative={representative}
          index={index}
          onUpdate={onUpdate}
        />
      ) : (
        <ViewMode representative={representative} />
      )}
    </div>
  );
};

interface EditModeProps {
  representative: Representative;
  index: number;
  onUpdate: (index: number, field: keyof Representative, value: string) => void;
}

const EditMode: React.FC<EditModeProps> = ({ representative, index, onUpdate }) => {
  const theme = getThemeColors('purple');
  
  return (
    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          value={representative.fullName}
          onChange={(e) => onUpdate(index, 'fullName', e.target.value)}
          className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 ${theme.buttonPrimaryFocus.replace('focus:', '')} bg-white`}
          placeholder="Enter full name"
          autoFocus
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          National ID *
        </label>
        <input
          type="text"
          value={representative.nationalId}
          onChange={(e) => onUpdate(index, 'nationalId', e.target.value)}
          className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 ${theme.buttonPrimaryFocus.replace('focus:', '')} bg-white`}
          placeholder="Enter national ID"
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Relationship *
        </label>
        <input
          type="text"
          value={representative.relationship}
          onChange={(e) => onUpdate(index, 'relationship', e.target.value)}
          className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 ${theme.buttonPrimaryFocus.replace('focus:', '')} bg-white`}
          placeholder="e.g., Backup Fullmektig"
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={representative.email || ''}
          onChange={(e) => onUpdate(index, 'email', e.target.value)}
          className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 ${theme.buttonPrimaryFocus.replace('focus:', '')} bg-white`}
          placeholder="email@example.com"
        />
      </div>
    </div>
  );
};

interface ViewModeProps {
  representative: Representative;
}

const ViewMode: React.FC<ViewModeProps> = ({ representative }) => (
  <div className="space-y-3">
    <div>
      <div className="text-xs font-medium text-gray-700 mb-1">Full Name</div>
      <div className="text-sm text-gray-900 py-1">
        {representative.fullName || <span className="text-gray-400 italic">Not specified</span>}
      </div>
    </div>
    
    <div>
      <div className="text-xs font-medium text-gray-700 mb-1">National ID</div>
      <div className="text-sm text-gray-900 py-1 font-mono">
        {representative.nationalId || <span className="text-gray-400 italic">Not specified</span>}
      </div>
    </div>
    
    <div>
      <div className="text-xs font-medium text-gray-700 mb-1">Relationship</div>
      <div className="text-sm text-gray-900 py-1">
        {representative.relationship || <span className="text-gray-400 italic">Not specified</span>}
      </div>
    </div>
    
    {representative.email && (
      <div>
        <div className="text-xs font-medium text-gray-700 mb-1">Email</div>
        <div className="text-sm text-gray-900 py-1">
          {representative.email}
        </div>
      </div>
    )}
  </div>
);

export default RepresentativeCard; 