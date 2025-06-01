import React, { useState } from 'react';

interface Representative {
  name: string;
  role: string;
  email: string;
  organization: string;
}

const Representatives: React.FC = () => {
  const [representatives, setRepresentatives] = useState<Representative[]>([
    { name: '', role: '', email: '', organization: '' }
  ]);

  const addRepresentative = () => {
    setRepresentatives([
      ...representatives,
      { name: '', role: '', email: '', organization: '' }
    ]);
  };

  const updateRepresentative = (index: number, field: keyof Representative, value: string) => {
    const updated = [...representatives];
    updated[index] = { ...updated[index], [field]: value };
    setRepresentatives(updated);
  };

  const removeRepresentative = (index: number) => {
    setRepresentatives(representatives.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Representatives</h2>
        <p className="text-sm text-gray-600 mt-1">Define the representatives for each party</p>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {representatives.map((rep, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Representative {index + 1}
                </h3>
                {representatives.length > 1 && (
                  <button
                    onClick={() => removeRepresentative(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={rep.name}
                    onChange={(e) => updateRepresentative(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role/Title *
                  </label>
                  <input
                    type="text"
                    value={rep.role}
                    onChange={(e) => updateRepresentative(index, 'role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CEO, Legal Representative"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={rep.email}
                    onChange={(e) => updateRepresentative(index, 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="representative@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={rep.organization}
                    onChange={(e) => updateRepresentative(index, 'organization', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company or organization name"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            onClick={addRepresentative}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            + Add Another Representative
          </button>
          
          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Summary</h3>
            <div className="text-sm text-blue-800">
              {representatives.filter(r => r.name.trim()).length} representative(s) defined
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Representatives; 