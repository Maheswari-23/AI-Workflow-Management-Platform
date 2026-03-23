'use client';
import { useState, useEffect } from 'react';
import SchedulerSidebar from '../../components/SchedulerSidebar';
import SchedulerMainPanel from '../../components/SchedulerMainPanel';

export default function SchedulerPage() {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/schedules');
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (scheduleData) => {
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: scheduleData.name }),
      });
      const data = await res.json();
      if (data.schedule) {
        setSchedules(prev => [data.schedule, ...prev]);
        setSelectedSchedule(data.schedule);
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
    }
  };

  const handleUpdate = (updatedSchedule) => {
    setSchedules(prev => prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s));
    setSelectedSchedule(updatedSchedule);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#ffffff' }}>
      <SchedulerSidebar
        schedules={schedules}
        selectedSchedule={selectedSchedule}
        onScheduleSelect={setSelectedSchedule}
        onScheduleCreate={handleCreate}
        isLoading={isLoading}
      />
      <SchedulerMainPanel
        selectedSchedule={selectedSchedule}
        onSave={handleUpdate}
      />
    </div>
  );
}
