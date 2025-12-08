// app/ui/reminder.tsx
'use client';

import { useEffect, useState } from 'react';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  courseName?: string;
  priority?: 'high' | 'medium' | 'low';
}

export default function Reminder() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assignments');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (Array.isArray(data)) {
        setAssignments(data);
        setError(null);
      } else {
        console.error('Expected array but got:', typeof data, data);
        setError('Invalid data format received');
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const getBorderColor = (dueDate: string) => {
    const date = new Date(dueDate);
    const daysUntilDue = differenceInDays(date, new Date());
    
    if (isToday(date)) return 'border-red-500';
    if (isTomorrow(date)) return 'border-orange-500';
    if (daysUntilDue <= 3) return 'border-yellow-500';
    return 'border-blue-500';
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    
    const daysUntil = differenceInDays(date, new Date());
    if (daysUntil <= 7) return format(date, 'EEEE');
    
    return format(date, 'MMM dd');
  };

  if (loading) {
    return (
      <div className="text-gray-900">
        <h2 className="text-2xl font-bold mb-4">Reminder</h2>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-3 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-gray-900">
        <h2 className="text-2xl font-bold mb-4">Reminder</h2>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-600 text-sm font-semibold">Error loading assignments</p>
          <p className="text-red-500 text-xs mt-1">{error}</p>
          <button
            onClick={fetchAssignments}
            className="mt-3 text-sm text-red-700 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-gray-900">
      <h2 className="text-2xl font-bold mb-4">Reminder</h2>
      
      {assignments.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-gray-400 mb-3">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium mb-1">No assignments yet</p>
          <p className="text-gray-400 text-sm">
            You'll see upcoming assignments here once you're enrolled in courses
          </p>
        </div>
      ) : (
        <>
          {assignments.map((assignment, index) => (
            <div
              key={assignment.id}
              className={`bg-white p-3 rounded-lg shadow border-l-4 ${getBorderColor(
                assignment.dueDate
              )} mb-3`}
            >
              <p className="font-semibold">
                {index === 0 ? "Today's Focus:" : 'Upcoming:'}
              </p>
              <p className="text-sm text-gray-800">{assignment.title}</p>
              {assignment.courseName && (
                <p className="text-xs text-gray-500 mt-1">{assignment.courseName}</p>
              )}
              <p className="text-xs text-gray-600 mt-1">
                Due: {formatDueDate(assignment.dueDate)}
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
