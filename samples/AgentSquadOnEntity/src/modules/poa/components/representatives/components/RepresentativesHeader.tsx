import React from 'react';
import { Representative, ActivityData } from '../types/representative.types';
import { countRepresentativesWithNames, getValidRepresentatives } from '../utils/representative.utils';
import { getThemeColors } from '../../../../../components/theme';

interface RepresentativesHeaderProps {
  representatives: Representative[];
  latestActivity: ActivityData | null;
  onSave: () => void;
}

const RepresentativesHeader: React.FC<RepresentativesHeaderProps> = ({
  representatives,
  onSave
}) => {
  const representativeCount = countRepresentativesWithNames(representatives);
  const hasValidData = getValidRepresentatives(representatives).length > 0;
  
  const successTheme = getThemeColors('warm');   // Using blue for success/save actions

  return (
    <header className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mt-1">Manage the representatives</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            {representativeCount} representative(s)
          </div>
          
          <button
            onClick={onSave}
            disabled={!hasValidData}
            className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center space-x-2 ${
              hasValidData
                ? `${successTheme.buttonPrimary} text-white ${successTheme.buttonPrimaryHover}`
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
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
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17,21 17,13 7,13 7,21"></polyline>
              <polyline points="7,3 7,8 15,8"></polyline>
            </svg>
            <span>Save</span>
          </button>
        </div>
      </div>
      
    </header>
  );
};

export default RepresentativesHeader; 