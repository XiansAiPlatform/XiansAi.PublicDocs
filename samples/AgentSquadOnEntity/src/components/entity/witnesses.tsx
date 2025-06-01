import React, { useState } from 'react';

interface Witness {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  relationship: string;
}

const Witnesses: React.FC = () => {
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newWitness, setNewWitness] = useState<Omit<Witness, 'id'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    relationship: ''
  });

  const addWitness = () => {
    if (newWitness.name.trim()) {
      const witness: Witness = {
        ...newWitness,
        id: Date.now().toString()
      };
      setWitnesses([...witnesses, witness]);
      setNewWitness({
        name: '',
        email: '',
        phone: '',
        address: '',
        relationship: ''
      });
      setIsAdding(false);
    }
  };

  const removeWitness = (id: string) => {
    setWitnesses(witnesses.filter(w => w.id !== id));
  };

  const editWitness = (id: string, updatedWitness: Omit<Witness, 'id'>) => {
    setWitnesses(witnesses.map(w => 
      w.id === id ? { ...updatedWitness, id } : w
    ));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Witnesses</h2>
        <p className="text-sm text-gray-600 mt-1">Add witnesses who will observe the document signing</p>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Add Witness Button */}
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + Add Witness
            </button>
          )}

          {/* Add New Witness Form */}
          {isAdding && (
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Witness</h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newWitness.name}
                    onChange={(e) => setNewWitness({ ...newWitness, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter witness name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newWitness.email}
                    onChange={(e) => setNewWitness({ ...newWitness, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="witness@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newWitness.phone}
                    onChange={(e) => setNewWitness({ ...newWitness, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship to Parties
                  </label>
                  <select
                    value={newWitness.relationship}
                    onChange={(e) => setNewWitness({ ...newWitness, relationship: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select relationship...</option>
                    <option value="independent">Independent/Neutral</option>
                    <option value="colleague">Colleague</option>
                    <option value="legal-counsel">Legal Counsel</option>
                    <option value="notary">Notary Public</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={newWitness.address}
                  onChange={(e) => setNewWitness({ ...newWitness, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full address"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={addWitness}
                  disabled={!newWitness.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Witness
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Witness List */}
          {witnesses.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Witnesses ({witnesses.length})
              </h3>
              
              <div className="space-y-4">
                {witnesses.map((witness) => (
                  <div key={witness.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-md font-medium text-gray-900">{witness.name}</h4>
                        {witness.relationship && (
                          <span className="text-sm text-gray-600">
                            {witness.relationship.charAt(0).toUpperCase() + witness.relationship.slice(1).replace('-', ' ')}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeWitness(witness.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      {witness.email && (
                        <div>
                          <span className="font-medium">Email:</span> {witness.email}
                        </div>
                      )}
                      {witness.phone && (
                        <div>
                          <span className="font-medium">Phone:</span> {witness.phone}
                        </div>
                      )}
                    </div>
                    
                    {witness.address && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Address:</span> {witness.address}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Witness Requirements</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Witnesses must be at least 18 years old</li>
              <li>• Witnesses should be independent parties (not beneficiaries)</li>
              <li>• All witnesses must be present during document signing</li>
              <li>• Valid identification will be required from all witnesses</li>
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Witnesses; 