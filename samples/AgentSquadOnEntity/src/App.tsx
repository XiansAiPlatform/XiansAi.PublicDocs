import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import StepsBar from './components/StepsBar';
import ChatPane from './components/chat/ChatPane';
import EntityPane from './components/EntityPane';
import FindingsPane from './components/FindingsPane';
import { StepsProvider, useSteps } from './context/StepsContext';
import { SettingsProvider } from './context/SettingsContext';
import { WebSocketStepsProvider } from './context/WebSocketStepsContext';
import { EntityProvider } from './context/EntityContext';
import { POA_ROUTE_PATTERN, getFirstStepUrl } from './components/power-of-attorney/steps';

const MainLayout: React.FC = () => {
  const { activeStep } = useSteps();
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [mobileFindingsOpen, setMobileFindingsOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      {/* Top navigation */}
      <NavBar />

      {/* Steps / Areas of work */}
      <StepsBar />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat pane - desktop only */}
        <div className="hidden sm:block min-w-[280px] flex-1 border-r border-gray-200 overflow-hidden">
          <ChatPane />
        </div>

        {/* Entity state pane */}
        <div
          className="flex-[1.5] overflow-hidden"
          onClick={() => {
            setMobileChatOpen(false);
            setMobileFindingsOpen(false);
          }}
        >
          <EntityPane />
        </div>

        {/* Findings pane - desktop only */}
        <div className="hidden sm:block min-w-[280px] flex-1 border-l border-gray-200 overflow-hidden">
          <FindingsPane />
        </div>
      </div>

      {/* Mobile chat overlay */}
      <div
        className={`sm:hidden fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white shadow-lg z-30 transform transition-transform duration-300 ${mobileChatOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="absolute top-0 left-0 right-0 flex justify-end p-2 border-b border-neutral-200 bg-white z-10">
          <button
            aria-label="Close chat"
            onClick={() => setMobileChatOpen(false)}
            className="text-neutral-500 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>
        <div className="absolute top-12 bottom-0 left-0 right-0">
          <ChatPane />
        </div>
      </div>

      {/* Mobile findings overlay */}
      <div
        className={`sm:hidden fixed inset-y-0 right-0 w-4/5 max-w-xs bg-white shadow-lg z-30 transform transition-transform duration-300 ${mobileFindingsOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="absolute top-0 left-0 right-0 flex justify-between p-2 border-b border-neutral-200 bg-white z-10">
          <h2 className="text-sm font-medium text-primary">Findings</h2>
          <button
            aria-label="Close findings"
            onClick={() => setMobileFindingsOpen(false)}
            className="text-neutral-500 hover:text-neutral-700"
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
          className="sm:hidden fixed left-0 top-1/2 -translate-y-1/2 w-6 h-24 bg-primary text-white flex items-center justify-center rounded-r shadow-lg"
        >
          <span className="transform -rotate-90 text-xs tracking-widest select-none">CHAT</span>
        </button>
      )}

      {!mobileFindingsOpen && (
        <button
          aria-label="Open findings"
          onClick={() => setMobileFindingsOpen(true)}
          className="sm:hidden fixed right-0 top-1/2 -translate-y-1/2 w-6 h-24 bg-accent text-white flex items-center justify-center rounded-l shadow-lg"
        >
          <span className="transform rotate-90 text-xs tracking-widest select-none">FINDINGS</span>
        </button>
      )}
    </div>
  );
};

const PowerOfAttorneyWorkflow: React.FC = () => (
  <StepsProvider>
    <EntityProvider>
      <WebSocketStepsProvider>
        <MainLayout />
      </WebSocketStepsProvider>
    </EntityProvider>
  </StepsProvider>
);

const App: React.FC = () => (
  <SettingsProvider>
    <Router>
      <Routes>
        {/* Redirect root to the first step */}
        <Route path="/" element={<Navigate to={getFirstStepUrl()} replace />} />
        
        {/* Power of Attorney workflow routes */}
        <Route path={POA_ROUTE_PATTERN} element={<PowerOfAttorneyWorkflow />} />
        
        {/* Catch-all redirect to first step */}
        <Route path="*" element={<Navigate to={getFirstStepUrl()} replace />} />
      </Routes>
    </Router>
  </SettingsProvider>
);

export default App;