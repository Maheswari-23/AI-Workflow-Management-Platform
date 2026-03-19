'use client';
import { useState } from 'react';
import SchedulerSidebar from '../../components/SchedulerSidebar';
import SchedulerMainPanel from '../../components/SchedulerMainPanel';

const initialSchedules = [
  { 
    id: 'sched-1', 
    name: 'Nightly Sync', 
    taskId: 'task-3', 
    triggerType: 'cron', 
    cronExpression: '0 0 * * *', 
    status: 'active',
    runHistory: [
      { runId: 'A8B9C1', runOn: '3/18/2026, 12:00:01 AM', status: 'Success', statusCode: '200 OK' },
      { runId: 'X7Y8Z9', runOn: '3/17/2026, 12:00:02 AM', status: 'Success', statusCode: '200 OK' },
      { runId: 'M4N5P6', runOn: '3/16/2026, 12:00:15 AM', status: 'Failed', statusCode: '500 Server Error' },
    ]
  }
];

export default function SchedulerPage() {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const handleCreate = (newSchedule) => {
    setSchedules([...schedules, newSchedule]);
    setSelectedSchedule(newSchedule);
  };

  const handleUpdate = (updatedSchedule) => {
    setSchedules((prev) => 
      prev.map((s) => s.id === updatedSchedule.id ? updatedSchedule : s)
    );
    setSelectedSchedule(updatedSchedule);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#ffffff' }}>
      <SchedulerSidebar 
        schedules={schedules}
        selectedSchedule={selectedSchedule}
        onScheduleSelect={setSelectedSchedule}
        onScheduleCreate={handleCreate}
      />
      <SchedulerMainPanel 
        selectedSchedule={selectedSchedule}
        onSave={handleUpdate}
      />
    </div>
  );
}
