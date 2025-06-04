import React, { useState, useEffect, useRef } from 'react';
import { useEntities } from '../context/EntityContext';
import { EntityStore } from '../middleware/EntityStore';
import { DocumentService, Document } from '../modules/poa/services/DocumentService';

interface DocumentCategory {
  category: string;
  documents: Document[];
}

const EntityDemo: React.FC = () => {
  const { loading, error, getStats } = useEntities();
  const entityStore = useRef(EntityStore.getInstance());
  const documentService = useRef(DocumentService.getInstance());
  
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'view'>('list');
  const [updates, setUpdates] = useState<string[]>([]);

  // Subscribe to entity updates
  useEffect(() => {
    const unsubscribe = entityStore.current.subscribe(() => {
      updateDocumentCategories();
    });

    // Initial load
    updateDocumentCategories();

    return unsubscribe;
  }, []);

  // Subscribe to document updates for logging
  useEffect(() => {
    const unsubscribe = entityStore.current.subscribeToEntities({
      id: 'document_demo_subscription',
      callback: (entities, action) => {
        const timestamp = new Date().toLocaleTimeString();
        const documentEntities = entities.filter(e => 
          e.type === 'poa_document' || 
          (e as any).documentId || 
          (e as any).title
        );
        
        if (documentEntities.length > 0) {
          const message = `[${timestamp}] ${action.type}: ${documentEntities.length} documents`;
          setUpdates(prev => [message, ...prev.slice(0, 9)]);
        }
      }
    });

    return unsubscribe;
  }, []);

  const updateDocumentCategories = () => {
    const categories = entityStore.current.getAllDocumentCategories();
    setDocumentCategories(categories.map(cat => ({
      category: cat.category,
      documents: cat.documents as Document[]
    })));
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
    setViewMode('view');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedDocument(null);
  };

  const getTotalDocuments = () => {
    return documentCategories.reduce((total, cat) => total + cat.documents.length, 0);
  };

  const getStatusCounts = () => {
    const counts = { draft: 0, pending_review: 0, approved: 0, rejected: 0 };
    documentCategories.forEach(cat => {
      cat.documents.forEach(doc => {
        if (doc.status in counts) {
          counts[doc.status]++;
        }
      });
    });
    return counts;
  };

  const refreshDocuments = () => {
    // Clear cache and trigger refresh
    documentService.current.clearCache();
    updateDocumentCategories();
  };

  const stats = getStats();
  const statusCounts = getStatusCounts();

  if (viewMode === 'view' && selectedDocument) {
    return (
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Back to Documents
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Document Viewer</h1>
          </div>
          <div className="text-sm text-gray-500">
            Document ID: {selectedDocument.documentId}
          </div>
        </div>

        {/* Document Details */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Metadata */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Information</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Title:</p>
                <p className="text-lg text-gray-900">{selectedDocument.title}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status:</p>
                  <p className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                    selectedDocument.status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedDocument.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                    selectedDocument.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedDocument.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Version:</p>
                  <p className="text-sm text-gray-600">{selectedDocument.version}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Created:</p>
                  <p className="text-sm text-gray-600">{selectedDocument.createdAt.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Updated:</p>
                  <p className="text-sm text-gray-600">{selectedDocument.updatedAt.toLocaleString()}</p>
                </div>
              </div>

              {selectedDocument.principal && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Principal:</p>
                  <div className="mt-1 p-3 bg-gray-50 rounded">
                    <p className="font-medium">{selectedDocument.principal.fullName}</p>
                    <p className="text-sm text-gray-600">ID: {selectedDocument.principal.nationalId}</p>
                    <p className="text-sm text-gray-600">{selectedDocument.principal.address}</p>
                  </div>
                </div>
              )}

              {selectedDocument.scope && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Scope:</p>
                  <p className="text-sm text-gray-600">{selectedDocument.scope}</p>
                </div>
              )}
            </div>
          </div>

          {/* Document Content & Structure */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Structure</h2>
            
            <div className="space-y-4">
              {selectedDocument.representatives && selectedDocument.representatives.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Representatives ({selectedDocument.representatives.length}):</p>
                  <div className="space-y-2">
                    {selectedDocument.representatives.map((rep, index) => (
                      <div key={rep.id || index} className="p-2 bg-blue-50 rounded text-sm">
                        <p className="font-medium">{rep.fullName}</p>
                        <p className="text-gray-600">ID: {rep.nationalId}</p>
                        <p className="text-gray-600">Role: {rep.relationship}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDocument.witnesses && selectedDocument.witnesses.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Witnesses ({selectedDocument.witnesses.length}):</p>
                  <div className="space-y-2">
                    {selectedDocument.witnesses.map((witness, index) => (
                      <div key={witness.id || index} className="p-2 bg-green-50 rounded text-sm">
                        <p className="font-medium">{witness.fullName}</p>
                        <p className="text-gray-600">ID: {witness.nationalId}</p>
                        {witness.relationship && <p className="text-gray-600">Relation: {witness.relationship}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDocument.conditions && selectedDocument.conditions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Conditions ({selectedDocument.conditions.length}):</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedDocument.conditions.map((condition, index) => (
                      <div key={condition.id || index} className="p-2 bg-yellow-50 rounded text-sm">
                        <p className="text-gray-900">{condition.text}</p>
                        <p className="text-xs text-gray-500 mt-1">Type: {condition.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Raw Data */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Raw Document Data</h2>
          <pre className="p-4 bg-gray-100 rounded text-xs overflow-x-auto max-h-60 overflow-y-auto">
            {JSON.stringify(selectedDocument, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Management System</h1>
        <p className="text-gray-600">
          View and manage documents from all categories stored in the EntityStore via DocumentService.
        </p>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">Loading documents...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Overview</h3>
          <p className="text-sm text-gray-600">Total Documents: {getTotalDocuments()}</p>
          <p className="text-sm text-gray-600">Categories: {documentCategories.length}</p>
          <p className="text-sm text-gray-600">Entity Store: {stats.totalEntities} entities</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Status</h3>
          <p className="text-sm text-gray-600">Draft: {statusCounts.draft}</p>
          <p className="text-sm text-gray-600">Pending: {statusCounts.pending_review}</p>
          <p className="text-sm text-gray-600">Approved: {statusCounts.approved}</p>
          <p className="text-sm text-gray-600">Rejected: {statusCounts.rejected}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Updates</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {updates.map((update, index) => (
              <p key={index} className="text-xs text-gray-500 font-mono">
                {update}
              </p>
            ))}
            {updates.length === 0 && (
              <p className="text-xs text-gray-400">No recent updates</p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Actions</h3>
          <div className="space-y-2">
            <button
              onClick={refreshDocuments}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Documents
            </button>
            <button
              onClick={() => documentService.current.clearCache()}
              className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Document Categories */}
      <div className="flex-1 min-h-0">
        {documentCategories.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow border text-center">
            <p className="text-gray-500">No documents found in any category.</p>
            <p className="text-sm text-gray-400 mt-2">Documents will appear here when they are loaded by DocumentService.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 h-full">
            {documentCategories.map(({ category, documents }) => (
              <div key={category} className="bg-white rounded-lg shadow border flex flex-col">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category} ({documents.length})
                  </h3>
                  <p className="text-sm text-gray-500">Category: {category}</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className="p-3 border rounded cursor-pointer transition-colors hover:bg-gray-50 hover:border-gray-300"
                        onClick={() => handleDocumentClick(doc)}
                      >
                        <p className="font-medium text-sm text-gray-900 truncate">{doc.title}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {doc.documentId}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                            doc.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                            doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {doc.status}
                          </span>
                          <span className="text-xs text-gray-400">v{doc.version}</span>
                        </div>
                        {doc.principal && (
                          <p className="text-xs text-gray-500 mt-1">Principal: {doc.principal.fullName}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityDemo; 