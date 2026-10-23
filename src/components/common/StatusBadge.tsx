import React from 'react';
import { WorkflowStatusType, ResultStatusType } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

interface StatusBadgeProps {
  status: WorkflowStatusType | ResultStatusType | string;
  type?: 'workflow' | 'result';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'workflow' }) => {
  const { user } = useAuth();
  const isLabUser = user?.role === 'LAB_USER';

  // Format label text according to role perspective
  const getDisplayText = () => {
    if (type === 'workflow') {
      if (status === 'In Processing') {
        return isLabUser ? 'Sample Received' : 'In Processing';
      }
      if (status === 'Sent to Lab') {
        return isLabUser ? 'Awaiting Receipt' : 'Sent to Lab';
      }
      if (status === 'Paid') {
        return isLabUser ? 'Confirmed Payment' : 'Paid';
      }
      if (status === 'Payment Confirmed' || status === 'Confirmed Payment') {
        return isLabUser ? 'Confirmed Payment' : 'Paid';
      }
      if (status === 'Invoice Sent') {
        return isLabUser ? 'Invoice Sent' : 'Invoice Received';
      }
      if (status === 'Invoice Received') {
        return isLabUser ? 'Invoice Sent' : 'Invoice Received';
      }
    }
    return status;
  };

  const displayText = getDisplayText();

  const getBadgeClass = () => {
    switch (status) {
      case 'Registered':
        return 'badge-registered';
      case 'Sent to Lab':
        return 'badge-sent';
      case 'In Processing':
      case 'In Progress':
      case 'Sample Received':
      case 'Invoice Sent':
      case 'Invoice Received':
        return 'badge-processing';
      case 'Completed':
      case 'Result Received':
      case 'Paid':
      case 'Confirmed Payment':
      case 'Payment Confirmed':
        return 'badge-completed';
      case 'Rejected':
        return 'badge-rejected';
      case 'Closed':
        return 'badge-closed';
      case 'Pending':
        return 'badge-processing';
      default:
        return 'badge-closed';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'Registered':
        return '#2563eb';
      case 'Sent to Lab':
        return '#06b6d4';
      case 'In Processing':
      case 'In Progress':
      case 'Sample Received':
      case 'Pending':
        return '#f59e0b';
      case 'Invoice Sent':
      case 'Invoice Received':
        return '#2563eb';
      case 'Completed':
      case 'Result Received':
      case 'Paid':
      case 'Confirmed Payment':
      case 'Payment Confirmed':
        return '#10b981';
      case 'Rejected':
        return '#ef4444';
      case 'Closed':
        return '#64748b';
      default:
        return '#94a3b8';
    }
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: getDotColor(),
          display: 'inline-block',
        }}
      />
      {displayText}
    </span>
  );
};
