import { EntityStore } from '../../../middleware/EntityStore';
import { WebSocketHub } from '../../../middleware/WebSocketHub';
import { getAgentById } from '../steps';

export interface Document {
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
    resolve: (document: Document) => void;
    reject: (error: Error) => void;
    timeout: number;
  }> = new Map();
  private unsubscribeFromMetadata?: () => void;

  private constructor() {
    this.entityStore = EntityStore.getInstance();
    this.webSocketHub = WebSocketHub.getInstance();
    console.log('[DocumentService] Instance created');
    
    // Subscribe to document response metadata messages
    this.subscribeToDocumentResponses();
    
    // Automatically fetch document from URL (with connection readiness check)
    this.initializeFromURL();
  }

  public static getInstance(): DocumentService {
    if (DocumentService.instance === null) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  /**
   * Initialize document from URL parameters
   */
  private async initializeFromURL(): Promise<void> {
    try {
      const documentId = this.extractDocumentIdFromURL();
      if (documentId) {
        console.log(`[DocumentService] Auto-fetching document from URL: ${documentId}`);
        // Wait for connection to be ready before fetching
        await this.fetchPOADocumentWithConnectionWait(documentId);
      } else {
        console.log('[DocumentService] No documentId found in URL');
      }
    } catch (error) {
      console.error('[DocumentService] Error initializing from URL:', error);
    }
  }

  /**
   * Extract document ID from current URL
   */
  private extractDocumentIdFromURL(): string | null {
    if (typeof window === 'undefined') return null;
    
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
    
    // Look for POA pattern: /poa/:documentId/:stepSlug
    if (pathParts.length >= 2 && pathParts[0] === 'poa') {
      const documentId = pathParts[1];
      // Make sure it's not 'new' which indicates a new document
      if (documentId && documentId !== 'new') {
        return documentId;
      }
    }
    
    // Legacy patterns for backward compatibility
    // e.g., /document/123, /poa/document/123, etc.
    const documentIndex = pathParts.findIndex(part => part === 'document');
    if (documentIndex !== -1 && pathParts[documentIndex + 1]) {
      return pathParts[documentIndex + 1];
    }
    
    // Also check query parameters
    return url.searchParams.get('documentId');
  }

  /**
   * Wait for agent connection to be ready
   */
  private async waitForAgentConnection(agentId: string, maxWaitTime: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 500; // Check every 500ms

    return new Promise((resolve) => {
      const checkConnection = () => {
        const agent = this.getAgentById(agentId);
        if (!agent) {
          console.warn(`[DocumentService] Agent not found: ${agentId}`);
          resolve(false);
          return;
        }

        const connectionState = this.webSocketHub.getAgentConnectionStateByWorkflowId(agent.workflowId);
        
        if (connectionState?.status === 'connected') {
          console.log(`[DocumentService] Agent ${agentId} connection ready`);
          resolve(true);
          return;
        }

        // Check if we've exceeded max wait time
        if (Date.now() - startTime >= maxWaitTime) {
          console.warn(`[DocumentService] Timeout waiting for agent ${agentId} connection`);
          resolve(false);
          return;
        }

        // Continue waiting
        setTimeout(checkConnection, checkInterval);
      };

      checkConnection();
    });
  }

  /**
   * Get agent by ID - helper method
   */
  private getAgentById(agentId: string): any {
    return getAgentById(agentId);
  }

  /**
   * Fetch POA document with connection waiting and retry logic
   */
  private async fetchPOADocumentWithConnectionWait(documentId: string): Promise<Document | null> {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[DocumentService] Fetch attempt ${attempt}/${maxRetries} for document: ${documentId}`);
        
        // Wait for connection to be ready
        const connectionReady = await this.waitForAgentConnection('document_data_flow', 10000);
        
        if (!connectionReady) {
          throw new Error('Agent connection not ready within timeout');
        }

        // Attempt to fetch the document
        const document = await this.fetchPOADocument(documentId);
        console.log(`[DocumentService] Successfully fetched document on attempt ${attempt}`);
        return document;

      } catch (error) {
        console.warn(`[DocumentService] Attempt ${attempt} failed:`, error);
        
        // If this is the last attempt, don't retry
        if (attempt === maxRetries) {
          console.error(`[DocumentService] All ${maxRetries} attempts failed for document: ${documentId}`);
          return null;
        }

        // Wait before retrying
        console.log(`[DocumentService] Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return null;
  }

  /**
   * Fetch a POA document by ID via WebSocket
   */
  public async fetchPOADocument(documentId: string, stepIndex: number = 0): Promise<Document> {
    // Check if document is already in cache
    const cachedDocument = this.entityStore.getEntityFromCategory<Document>('poa', documentId);
    if (cachedDocument) {
      console.log(`[DocumentService] Found cached document: ${documentId}`);
      return cachedDocument;
    }

    return new Promise((resolve, reject) => {
      // Create unique request ID
      const requestId = `fetch_document_${documentId}_${Date.now()}`;

      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Document fetch timeout for ID: ${documentId}`));
      }, 30000); // 30 second timeout

      // Store request
      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      // Send message to fetch document
      const metadata = {
          messageType: 'FetchDocument',
          documentId: documentId,
          requestId: requestId
        };

      this.webSocketHub.sendMetadataToAgent(metadata, 'document_data_flow')
        .then(() => {
          console.log(`[DocumentService] Document fetch request sent for ID: ${documentId}`);
        })
        .catch((error) => {
          this.pendingRequests.delete(requestId);
          clearTimeout(timeout);
          reject(new Error(`Failed to send document fetch request: ${error.message}`));
        });
    });
  }

  /**
   * Subscribe to document response metadata messages from WebSocket
   */
  private subscribeToDocumentResponses(): void {
    this.unsubscribeFromMetadata = this.webSocketHub.subscribeToMetadata(
      'document_service',
      ['DocumentResponse'], // Listen for these message types
      (message) => {
        console.log('[DocumentService] Received metadata message:', message);
        this.handleDocumentResponse(message);
      }
    );
    console.log('[DocumentService] Subscribed to document response metadata messages');
  }

  /**
   * Handle document response from WebSocket
   */
  private handleDocumentResponse(metadata: any): void {
    try {
      const { messageType, requestId } = metadata;

      if (messageType !== 'DocumentResponse') {
        console.warn(`[DocumentService] Received unexpected message type: ${messageType}`);
        return;
      }
      if (!requestId || !this.pendingRequests.has(requestId)) {
        console.warn(`[DocumentService] Received response for unknown request: ${requestId}`);
        return;
      }

      const { auditResult } = metadata;

      const request = this.pendingRequests.get(requestId)!;
      clearTimeout(request.timeout);
      this.pendingRequests.delete(requestId);

      // Transform server response to POADocument format
      const rawDocument = auditResult.document;
      console.log('[DocumentService] Raw document from server:', rawDocument);

      // Get documentId from URL or from the document itself
      const urlDocumentId = this.extractDocumentIdFromURL();
      const serverDocumentId = rawDocument?.documentId || rawDocument?.id;
      const documentId = urlDocumentId || serverDocumentId;

      if (!documentId) {
        console.error('[DocumentService] No documentId found in URL or server response');
        request.reject(new Error('No documentId found'));
        return;
      }

      // Ensure document has required properties with proper types
      const poaDocument: Document = {
        id: rawDocument?.id || documentId,
        documentId: documentId,
        type: 'poa_document',
        title: rawDocument?.title || 'Untitled Document',
        content: rawDocument?.content || {},
        status: rawDocument?.status || 'draft',
        createdAt: rawDocument?.createdAt ? new Date(rawDocument.createdAt) : new Date(),
        updatedAt: rawDocument?.updatedAt ? new Date(rawDocument.updatedAt) : new Date(),
        version: rawDocument?.version || 1,
        metadata: rawDocument?.metadata,
        principal: rawDocument?.principal,
        scope: rawDocument?.scope,
        representatives: rawDocument?.representatives || [],
        conditions: rawDocument?.conditions || [],
        witnesses: rawDocument?.witnesses || []
      };

      // Store in EntityStore under 'poa' category
      this.entityStore.addEntityToCategory('poa', documentId, poaDocument);

      console.log(`[DocumentService] Document received and stored: ${poaDocument.documentId}`);
      request.resolve(poaDocument);

    } catch (error) {
      console.error('[DocumentService] Error handling document response:', error);
      // Find and reject any pending request if we can't determine which one failed
      const firstPendingRequest = Array.from(this.pendingRequests.values())[0];
      if (firstPendingRequest) {
        clearTimeout(firstPendingRequest.timeout);
        firstPendingRequest.reject(new Error(`Document parsing error: ${error}`));
      }
    }
  }

  /**
   * Subscribe to document updates
   */
  public subscribeToDocumentUpdates(documentId: string, callback: (document: Document) => void): () => void {
    return this.entityStore.subscribeToEntities({
      id: `document_${documentId}_${Date.now()}`,
      entityTypes: ['poa_document'],
      entityIds: [documentId],
      callback: (entities, action) => {
        if (entities.length > 0) {
          const document = entities[0] as Document;
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
  public getCachedDocument(documentId: string): Document | undefined {
    return this.findExistingDocument(documentId);
  }

  /**
   * Debug method to log EntityStore contents for troubleshooting
   */
  public debugEntityStore(documentId?: string): void {
    console.log('[DocumentService] === EntityStore Debug Info ===');
    
    // Log main entities
    const allEntities = this.entityStore.getEntities();
    console.log(`[DocumentService] Total entities in store: ${allEntities.length}`);
    
    // Log POA documents specifically
    const poaDocuments = this.entityStore.getEntities<Document>({ type: 'poa_document' });
    console.log(`[DocumentService] POA documents: ${poaDocuments.length}`);
    poaDocuments.forEach(doc => {
      console.log(`[DocumentService] - POA Doc: id=${doc.id}, documentId=${doc.documentId}, title=${doc.title}`);
    });
    
    // Log all categories
    const categories = this.entityStore.getAllCategories();
    console.log(`[DocumentService] Categories: ${categories.size}`);
    categories.forEach((entityMap, categoryName) => {
      console.log(`[DocumentService] - Category '${categoryName}': ${entityMap.size} entities`);
      entityMap.forEach((entity, key) => {
        const entityInfo = entity as any;
        console.log(`[DocumentService]   - Key '${key}': id=${entityInfo.id}, type=${entityInfo.type}, documentId=${entityInfo.documentId || 'N/A'}`);
      });
    });
    
    // Log document categories
    const docCategories = this.entityStore.getAllDocumentCategories();
    console.log(`[DocumentService] Document categories: ${docCategories.length}`);
    docCategories.forEach(({ category, documents }) => {
      console.log(`[DocumentService] - Doc Category '${category}': ${documents.length} documents`);
    });
    
    // If specific documentId provided, show detailed search
    if (documentId) {
      console.log(`[DocumentService] === Searching for document: ${documentId} ===`);
      const found = this.findExistingDocument(documentId);
      console.log(`[DocumentService] Search result:`, found ? 'FOUND' : 'NOT FOUND');
      if (found) {
        console.log(`[DocumentService] Found document:`, found);
      }
    }
    
    console.log('[DocumentService] === End EntityStore Debug Info ===');
  }

  /**
   * Comprehensive document search that checks multiple sources in EntityStore
   */
  public findExistingDocument(documentId: string): Document | undefined {
    console.log(`[DocumentService] Searching for existing document: ${documentId}`);
    
    // 1. First check the 'poa' category (primary location)
    let document = this.entityStore.getEntityFromCategory<Document>('poa', documentId);
    if (document) {
      console.log(`[DocumentService] Found document in 'poa' category: ${documentId}`);
      return document;
    }

    // 2. Check main entities store by ID
    document = this.entityStore.getEntity<Document>(documentId);
    if (document && document.type === 'poa_document') {
      console.log(`[DocumentService] Found document in main entities store: ${documentId}`);
      return document;
    }

    // 3. Search by type using getEntitiesByType
    const allPoaDocuments = this.entityStore.getEntitiesByType<Document>('poa_document');
    const foundByType = allPoaDocuments.find(doc => 
      doc.documentId === documentId || doc.id === documentId
    );
    if (foundByType) {
      console.log(`[DocumentService] Found document using getEntitiesByType: ${documentId}`);
      return foundByType;
    }

    // 4. Search by documentId property in all entities of type 'poa_document' using getEntities
    const poaDocuments = this.entityStore.getEntities<Document>({
      type: 'poa_document',
      filter: (entity) => (entity as Document).documentId === documentId
    });
    
    if (poaDocuments.length > 0) {
      console.log(`[DocumentService] Found document by documentId property: ${documentId}`);
      return poaDocuments[0];
    }

    // 5. Search across all categories for document-like entities
    const allCategories = this.entityStore.getAllCategories();
    for (const [categoryName, categoryMap] of allCategories) {
      for (const [key, entity] of categoryMap) {
        const potentialDoc = entity as any;
        if (
          (potentialDoc.type === 'poa_document' || potentialDoc.documentId || potentialDoc.title) &&
          (potentialDoc.documentId === documentId || potentialDoc.id === documentId || key === documentId)
        ) {
          console.log(`[DocumentService] Found document in category '${categoryName}' with key '${key}': ${documentId}`);
          return potentialDoc as Document;
        }
      }
    }

    // 6. Search using document categories helper
    const documentCategories = this.entityStore.getAllDocumentCategories();
    for (const { category, documents } of documentCategories) {
      const foundDoc = documents.find((doc: any) => 
        doc.documentId === documentId || doc.id === documentId
      );
      if (foundDoc) {
        console.log(`[DocumentService] Found document via getAllDocumentCategories in '${category}': ${documentId}`);
        return foundDoc as Document;
      }
    }

    console.log(`[DocumentService] No existing document found for: ${documentId}`);
    return undefined;
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

  /**
   * Cleanup method to unsubscribe from metadata messages
   */
  public cleanup(): void {
    if (this.unsubscribeFromMetadata) {
      this.unsubscribeFromMetadata();
      this.unsubscribeFromMetadata = undefined;
      console.log('[DocumentService] Unsubscribed from metadata messages');
    }
    this.clearCache();
  }

  /**
   * Attempt to refresh/restore a document by forcing a fetch
   * This method is useful when the document should exist but is not found in EntityStore
   */
  public async refreshDocument(documentId: string): Promise<Document | null> {
    console.log(`[DocumentService] Attempting to refresh document: ${documentId}`);
    
    try {
      // Wait for connection to be ready before attempting refresh
      const connectionReady = await this.waitForAgentConnection('document_data_flow', 10000);
      
      if (!connectionReady) {
        console.warn(`[DocumentService] Cannot refresh document ${documentId}: agent connection not ready`);
        return null;
      }
      
      // Fetch the document
      const document = await this.fetchPOADocument(documentId);
      console.log(`[DocumentService] Successfully refreshed document: ${documentId}`);
      return document;
      
    } catch (error) {
      console.error(`[DocumentService] Failed to refresh document ${documentId}:`, error);
      return null;
    }
  }
} 