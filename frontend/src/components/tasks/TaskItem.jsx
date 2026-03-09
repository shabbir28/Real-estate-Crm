import React from 'react';
import { CheckCircleIcon, PhoneIcon, CalendarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const TYPE_ICONS = {
  followup: PhoneIcon,
  call: PhoneIcon,
  meeting: CalendarIcon,
  task: ClipboardDocumentListIcon,
};

const TaskItem = ({ task, onComplete, onRespondTask }) => {
  const Icon = TYPE_ICONS[task.type] || ClipboardDocumentListIcon;
  const isCompleted = task.status === 'completed';
  
  const due = new Date(task.dueDate);
  const timeStr = due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const dateStr = due.toLocaleDateString([], { month: 'short', day: 'numeric' });
  
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px',
      borderRadius: '10px', 
      background: isCompleted ? 'rgba(20,184,166,0.05)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isCompleted ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.04)'}`,
      transition: 'all 0.2s',
      opacity: isCompleted ? 0.6 : 1
    }}
    onMouseEnter={e => !isCompleted && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
    onMouseLeave={e => !isCompleted && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
    >
      <div style={{ 
        width: 34, height: 34, borderRadius: '8px', 
        background: isCompleted ? 'rgba(20,184,166,0.1)' : 'rgba(139,92,246,0.1)', 
        color: isCompleted ? '#14b8a6' : '#8b5cf6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon style={{ width: 16, height: 16 }} />
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 700, color: isCompleted ? '#9ca3af' : '#fff',
          textDecoration: isCompleted ? 'line-through' : 'none',
          marginBottom: 2
        }}>
          {task.title}
          {task.assignmentStatus === 'assigned' && (
            <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700, background: 'rgba(245,158,11,0.15)', padding: '2px 6px', borderRadius: 4 }}>
              Assigned to you
            </span>
          )}
        </div>
        
        {task.description && (
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textDecoration: isCompleted ? 'line-through' : 'none' }}>
            {task.description}
          </div>
        )}
        
        <div style={{ fontSize: 11, fontWeight: 600, color: isCompleted ? '#6b7280' : '#a0aec0' }}>
          {task.leadId?.name ? `${task.leadId.name} • ` : ''}{dateStr}, {timeStr}
        </div>
      </div>
      
      {!isCompleted && task.assignmentStatus !== 'assigned' && (
        <button 
          onClick={() => onComplete(task._id)}
          style={{
            width: 28, height: 28, borderRadius: '6px',
            background: 'rgba(20,184,166,0.1)', color: '#14b8a6',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
          }}
          title="Complete Task"
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.1)' }}
        >
          <CheckCircleIcon style={{ width: 16, height: 16 }} />
        </button>
      )}

      {task.assignmentStatus === 'assigned' && onRespondTask && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onRespondTask(task._id, 'accepted')}
            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: `1px solid rgba(16,185,129,0.3)`, 
                     padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            Accept
          </button>
          <button
            onClick={() => onRespondTask(task._id, 'rejected')}
            style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: `1px solid rgba(248,113,113,0.3)`, 
                     padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
