import React from 'react';
import TaskItem from './TaskItem';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const TaskList = ({ tasks, onRespondTask, onUpdateProgress }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
        <ClipboardDocumentListIcon style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.5 }} />
        No tasks assigned for today.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tasks.map(task => (
        <TaskItem 
          key={task._id} 
          task={task} 
          onRespondTask={onRespondTask}
          onUpdateProgress={onUpdateProgress}
        />
      ))}
    </div>
  );
};

export default TaskList;
