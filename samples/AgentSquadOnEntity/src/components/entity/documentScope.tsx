import React, { useState } from 'react';

const DocumentScope: React.FC = () => {
  const [documentType, setDocumentType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [parties, setParties] = useState(['']);

  const addParty = () => {
    setParties([...parties, '']);
  };

  const updateParty = (index: number, value: string) => {
    const updated = [...parties];
    updated[index] = value;
    setParties(updated);
  };

  const removeParty = (index: number) => {
    setParties(parties.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Document Scope</h2>
        <p className="text-sm text-gray-600 mt-1">Define the scope and parameters of your document</p>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Document Type */}
          <div>
            <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              id="document-type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select document type...</option>
              <option value="contract">Contract</option>
              <option value="agreement">Agreement</option>
              <option value="memorandum">Memorandum</option>
              <option value="policy">Policy</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
              Purpose of Document
            </label>
            <textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the main purpose and objectives of this document..."
            />
          </div>

          {/* Parties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parties Involved
            </label>
            <div className="space-y-2">
              {parties.map((party, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={party}
                    onChange={(e) => updateParty(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Party ${index + 1} name...`}
                  />
                  {parties.length > 1 && (
                    <button
                      onClick={() => removeParty(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addParty}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Another Party
              </button>
            </div>
          </div>

          {/* Scope Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Scope Summary</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Type:</strong> {documentType || 'Not specified'}</div>
              <div><strong>Parties:</strong> {parties.filter(p => p.trim()).length || 0}</div>
              <div><strong>Purpose:</strong> {purpose ? 'Defined' : 'Not defined'}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DocumentScope; 