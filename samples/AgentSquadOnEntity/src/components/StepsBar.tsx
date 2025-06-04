import React from 'react';
import { Link } from 'react-router-dom';
import { AiOutlineRobot } from 'react-icons/ai';
import { useSteps } from '../context/StepsContext';
import { getThemeColors } from './theme';
import { getStepUrl } from '../modules/poa/steps';

const StepsBar: React.FC = () => {
  const { steps, activeStep, documentId, isInitialized } = useSteps();

  // Don't render anything if steps are not initialized yet
  if (!isInitialized || steps.length === 0) {
    return (
      <nav className="flex items-center justify-center px-6 py-4 bg-gray-100 border-b border-gray-200">
        <div className="text-sm text-gray-500">
          {!isInitialized ? 'Initializing...' : 'No steps available'}
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex items-center justify-center px-6 py-4 bg-gray-100 border-b border-gray-200">
      {steps.map((step, index) => {
        const themeColors = getThemeColors(step.theme);
        return (
          <React.Fragment key={step.title}>
            {/* Step Node */}
            <Link
              to={getStepUrl(step, documentId)}
              className="flex flex-col items-center focus:outline-none"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors text-lg
                  ${index === activeStep ? `${themeColors.bg} text-white` : 'bg-white border border-gray-300 text-gray-600'}`}
              >
                <AiOutlineRobot />
              </div>
              <span className="mt-1 text-xs whitespace-nowrap text-gray-700">
                {step.title}
              </span>
            </Link>

            {/* Connector Line */}
            {index < steps.length - 1 && <div className="w-8 h-0.5 bg-gray-300 mx-2" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default StepsBar; 