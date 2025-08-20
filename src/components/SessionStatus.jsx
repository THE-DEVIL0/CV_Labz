import React from 'react';
import { useSession } from '../contexts/SessionContext';

const SessionStatus = ({ show = false }) => {
  const { user, isAuthenticated, isLoading, sessionChecked, error } = useSession();

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg text-xs max-w-xs">
      <h3 className="font-semibold mb-2">Session Status</h3>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Authenticated:</span>
          <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {isAuthenticated ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Loading:</span>
          <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
            {isLoading ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Session Checked:</span>
          <span className={sessionChecked ? 'text-green-600' : 'text-yellow-600'}>
            {sessionChecked ? 'Yes' : 'No'}
          </span>
        </div>
        {user && (
          <div className="flex justify-between">
            <span>User:</span>
            <span className="text-blue-600 truncate">{user.email}</span>
          </div>
        )}
        {error && (
          <div className="flex justify-between">
            <span>Error:</span>
            <span className="text-red-600 truncate">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionStatus; 