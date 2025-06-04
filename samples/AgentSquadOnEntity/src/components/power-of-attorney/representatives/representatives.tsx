import React from 'react';
import { useRepresentativesData } from './hooks/useRepresentativesData';
import { shouldDisplayRepresentative } from './utils/representative.utils';
import RepresentativesHeader from './components/RepresentativesHeader';
import RepresentativeCard from './components/RepresentativeCard';
import AddRepresentativeCard from './components/AddRepresentativeCard';

const Representatives: React.FC = () => {
  const {
    representatives,
    latestActivity,
    editingIndex,
    setEditingIndex,
    addRepresentative,
    updateRepresentative,
    removeRepresentative,
    toggleEditMode,
    clearAllRepresentatives,
    saveRepresentatives
  } = useRepresentativesData();

  // Filter representatives to only show those with data or currently being edited
  const displayedRepresentatives = representatives.filter((rep, index) => 
    shouldDisplayRepresentative(rep, index, editingIndex)
  );

  const handleExitEdit = () => {
    setEditingIndex(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <RepresentativesHeader
        representatives={representatives}
        latestActivity={latestActivity}
        onClearAll={clearAllRepresentatives}
        onSave={saveRepresentatives}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-4">
            
            {/* Representatives Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-2">
              {displayedRepresentatives.map((rep, displayIndex) => {
                // Find the original index in the full representatives array
                const originalIndex = representatives.findIndex(r => r === rep);
                const isEditing = editingIndex === originalIndex;
                const canRemove = representatives.length > 1;
                
                return (
                  <RepresentativeCard
                    key={originalIndex}
                    representative={rep}
                    index={originalIndex}
                    isEditing={isEditing}
                    canRemove={canRemove}
                    onToggleEdit={toggleEditMode}
                    onUpdate={updateRepresentative}
                    onRemove={removeRepresentative}
                    onExitEdit={handleExitEdit}
                  />
                );
              })}
              
              {/* Add Representative Card */}
              <AddRepresentativeCard onAdd={addRepresentative} />
            </div>
            
            {/* Add bottom padding to ensure content is not hidden by footer */}
            <div className="pb-20"></div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Representatives; 