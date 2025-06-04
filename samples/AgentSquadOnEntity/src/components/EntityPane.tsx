import React, { useState, useEffect, Suspense } from 'react';
import { useSteps } from '../context/StepsContext';
import type { ComponentLoader } from './types';
import { getThemeColors } from './theme';

// Generic dynamic component loader
const DynamicEntityComponent: React.FC<{ componentLoader: ComponentLoader }> = ({ componentLoader }) => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);

        const ComponentClass = await componentLoader();
        
        if (isMounted) {
          setComponent(() => ComponentClass);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load component:', err);
        if (isMounted) {
          setError('Component failed to load');
          setLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [componentLoader]);

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading component...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !Component) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Component Failed to Load</h3>
            <p className="text-gray-600 mb-4">
              {error || 'Unable to load the component for this step.'}
            </p>
            <p className="text-sm text-gray-500">
              Please check the component configuration and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <Component />;
};

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="h-full flex flex-col bg-white">
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          <div className="space-y-2 mt-8">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Main EntityPane component
const EntityPane: React.FC = () => {
  const { steps, activeStep, documentId, navigateToStepByIndex, isInitialized } = useSteps();
  
  // Show loading state if not initialized yet
  if (!isInitialized || steps.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {!isInitialized ? 'Initializing' : 'Loading Steps'}
            </h3>
            <p className="text-gray-600">
              {!isInitialized ? 'Setting up the application...' : 'Please wait while we load the workflow steps...'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const currentStep = steps[activeStep];

  // Get theme colors from the theme name
  const themeColors = currentStep ? getThemeColors(currentStep.theme) : null;

  // Navigation functions
  const goToPreviousStep = () => {
    if (activeStep > 0) {
      navigateToStepByIndex(activeStep - 1);
    }
  };

  const goToNextStep = () => {
    if (activeStep < steps.length - 1) {
      navigateToStepByIndex(activeStep + 1);
    }
  };

  const canGoPrevious = activeStep > 0;
  const canGoNext = activeStep < steps.length - 1;

  if (!currentStep || !themeColors) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Step Available</h3>
            <p className="text-gray-600">Please select a valid step to continue.</p>
          </div>
        </div>
      </div>
    );
  }

  const componentLoader = currentStep.componentLoader;

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{currentStep.title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {activeStep + 1} of {steps.length}
              {documentId && documentId !== 'new' && (
                <span className="ml-2 text-xs text-blue-600">
                  Document: {documentId}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {canGoPrevious && (
              <button
                onClick={goToPreviousStep}
                className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 focus:outline-none ${themeColors.buttonSecondary} ${themeColors.buttonSecondaryHover} ${themeColors.buttonSecondaryBorder}`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            )}
            {canGoNext && (
              <button
                onClick={goToNextStep}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white focus:outline-none ${themeColors.buttonPrimary} ${themeColors.buttonPrimaryHover}`}
              >
                Next
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<LoadingFallback />}>
          {componentLoader ? (
            <DynamicEntityComponent componentLoader={componentLoader} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Component Available</h3>
                <p className="text-gray-600">This step doesn't have a component configured.</p>
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default EntityPane; 