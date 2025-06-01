import React, { useState } from 'react';

interface Condition {
  id: string;
  title: string;
  description: string;
  type: 'payment' | 'performance' | 'termination' | 'general';
  priority: 'high' | 'medium' | 'low';
}

const Conditions: React.FC = () => {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [newCondition, setNewCondition] = useState<Omit<Condition, 'id'>>({
    title: '',
    description: '',
    type: 'general',
    priority: 'medium'
  });

  const addCondition = () => {
    if (newCondition.title.trim()) {
      const condition: Condition = {
        ...newCondition,
        id: Date.now().toString()
      };
      setConditions([...conditions, condition]);
      setNewCondition({
        title: '',
        description: '',
        type: 'general',
        priority: 'medium'
      });
    }
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const getTypeColor = (type: Condition['type']) => {
    switch (type) {
      case 'payment': return 'bg-green-100 text-green-800';
      case 'performance': return 'bg-blue-100 text-blue-800';
      case 'termination': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Condition['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Conditions</h2>
        <p className="text-sm text-gray-600 mt-1">Define terms, conditions, and requirements</p>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Add New Condition */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Condition</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition Title *
                </label>
                <input
                  type="text"
                  value={newCondition.title}
                  onChange={(e) => setNewCondition({ ...newCondition, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter condition title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newCondition.description}
                  onChange={(e) => setNewCondition({ ...newCondition, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the condition in detail..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newCondition.type}
                    onChange={(e) => setNewCondition({ ...newCondition, type: e.target.value as Condition['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="payment">Payment</option>
                    <option value="performance">Performance</option>
                    <option value="termination">Termination</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newCondition.priority}
                    onChange={(e) => setNewCondition({ ...newCondition, priority: e.target.value as Condition['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={addCondition}
                disabled={!newCondition.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Condition
              </button>
            </div>
          </div>

          {/* Existing Conditions */}
          {conditions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Defined Conditions ({conditions.length})
              </h3>
              
              <div className="space-y-4">
                {conditions.map((condition) => (
                  <div key={condition.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-md font-medium text-gray-900">{condition.title}</h4>
                      <button
                        onClick={() => removeCondition(condition.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    {condition.description && (
                      <p className="text-gray-600 mb-3">{condition.description}</p>
                    )}
                    
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(condition.type)}`}>
                        {condition.type.charAt(0).toUpperCase() + condition.type.slice(1)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(condition.priority)}`}>
                        {condition.priority.charAt(0).toUpperCase() + condition.priority.slice(1)} Priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default Conditions; 