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
    saveRepresentatives,
    document,
    documentLoading,
    documentError
  } = useRepresentativesData();

  // Filter representatives to only show those with data or currently being edited
  const displayedRepresentatives = representatives.filter((rep, index) => 
    shouldDisplayRepresentative(rep, index, editingIndex)
  );

  const handleExitEdit = () => {
    setEditingIndex(null);
  };

  // Show loading state while fetching document
  if (documentLoading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <RepresentativesHeader
          representatives={[]}
          latestActivity={null}
          onClearAll={clearAllRepresentatives}
          onSave={saveRepresentatives}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading document...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if document failed to load
  if (documentError) {
    return (
      <div className="h-full flex flex-col bg-white">
        <RepresentativesHeader
          representatives={representatives}
          latestActivity={latestActivity}
          onClearAll={clearAllRepresentatives}
          onSave={saveRepresentatives}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Document Error</h3>
              <p className="text-red-600 mb-4">{documentError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            
            {/* Document Info Banner (if document is loaded) */}
            {document && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">
                      Document: {document.title}
                    </h3>
                    <p className="text-xs text-blue-600 mt-1">
                      Status: {document.status} • Last updated: {document.updatedAt.toLocaleString()}
                    </p>
                    {document.principal && (
                      <p className="text-xs text-blue-600 mt-1">
                        Principal: {document.principal.fullName}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-blue-500">
                    ID: {document.documentId}
                  </div>
                </div>
              </div>
            )}
            
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