import React, { useState } from 'react';
import { 
  useEntities, 
  useEntitiesByType, 
  useEntity, 
  useEntitySubscription 
} from '../context/EntityContext';
import { 
  DocumentEntity, 
  PersonEntity, 
  TaskEntity,
  AuditResultEntity,
  createDocumentEntity,
  createPersonEntity,
  createTaskEntity,
  createAuditResultEntity
} from '../types/entities';

const EntityDemo: React.FC = () => {
  const { 
    addEntity, 
    updateEntity, 
    deleteEntity, 
    getStats, 
    loading, 
    error 
  } = useEntities();

  // Get entities by type using specialized hooks
  const documents = useEntitiesByType<DocumentEntity>('document');
  const persons = useEntitiesByType<PersonEntity>('person');
  const tasks = useEntitiesByType<TaskEntity>('task');
  const auditResults = useEntitiesByType<AuditResultEntity>('audit_result');

  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const selectedEntity = useEntity(selectedEntityId);
  const [updates, setUpdates] = useState<string[]>([]);

  // Subscribe to all entity updates for logging
  useEntitySubscription(
    undefined, // All entity types
    undefined, // All entity IDs
    (entities, action) => {
      const timestamp = new Date().toLocaleTimeString();
      const entityTypes = entities.map(e => e.type).join(', ');
      const message = `[${timestamp}] ${action.type}: ${entities.length} entities (${entityTypes})`;
      setUpdates(prev => [message, ...prev.slice(0, 9)]); // Keep last 10 updates
    }
  );

  // Sample data creation functions
  const createSampleDocument = () => {
    const doc = createDocumentEntity({
      title: `Sample Document ${Date.now()}`,
      content: 'This is a sample power of attorney document.',
      documentType: 'power_of_attorney',
      status: 'draft',
      author: 'Legal Assistant',
      tags: ['power-of-attorney', 'legal', 'draft']
    });
    addEntity(doc);
  };

  const createSamplePerson = () => {
    const person = createPersonEntity({
      firstName: `John${Math.floor(Math.random() * 100)}`,
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'principal',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      }
    });
    addEntity(person);
  };

  const createSampleTask = () => {
    const task = createTaskEntity({
      title: `Review Document ${Date.now()}`,
      description: 'Review the power of attorney document for completeness.',
      status: 'pending',
      priority: 'medium',
      stepIndex: 0
    });
    addEntity(task);
  };

  const createSampleAuditResult = () => {
    // Find a document to attach the audit to, or create one if none exists
    let targetDocument = documents[0];
    if (!targetDocument) {
      targetDocument = createDocumentEntity({
        title: 'Auto-generated Document for Audit',
        content: 'Sample document for audit demonstration.',
        documentType: 'power_of_attorney',
        status: 'draft',
        author: 'System',
        tags: ['audit-demo']
      });
      addEntity(targetDocument);
    }

    const auditResult = createAuditResultEntity({
      documentId: targetDocument.id,
      findings: [
        {
          type: 0,
          message: "At least one witness is required",
          description: "Maximum Witnesses Limit by ensuring that a Power of Attorney document does not exceed the maximum allowed number of witnesses (2)",
          link: "https://theprep.ai"
        },
        {
          type: 3,
          message: "In Norway 70% of the time, at least one representative is also a witness.",
          description: "Document statistics information",
          link: null
        }
      ],
      errors: [
        {
          type: 0,
          message: "At least one witness is required",
          description: "Maximum Witnesses Limit by ensuring that a Power of Attorney document does not exceed the maximum allowed number of witnesses (2)",
          link: "https://theprep.ai"
        }
      ],
      warnings: [],
      recommendations: [],
      information: [
        {
          type: 3,
          message: "In Norway 70% of the time, at least one representative is also a witness.",
          description: "Document statistics information",
          link: null
        }
      ],
      isSuccess: false,
      hasErrors: true,
      hasWarnings: false,
      hasRecommendations: false,
      hasInformation: true,
      data: {
        principal: {
          userId: "20420d0f-7b24-49e3-bd7d-29bcc74f3828",
          fullName: "Kari Nordmann",
          nationalId: "01417012345",
          address: "Parkveien 1, 0350 Oslo"
        },
        scope: "Property and financial matters",
        representatives: [
          {
            id: "e6d591ec-7a95-43ef-bbde-66eb4e23ad54",
            fullName: "Nora Hansen",
            nationalId: "01017012347",
            relationship: "Backup Fullmektig"
          }
        ],
        conditions: [
          {
            id: "8a829b5e-57c2-4416-be93-b7fa0e7c8055",
            type: 0,
            text: "No one can sell my home.",
            targetId: null,
            createdAt: "2025-06-02T04:43:17.266042Z",
            updatedAt: null
          }
        ],
        witnesses: []
      }
    });
    addEntity(auditResult);
  };

  const updateSelectedEntity = () => {
    if (selectedEntity) {
      const updates: any = { updatedAt: new Date() };
      
      if (selectedEntity.type === 'document') {
        updates.status = 'pending_review';
      } else if (selectedEntity.type === 'person') {
        updates.email = `updated-${Date.now()}@example.com`;
      } else if (selectedEntity.type === 'task') {
        updates.status = 'in_progress';
      } else if (selectedEntity.type === 'audit_result') {
        updates.isSuccess = !selectedEntity.isSuccess;
      }
      
      updateEntity(selectedEntity.id, updates);
    }
  };

  const deleteSelectedEntity = () => {
    if (selectedEntity) {
      deleteEntity(selectedEntity.id);
      setSelectedEntityId('');
    }
  };

  const stats = getStats();

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <p className="text-gray-600">
          This demo shows how the central entity management system works with real-time updates.
        </p>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">Loading entities...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistics</h3>
          <p className="text-sm text-gray-600">Total Entities: {stats.totalEntities}</p>
          <p className="text-sm text-gray-600">Subscriptions: {stats.subscriptions}</p>
          <p className="text-sm text-gray-600">Listeners: {stats.listeners}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Entity Types</h3>
          {stats.entityTypes.map((typeInfo: any) => (
            <p key={typeInfo.type} className="text-sm text-gray-600">
              {typeInfo.type}: {typeInfo.count}
            </p>
          ))}
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Updates</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {updates.map((update, index) => (
              <p key={index} className="text-xs text-gray-500 font-mono">
                {update}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Audit Results</h3>
          <p className="text-sm text-gray-600">Total: {auditResults.length}</p>
          <p className="text-sm text-gray-600">
            Successful: {auditResults.filter(a => a.isSuccess).length}
          </p>
          <p className="text-sm text-gray-600">
            Failed: {auditResults.filter(a => !a.isSuccess).length}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Sample Entities</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={createSampleDocument}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Document
            </button>
            <button
              onClick={createSamplePerson}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Add Person
            </button>
            <button
              onClick={createSampleTask}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Add Task
            </button>
            <button
              onClick={createSampleAuditResult}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              Add Audit Result
            </button>
          </div>
        </div>

        {selectedEntity && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Selected Entity Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={updateSelectedEntity}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Update Selected
              </button>
              <button
                onClick={deleteSelectedEntity}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Entity Lists */}
      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          {/* Documents */}
          <div className="bg-white p-4 rounded-lg shadow border flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents ({documents.length})</h3>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedEntityId === doc.id 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedEntityId(doc.id)}
                >
                  <p className="font-medium text-sm">{doc.title}</p>
                  <p className="text-xs text-gray-500">Status: {doc.status}</p>
                  <p className="text-xs text-gray-500">Type: {doc.documentType}</p>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-gray-500 text-center py-8 text-sm">No documents yet</p>
              )}
            </div>
          </div>

          {/* Persons */}
          <div className="bg-white p-4 rounded-lg shadow border flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Persons ({persons.length})</h3>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {persons.map(person => (
                <div
                  key={person.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedEntityId === person.id 
                      ? 'bg-green-50 border-green-300' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedEntityId(person.id)}
                >
                  <p className="font-medium text-sm">{person.firstName} {person.lastName}</p>
                  <p className="text-xs text-gray-500">Role: {person.role}</p>
                  <p className="text-xs text-gray-500">Email: {person.email || 'N/A'}</p>
                </div>
              ))}
              {persons.length === 0 && (
                <p className="text-gray-500 text-center py-8 text-sm">No persons yet</p>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white p-4 rounded-lg shadow border flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks ({tasks.length})</h3>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedEntityId === task.id 
                      ? 'bg-purple-50 border-purple-300' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedEntityId(task.id)}
                >
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-gray-500">Status: {task.status}</p>
                  <p className="text-xs text-gray-500">Priority: {task.priority}</p>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-gray-500 text-center py-8 text-sm">No tasks yet</p>
              )}
            </div>
          </div>

          {/* Audit Results */}
          <div className="bg-white p-4 rounded-lg shadow border flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Results ({auditResults.length})</h3>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {auditResults.map(audit => (
                <div
                  key={audit.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedEntityId === audit.id 
                      ? 'bg-orange-50 border-orange-300' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedEntityId(audit.id)}
                >
                  <p className="font-medium text-sm">Audit for Doc: {audit.documentId.slice(0, 8)}...</p>
                  <p className={`text-xs font-medium ${audit.isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {audit.isSuccess ? 'Success' : 'Failed'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {audit.hasErrors && `${audit.errors.length} errors`}
                    {audit.hasWarnings && ` ${audit.warnings.length} warnings`}
                    {audit.hasInformation && ` ${audit.information.length} info`}
                  </p>
                </div>
              ))}
              {auditResults.length === 0 && (
                <p className="text-gray-500 text-center py-8 text-sm">No audit results yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Entity Details */}
      {selectedEntity && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Entity Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">ID:</p>
              <p className="text-sm text-gray-600 font-mono">{selectedEntity.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Type:</p>
              <p className="text-sm text-gray-600">{selectedEntity.type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Created:</p>
              <p className="text-sm text-gray-600">{selectedEntity.createdAt.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Updated:</p>
              <p className="text-sm text-gray-600">{selectedEntity.updatedAt.toLocaleString()}</p>
            </div>
          </div>

          {/* Special handling for audit result entities */}
          {selectedEntity.type === 'audit_result' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Audit Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Status:</p>
                  <p className={`${(selectedEntity as AuditResultEntity).isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {(selectedEntity as AuditResultEntity).isSuccess ? 'Success' : 'Failed'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Document ID:</p>
                  <p className="text-gray-600 font-mono text-xs">{(selectedEntity as AuditResultEntity).documentId}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Errors:</p>
                  <p className="text-gray-600">{(selectedEntity as AuditResultEntity).errors.length}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Information:</p>
                  <p className="text-gray-600">{(selectedEntity as AuditResultEntity).information.length}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700">Raw Data:</p>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto max-h-40">
              {JSON.stringify(selectedEntity, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityDemo; 