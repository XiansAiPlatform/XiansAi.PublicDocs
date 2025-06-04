import React from 'react';
import { getThemeColors } from '../../../../../components/theme';

interface AddRepresentativeCardProps {
  onAdd: () => void;
}

const AddRepresentativeCard: React.FC<AddRepresentativeCardProps> = ({ onAdd }) => {
  const theme = getThemeColors('purple');
  
  return (
    <div 
      className={`border-2 border-dashed ${theme.border} rounded-lg p-4 ${theme.bgLight} hover:${theme.buttonSecondaryHover} hover:${theme.border.replace('-200', '-400')} transition-all cursor-pointer flex items-center justify-center min-h-[200px]`}
      onClick={onAdd}
    >
      <div className="text-center">
        <div className={`w-12 h-12 mx-auto mb-3 ${theme.buttonSecondary} rounded-full flex items-center justify-center border ${theme.buttonSecondaryBorder}`}>
          <span className={`${theme.bg.replace('bg-', 'text-')} text-xl font-bold`}>+</span>
        </div>
        <div className={`text-sm font-medium ${theme.text} mb-1`}>Add Representative</div>
        <div className="text-xs text-gray-500">Click to add a new representative</div>
      </div>
    </div>
  );
};

export default AddRepresentativeCard; 