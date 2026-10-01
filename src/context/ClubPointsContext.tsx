import React, { createContext, useContext, useState } from 'react';
import { PointTransaction, ClubTier } from '../types';
import { MOCK_POINT_TRANSACTIONS } from '../data/mockData';
import { useAuth } from './AuthContext';

interface ClubPointsContextType {
  points: number;
  tier: ClubTier;
  transactions: PointTransaction[];
  redeemPoints: (amount: number, description: string) => boolean;
  addPoints: (amount: number, description: string) => void;
}

const ClubPointsContext = createContext<ClubPointsContextType | undefined>(undefined);

export const ClubPointsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, addClubPoints } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[]>(MOCK_POINT_TRANSACTIONS);

  const points = currentUser ? currentUser.clubPoints : 0;
  const tier: ClubTier = currentUser ? currentUser.clubTier : 'bronze';

  const redeemPoints = (amount: number, description: string): boolean => {
    if (points < amount) return false;
    addClubPoints(-amount);
    setTransactions(prev => [
      {
        id: 'pt-' + Date.now(),
        type: 'redeem',
        points: -amount,
        description,
        date: new Date().toLocaleDateString('fa-IR'),
      },
      ...prev,
    ]);
    return true;
  };

  const addPoints = (amount: number, description: string) => {
    addClubPoints(amount);
    setTransactions(prev => [
      {
        id: 'pt-' + Date.now(),
        type: 'earn',
        points: amount,
        description,
        date: new Date().toLocaleDateString('fa-IR'),
      },
      ...prev,
    ]);
  };

  return (
    <ClubPointsContext.Provider
      value={{
        points,
        tier,
        transactions,
        redeemPoints,
        addPoints,
      }}
    >
      {children}
    </ClubPointsContext.Provider>
  );
};

export const useClubPoints = () => {
  const context = useContext(ClubPointsContext);
  if (!context) throw new Error('useClubPoints must be used within a ClubPointsProvider');
  return context;
};
