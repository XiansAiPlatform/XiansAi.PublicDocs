import { useState, useEffect, useCallback } from 'react';
import { useSteps } from '../../../../../context/StepsContext';
import { DocumentService, POADocument } from '../../../services/DocumentService';

export const useDocumentData = () => {
  const { documentId, activeStep } = useSteps();
  const [document, setDocument] = useState<POADocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documentService = DocumentService.getInstance();

  const fetchDocument = useCallback(async (docId: string) => {
    if (!docId || docId === 'new') return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = documentService.getCachedDocument(docId);
      if (cached) {
        setDocument(cached);
        setLoading(false);
        return;
      }

      // Fetch from server
      const doc = await documentService.fetchPOADocument(docId, activeStep);
      setDocument(doc);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[useDocumentData] Error fetching document:', err);
    } finally {
      setLoading(false);
    }
  }, [documentService, activeStep]);

  // Fetch document when documentId changes
  useEffect(() => {
    if (documentId && documentId !== 'new') {
      fetchDocument(documentId);
    } else {
      // Clear document for new/empty routes
      setDocument(null);
      setError(null);
    }
  }, [documentId, fetchDocument]);

  // Subscribe to document updates
  useEffect(() => {
    if (!documentId || documentId === 'new') return;

    const unsubscribe = documentService.subscribeToDocumentUpdates(
      documentId,
      (updatedDocument) => {
        console.log('[useDocumentData] Document updated:', updatedDocument);
        setDocument(updatedDocument);
      }
    );

    return unsubscribe;
  }, [documentId, documentService]);

  const refreshDocument = useCallback(() => {
    if (documentId && documentId !== 'new') {
      fetchDocument(documentId);
    }
  }, [documentId, fetchDocument]);

  return {
    documentId,
    document,
    loading,
    error,
    refreshDocument,
    representatives: document?.representatives || [],
    principal: document?.principal,
    scope: document?.scope,
    conditions: document?.conditions || [],
    witnesses: document?.witnesses || []
  };
}; 