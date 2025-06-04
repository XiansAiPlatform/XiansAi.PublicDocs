import { useState, useCallback } from 'react';
import { useMetadataSubscription } from '../../../../hooks/useMetadataSubscription';
import { Representative, ActivityData } from '../types/representative.types';
import { 
  createEmptyRepresentative, 
  getValidRepresentatives 
} from '../utils/representative.utils';

export const useRepresentativesData = () => {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [latestActivity, setLatestActivity] = useState<ActivityData | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Stable callback to prevent constant re-subscribing
  const handleActivityLogMessage = useCallback((message: any) => {
    console.log('[Representatives] ActivityLog message received:', message);
    
    // Extract ActivityLog details from the metadata
    const activityData = message.data?.metadata || message.metadata;
    if (activityData && activityData.messageType === 'ActivityLog') {
      console.log('[Representatives] ActivityLog details:', {
        summary: activityData.summary,
        details: activityData.details,
        success: activityData.success,
        timestamp: activityData.timestamp,
        stepIndex: message.stepIndex
      });
      
      // Update state with the latest activity
      setLatestActivity({
        summary: activityData.summary,
        details: activityData.details,
        success: activityData.success,
        timestamp: activityData.timestamp
      });

      // Extract and update representatives data if available
      const auditResult = activityData.auditResult;
      if (auditResult?.data?.representatives && Array.isArray(auditResult.data.representatives)) {
        console.log('[Representatives] Updating representatives from audit data:', auditResult.data.representatives);
        setRepresentatives(auditResult.data.representatives.map((rep: any) => ({
          id: rep.id,
          fullName: rep.fullName || '',
          nationalId: rep.nationalId || '',
          relationship: rep.relationship || ''
        })));
        // Exit edit mode when data is received from audit
        setEditingIndex(null);
      }
    }
  }, []);

  // Subscribe to ActivityLog metadata messages
  const { latestMessage } = useMetadataSubscription({
    subscriberId: 'representatives',
    messageTypes: ['ActivityLog'],
    onMessage: handleActivityLogMessage
  });

  const addRepresentative = useCallback(() => {
    const newRep = createEmptyRepresentative();
    const newIndex = representatives.length;
    setRepresentatives(prev => [...prev, newRep]);
    setEditingIndex(newIndex); // Automatically enter edit mode for new representative
  }, [representatives.length]);

  const updateRepresentative = useCallback((index: number, field: keyof Representative, value: string) => {
    setRepresentatives(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const removeRepresentative = useCallback((index: number) => {
    setRepresentatives(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  }, [editingIndex]);

  const toggleEditMode = useCallback((index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null); // Exit edit mode
    } else {
      setEditingIndex(index); // Enter edit mode for this card
    }
  }, [editingIndex]);

  const clearAllRepresentatives = useCallback(() => {
    setRepresentatives([]);
    setEditingIndex(null);
  }, []);

  const saveRepresentatives = useCallback(() => {
    // Exit any editing mode
    setEditingIndex(null);
    
    // Here you would typically send the data to your backend/API
    console.log('Saving representatives:', representatives);
    
    // Get valid representatives for saving
    const validRepresentatives = getValidRepresentatives(representatives);
    console.log('Valid representatives to save:', validRepresentatives);
    
    // Show success feedback (you could add a toast notification here)
    // For now, we'll just log it
  }, [representatives]);

  return {
    representatives,
    latestActivity,
    editingIndex,
    setEditingIndex,
    addRepresentative,
    updateRepresentative,
    removeRepresentative,
    toggleEditMode,
    clearAllRepresentatives,
    saveRepresentatives
  };
}; 