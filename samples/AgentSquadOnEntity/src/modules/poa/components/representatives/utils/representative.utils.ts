import { Representative } from '../types/representative.types';

export const validateRepresentative = (rep: Representative): boolean => {
  return !!(rep.fullName.trim() && rep.nationalId.trim() && rep.relationship.trim());
};

export const hasAnyData = (rep: Representative): boolean => {
  return !!(rep.fullName.trim() || rep.nationalId.trim() || rep.relationship.trim() || rep.email?.trim());
};

export const isVerifiedRepresentative = (rep: Representative): boolean => {
  return !!rep.id;
};

export const shouldDisplayRepresentative = (
  rep: Representative, 
  index: number, 
  editingIndex: number | null
): boolean => {
  const hasData = hasAnyData(rep);
  const isBeingEdited = editingIndex === index;
  const isVerified = isVerifiedRepresentative(rep);
  
  return hasData || isBeingEdited || isVerified;
};

export const getValidRepresentatives = (representatives: Representative[]): Representative[] => {
  return representatives.filter(validateRepresentative);
};

export const countRepresentativesWithNames = (representatives: Representative[]): number => {
  return representatives.filter(r => r.fullName?.trim() || r.name?.trim()).length;
};

export const countVerifiedRepresentatives = (representatives: Representative[]): number => {
  return representatives.filter(isVerifiedRepresentative).length;
};

export const createEmptyRepresentative = (): Representative => ({
  fullName: '',
  nationalId: '',
  relationship: ''
}); 