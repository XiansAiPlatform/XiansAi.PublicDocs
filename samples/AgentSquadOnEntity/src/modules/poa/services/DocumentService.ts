import { EntityStore } from '../../../middleware/EntityStore';
import { WebSocketHub } from '../../../middleware/WebSocketHub';

export interface POADocument {
  id: string;
  documentId: string;
  type: 'poa_document';
  title: string;
  content: any;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  version: number;
  metadata?: any;
  principal?: {
    userId: string;
    fullName: string;
    nationalId: string;
    address: string;
  };
  scope?: string;
  representatives?: Array<{
    id: string;
    fullName: string;
    nationalId: string;
    relationship: string;
  }>;
  conditions?: Array<{
    id: string;
    type: number;
    text: string;
    targetId?: string;
    createdAt: string;
    updatedAt?: string;
  }>;
  witnesses?: Array<{
    id: string;
    fullName: string;
    nationalId: string;
    relationship?: string;
  }>;
}

export class DocumentService {
  private static instance: DocumentService | null = null;
  private entityStore: EntityStore;
  private webSocketHub: WebSocketHub;
  private pendingRequests: Map<string, {
    resolve: (document: POADocument) => void;
    reject: (error: Error) => void;
    timeout: number;
  }> = new Map();

  private constructor() {
    this.entityStore = EntityStore.getInstance();
    this.webSocketHub = WebSocketHub.getInstance();
    console.log('[DocumentService] Instance created');
  }

  public static getInstance(): DocumentService {
    if (DocumentService.instance === null) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  /**
   * Fetch a POA document by ID via WebSocket
   */
  public async fetchPOADocument(documentId: string, stepIndex: number = 0): Promise<POADocument> {
    // Check if document is already in cache
    const cachedDocument = this.entityStore.getEntityFromCategory<POADocument>('poa', documentId);
    if (cachedDocument) {
      console.log(`[DocumentService] Found cached document: ${documentId}`);
      return cachedDocument;
    }

    return new Promise((resolve, reject) => {
      // Create unique request ID
      const requestId = `fetch_document_${documentId}_${Date.now()}`;

      // Set up timeout
      // const timeout = setTimeout(() => {
      //   this.pendingRequests.delete(requestId);
      //   reject(new Error(`Document fetch timeout for ID: ${documentId}`));
      // }, 30000); // 30 second timeout

      // // Store request
      // this.pendingRequests.set(requestId, { resolve, reject, timeout });

      // // Send message to fetch document
      // const message = {
      //   content: `Fetch POA document with ID: ${documentId}`,
      //   metadata: {
      //     messageType: 'FetchDocument',
      //     documentId: documentId,
      //     requestId: requestId,
      //     category: 'poa'
      //   }
      // };

      // this.webSocketHub.sendMessage(message, stepIndex)
      //   .then(() => {
      //     console.log(`[DocumentService] Document fetch request sent for ID: ${documentId}`);
      //   })
      //   .catch((error) => {
      //     this.pendingRequests.delete(requestId);
      //     clearTimeout(timeout);
      //     reject(new Error(`Failed to send document fetch request: ${error.message}`));
      //   });
    });
  }

  /**
   * Handle document response from WebSocket
   */
  public handleDocumentResponse(message: any): void {
    try {
      const { requestId, documentId, documentData, error } = message;

      if (!requestId || !this.pendingRequests.has(requestId)) {
        console.warn(`[DocumentService] Received response for unknown request: ${requestId}`);
        return;
      }

      const request = this.pendingRequests.get(requestId)!;
      clearTimeout(request.timeout);
      this.pendingRequests.delete(requestId);

      if (error) {
        request.reject(new Error(error));
        return;
      }

      if (!documentData || !documentId) {
        request.reject(new Error('Invalid document response: missing data'));
        return;
      }

      // Transform server response to POADocument format
      const poaDocument: POADocument = {
        id: documentData.id || documentId,
        documentId: documentId,
        type: 'poa_document',
        title: documentData.title || `POA Document ${documentId}`,
        content: documentData,
        status: documentData.status || 'draft',
        createdAt: documentData.createdAt ? new Date(documentData.createdAt) : new Date(),
        updatedAt: new Date(),
        version: documentData.version || 1,
        metadata: documentData.metadata,
        principal: documentData.principal,
        scope: documentData.scope,
        representatives: documentData.representatives || [],
        conditions: documentData.conditions || [],
        witnesses: documentData.witnesses || []
      };

      // Store in EntityStore under 'poa' category
      this.entityStore.addEntityToCategory('poa', documentId, poaDocument);

      console.log(`[DocumentService] Document received and stored: ${documentId}`);
      request.resolve(poaDocument);

    } catch (error) {
      console.error('[DocumentService] Error handling document response:', error);
    }
  }

  /**
   * Subscribe to document updates
   */
  public subscribeToDocumentUpdates(documentId: string, callback: (document: POADocument) => void): () => void {
    return this.entityStore.subscribeToEntities({
      id: `document_${documentId}_${Date.now()}`,
      entityTypes: ['poa_document'],
      entityIds: [documentId],
      callback: (entities, action) => {
        if (entities.length > 0) {
          const document = entities[0] as POADocument;
          if (document.documentId === documentId) {
            callback(document);
          }
        }
      }
    });
  }

  /**
   * Get cached document if available
   */
  public getCachedDocument(documentId: string): POADocument | undefined {
    return this.entityStore.getEntityFromCategory<POADocument>('poa', documentId);
  }

  /**
   * Clear document cache
   */
  public clearCache(): void {
    this.entityStore.clearCategory('poa');
    // Clear any pending requests
    this.pendingRequests.forEach(({ timeout, reject }) => {
      clearTimeout(timeout);
      reject(new Error('Service cache cleared'));
    });
    this.pendingRequests.clear();
  }
} 