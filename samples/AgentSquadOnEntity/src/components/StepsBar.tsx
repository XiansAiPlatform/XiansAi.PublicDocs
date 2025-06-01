import React from 'react';
import { AiOutlineRobot } from 'react-icons/ai';
import { useSteps } from '../context/StepsContext';
import { getThemeColors } from '../steps';

const StepsBar: React.FC = () => {
  const { steps, activeStep, setActiveStep } = useSteps();

  return (
    <nav className="flex items-center justify-center px-6 py-4 bg-gray-100 border-b border-gray-200">
      {steps.map((step, index) => {
        const themeColors = getThemeColors(step.theme);
        return (
          <React.Fragment key={step.title}>
            {/* Step Node */}
            <button
              className="flex flex-col items-center focus:outline-none"
              onClick={() => setActiveStep(index)}
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
            </button>

            {/* Connector Line */}
            {index < steps.length - 1 && <div className="w-8 h-0.5 bg-gray-300 mx-2" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default StepsBar; 