import React, { useState } from 'react';
import NavBar from './components/NavBar';
import StepsBar from './components/StepsBar';
import ChatPane from './components/ChatPane';
import EntityPane from './components/EntityPane';
import FindingsPane from './components/FindingsPane';

const App: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [mobileFindingsOpen, setMobileFindingsOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      {/* Top navigation */}
      <NavBar />

      {/* Steps / Areas of work */}
      <StepsBar activeStep={activeStep} onStepChange={setActiveStep} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat pane - desktop only */}
        <div className="hidden sm:block w-1/4 border-r border-gray-200 overflow-hidden">
          <ChatPane activeStep={activeStep} />
        </div>

        {/* Entity state pane */}
        <div 
          className="flex-1 overflow-hidden"
          onClick={() => {
            setMobileChatOpen(false);
            setMobileFindingsOpen(false);
          }}
        >
          <EntityPane activeStep={activeStep} />
        </div>

        {/* Findings pane - desktop only */}
        <div className="hidden sm:block w-1/4 border-l border-gray-200 overflow-hidden">
          <FindingsPane />
        </div>
      </div>

      {/* Mobile chat overlay */}
      <div
        className={`sm:hidden fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white shadow-lg z-30 transform transition-transform duration-300 ${mobileChatOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="absolute top-0 left-0 right-0 flex justify-end p-2 border-b border-gray-200 bg-white z-10">
          <button
            aria-label="Close chat"
            onClick={() => setMobileChatOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="absolute top-12 bottom-0 left-0 right-0">
          <ChatPane activeStep={activeStep} />
        </div>
      </div>

      {/* Mobile findings overlay */}
      <div
        className={`sm:hidden fixed inset-y-0 right-0 w-4/5 max-w-xs bg-white shadow-lg z-30 transform transition-transform duration-300 ${mobileFindingsOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="absolute top-0 left-0 right-0 flex justify-between p-2 border-b border-gray-200 bg-white z-10">
          <h2 className="text-sm font-medium">Findings</h2>
          <button
            aria-label="Close findings"
            onClick={() => setMobileFindingsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="absolute top-12 bottom-0 left-0 right-0">
          <FindingsPane />
        </div>
      </div>

      {/* Collapsed strip button */}
      {!mobileChatOpen && (
        <button
          aria-label="Open chat"
          onClick={() => setMobileChatOpen(true)}
          className="sm:hidden fixed left-0 top-1/2 -translate-y-1/2 w-6 h-24 bg-primary-light text-white flex items-center justify-center rounded-r shadow-lg"
        >
          <span className="transform -rotate-90 text-xs tracking-widest select-none">CHAT</span>
        </button>
      )}

      {/* Collapsed strip button for findings */}
      {!mobileFindingsOpen && (
        <button
          aria-label="Open findings"
          onClick={() => setMobileFindingsOpen(true)}
          className="sm:hidden fixed right-0 top-1/2 -translate-y-1/2 w-6 h-24 bg-rose-500 text-white flex items-center justify-center rounded-l shadow-lg"
        >
          <span className="transform rotate-90 text-xs tracking-widest select-none">FINDINGS</span>
        </button>
      )}
    </div>
  );
};

export default App;