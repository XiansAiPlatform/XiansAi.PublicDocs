import React from 'react';

interface AddRepresentativeCardProps {
  onAdd: () => void;
}

const AddRepresentativeCard: React.FC<AddRepresentativeCardProps> = ({ onAdd }) => {
  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all cursor-pointer flex items-center justify-center min-h-[200px]"
      onClick={onAdd}
    >
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-xl font-bold">+</span>
        </div>
        <div className="text-sm font-medium text-gray-700 mb-1">Add Representative</div>
        <div className="text-xs text-gray-500">Click to add a new representative</div>
      </div>
    </div>
  );
};

export default AddRepresentativeCard; 