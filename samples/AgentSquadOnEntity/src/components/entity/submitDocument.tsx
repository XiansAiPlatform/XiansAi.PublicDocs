import React, { useState } from 'react';

const SubmitDocument: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionMethod, setSubmissionMethod] = useState<'email' | 'download' | 'both'>('both');
  const [emailRecipients, setEmailRecipients] = useState<string[]>(['']);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const addEmailRecipient = () => {
    setEmailRecipients([...emailRecipients, '']);
  };

  const updateEmailRecipient = (index: number, email: string) => {
    const updated = [...emailRecipients];
    updated[index] = email;
    setEmailRecipients(updated);
  };

  const removeEmailRecipient = (index: number) => {
    setEmailRecipients(emailRecipients.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate submission process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="h-full flex flex-col bg-white">
        <header className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Document Submitted</h2>
          <p className="text-sm text-gray-600 mt-1">Your document has been successfully processed</p>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Successfully Submitted!</h3>
            <p className="text-gray-600 mb-6">
              Your document has been processed and distributed according to your preferences.
            </p>
            
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Download Final Document
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                View Submission Details
              </button>
              <button 
                onClick={() => {
                  setIsSubmitted(false);
                  setIsSubmitting(false);
                }}
                className="w-full px-4 py-2 text-blue-600 hover:text-blue-800"
              >
                Start New Document
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Submit Document</h2>
        <p className="text-sm text-gray-600 mt-1">Review and submit your completed document</p>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Document Summary */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Document Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Document Type:</span>
                <span className="font-medium">Contract Agreement</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Parties:</span>
                <span className="font-medium">2 parties defined</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Representatives:</span>
                <span className="font-medium">3 representatives</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conditions:</span>
                <span className="font-medium">5 conditions defined</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Witnesses:</span>
                <span className="font-medium">2 witnesses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Ready for submission</span>
              </div>
            </div>
          </div>

          {/* Submission Method */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Method</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="method"
                  value="email"
                  checked={submissionMethod === 'email'}
                  onChange={(e) => setSubmissionMethod(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Email Only</div>
                  <div className="text-sm text-gray-600">Send document via email to specified recipients</div>
                </div>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="method"
                  value="download"
                  checked={submissionMethod === 'download'}
                  onChange={(e) => setSubmissionMethod(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Download Only</div>
                  <div className="text-sm text-gray-600">Download document to your device</div>
                </div>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="method"
                  value="both"
                  checked={submissionMethod === 'both'}
                  onChange={(e) => setSubmissionMethod(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Email & Download</div>
                  <div className="text-sm text-gray-600">Both email and download options</div>
                </div>
              </label>
            </div>
          </div>

          {/* Email Recipients */}
          {(submissionMethod === 'email' || submissionMethod === 'both') && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Recipients</h3>
              
              <div className="space-y-2">
                {emailRecipients.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateEmailRecipient(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                    />
                    {emailRecipients.length > 1 && (
                      <button
                        onClick={() => removeEmailRecipient(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={addEmailRecipient}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Another Recipient
                </button>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h3>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any additional notes or instructions for the recipients..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Document'
              )}
            </button>
            
            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">
              Save Draft
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default SubmitDocument; 