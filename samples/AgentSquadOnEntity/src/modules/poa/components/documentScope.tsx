import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DocumentService, Document } from '../services/DocumentService';
import { useSteps } from '../../../context/StepsContext';
import { getThemeColors } from '../../../components/theme';
import { WebSocketHub } from '../../../middleware/WebSocketHub';
import { getAgentById } from '../steps';

const DocumentScope: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentService] = useState(() => DocumentService.getInstance());
  const [webSocketHub] = useState(() => WebSocketHub.getInstance());
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'initializing' | 'waiting_for_connection' | 'ready' | 'failed'>('initializing');
  
  // Get theme colors
  const { steps, activeStep } = useSteps();
  const currentStep = steps[activeStep];
  const themeColors = currentStep ? getThemeColors(currentStep.theme) : null;

  // Check connection readiness for document data flow agent
  const checkConnectionReadiness = (): boolean => {
    const agent = getAgentById('document_data_flow');
    if (!agent) {
      console.warn('[DocumentScope] Document data flow agent not found');
      return false;
    }

    const connectionState = webSocketHub.getAgentConnectionStateByWorkflowId(agent.workflowId);
    return connectionState?.status === 'connected';
  };

  // Wait for connection to be ready
  const waitForConnection = (maxWaitTime: number = 15000): Promise<boolean> => {
    const startTime = Date.now();
    const checkInterval = 500; // Check every 500ms

    return new Promise((resolve) => {
      const checkConnection = () => {
        if (checkConnectionReadiness()) {
          console.log('[DocumentScope] Connection ready for document fetch');
          resolve(true);
          return;
        }

        // Check if we've exceeded max wait time
        if (Date.now() - startTime >= maxWaitTime) {
          console.warn('[DocumentScope] Timeout waiting for connection');
          resolve(false);
          return;
        }

        // Continue waiting
        setTimeout(checkConnection, checkInterval);
      };

      checkConnection();
    });
  };

  useEffect(() => {
    const initializeDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        setConnectionStatus('initializing');
        
        if (!documentId) {
          setError('No document ID found in URL');
          setLoading(false);
          setConnectionStatus('failed');
          return;
        }

        console.log(`[DocumentScope] Initializing document: ${documentId}`);

        // First, try to find existing document in EntityStore
        let doc = documentService.findExistingDocument(documentId);
        
        if (doc) {
          console.log(`[DocumentScope] Found existing document in EntityStore: ${documentId}`);
          setDocument(doc);
          setLoading(false);
          setConnectionStatus('ready');
          return;
        }

        // Check if connection is already ready
        if (checkConnectionReadiness()) {
          console.log(`[DocumentScope] Connection already ready, fetching document: ${documentId}`);
          setConnectionStatus('ready');
          
          try {
            doc = await documentService.fetchPOADocument(documentId);
            if (doc) {
              console.log(`[DocumentScope] Successfully fetched document: ${documentId}`);
              setDocument(doc);
            } else {
              throw new Error('Failed to load document - document not found');
            }
          } catch (fetchError) {
            console.error('[DocumentScope] Document fetch failed:', fetchError);
            
            // Final attempt: check EntityStore again
            doc = documentService.findExistingDocument(documentId);
            if (doc) {
              console.log(`[DocumentScope] Found document in EntityStore after failed fetch: ${documentId}`);
              setDocument(doc);
            } else {
              throw fetchError;
            }
          }
        } else {
          // Wait for connection to be established
          console.log(`[DocumentScope] Waiting for connection to be established for document: ${documentId}`);
          setConnectionStatus('waiting_for_connection');
          
          const connectionReady = await waitForConnection(15000);
          
          if (!connectionReady) {
            throw new Error('Connection timeout: Unable to establish connection to document service within 15 seconds. The service may be unavailable or experiencing issues.');
          }

          console.log(`[DocumentScope] Connection established, now fetching document: ${documentId}`);
          setConnectionStatus('ready');
          
          try {
            doc = await documentService.fetchPOADocument(documentId);
            if (doc) {
              console.log(`[DocumentScope] Successfully fetched document via WebSocket: ${documentId}`);
              setDocument(doc);
            } else {
              throw new Error('Failed to load document - document not found');
            }
          } catch (fetchError) {
            console.error('[DocumentScope] WebSocket fetch failed:', fetchError);
            
            // Final attempt: check EntityStore again in case document was loaded during the fetch attempt
            doc = documentService.findExistingDocument(documentId);
            if (doc) {
              console.log(`[DocumentScope] Found document in EntityStore after failed fetch: ${documentId}`);
              setDocument(doc);
            } else {
              throw fetchError; // Re-throw the original fetch error
            }
          }
        }

      } catch (err) {
        console.error('[DocumentScope] Error loading document:', err);
        let errorMessage = 'Failed to load document';
        
        if (err instanceof Error) {
          if (err.message.includes('Connection timeout') || err.message.includes('No connection available')) {
            errorMessage = 'Unable to connect to document service. Please check your internet connection and try again.';
          } else if (err.message.includes('timeout')) {
            errorMessage = 'Document loading timed out. Please check your connection and try again.';
          } else if (err.message.includes('document not found')) {
            errorMessage = `Document with ID "${documentId}" was not found. Please verify the document ID and try again.`;
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        setConnectionStatus('failed');
      } finally {
        setLoading(false);
      }
    };

    initializeDocument();

    // Subscribe to document updates
    let unsubscribe: (() => void) | undefined;
    if (documentId) {
      unsubscribe = documentService.subscribeToDocumentUpdates(documentId, (updatedDoc) => {
        console.log('[DocumentScope] Document updated:', updatedDoc);
        setDocument(updatedDoc);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [documentService, webSocketHub, documentId]);

  const retryDocumentLoad = async () => {
    if (!documentId) return;
    
    console.log(`[DocumentScope] Manual retry attempt ${retryCount + 1} for document: ${documentId}`);
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    setConnectionStatus('initializing');
    
    try {
      // Wait for connection to be ready before retrying
      console.log('[DocumentScope] Waiting for connection before retry...');
      setConnectionStatus('waiting_for_connection');
      
      const connectionReady = await waitForConnection(10000);
      
      if (!connectionReady) {
        throw new Error('Connection still not available after retry. Please check your internet connection.');
      }

      setConnectionStatus('ready');
      
      // First try to refresh the document via WebSocket
      const refreshedDoc = await documentService.refreshDocument(documentId);
      if (refreshedDoc) {
        setDocument(refreshedDoc);
        setLoading(false);
        return;
      }
      
      // If refresh fails, try comprehensive search again
      const existingDoc = documentService.findExistingDocument(documentId);
      if (existingDoc) {
        setDocument(existingDoc);
        setLoading(false);
        return;
      }
      
      throw new Error('Document not found after retry attempts');
    } catch (err) {
      console.error('[DocumentScope] Retry failed:', err);
      setError(err instanceof Error ? err.message : 'Retry failed');
      setConnectionStatus('failed');
      setLoading(false);
    }
  };

  // Render loading state with connection status information
  if (loading) {
    const getLoadingMessage = () => {
      switch (connectionStatus) {
        case 'initializing':
          return 'Initializing document service...';
        case 'waiting_for_connection':
          return 'Establishing connection to document service...';
        case 'ready':
          return 'Loading document...';
        default:
          return 'Please wait while we retrieve your document...';
      }
    };

    const getLoadingDetail = () => {
      switch (connectionStatus) {
        case 'waiting_for_connection':
          return 'This may take a few seconds while connections are established.';
        case 'ready':
          return 'Fetching document data from server...';
        default:
          return 'Setting up document service...';
      }
    };

    return (
      <div className={`h-full flex items-center justify-center bg-gradient-to-br from-slate-50 ${themeColors?.bgLight || 'to-blue-50'}`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-3 ${themeColors?.bg?.replace('bg-', 'border-') || 'border-blue-600'} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{getLoadingMessage()}</h3>
          <p className="text-gray-600 text-sm">{getLoadingDetail()}</p>
          {connectionStatus === 'waiting_for_connection' && (
            <div className="mt-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                Connecting to document service... This usually completes within 5-10 seconds.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Document</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={retryDocumentLoad} 
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Retrying...' : 'Retry Loading Document'}
            </button>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500">Retry attempts: {retryCount}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Document ID: {documentId}
            </p>
            {connectionStatus === 'failed' && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  If the problem persists, please refresh the page or check your internet connection.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Document Found</h3>
          <p className="text-gray-600">Please select a valid document to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full bg-gradient-to-br from-slate-50 ${themeColors?.bgLight || 'to-blue-50'} p-4`}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Scope Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <div className={`w-8 h-8 ${themeColors?.bgLight || 'bg-blue-100'} rounded-xl flex items-center justify-center mr-3`}>
              <svg className={`w-4 h-4 ${themeColors?.bg?.replace('bg-', 'text-') || 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Document Scope</h2>
              <p className="text-xs text-gray-500">Purpose and authority outlined in this document</p>
            </div>
          </div>
          
          <div className={`bg-gradient-to-r ${themeColors?.bgLight || 'from-blue-50'} to-indigo-50 rounded-xl p-4 border ${themeColors?.border || 'border-blue-100'}`}>
            {document.scope ? (
              <p className="text-gray-800 leading-relaxed">{document.scope}</p>
            ) : (
              <p className="text-gray-500 italic">No scope defined for this document</p>
            )}
          </div>
        </div>

        {/* Principal Information Section */}
        {document.principal && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <div className={`w-8 h-8 ${themeColors?.bgLight || 'bg-emerald-100'} rounded-xl flex items-center justify-center mr-3`}>
                <svg className={`w-4 h-4 ${themeColors?.bg?.replace('bg-', 'text-') || 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Principal Information</h2>
                <p className="text-xs text-gray-500">The individual granting authority</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-medium text-sm">
                    {document.principal.fullName}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">National ID</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm">
                    {document.principal.nationalId}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 min-h-[2.5rem] flex items-center text-sm">
                    {document.principal.address}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">User ID</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-xs">
                    {document.principal.userId}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Status Footer */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <span className="text-xs font-medium text-gray-700 mr-2">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  document.status === 'approved' ? 'bg-green-100 text-green-800' :
                  document.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                  document.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {document.status.charAt(0).toUpperCase() + document.status.slice(1).replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-xs font-medium text-gray-700 mr-2">Version:</span>
                <span className="text-xs text-gray-900 font-mono">{document.version}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {document.updatedAt.toLocaleDateString()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DocumentScope; 