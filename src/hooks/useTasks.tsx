import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, isAfter, isBefore, startOfDay, format } from "date-fns";

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  type: 'attendance' | 'deliverables' | 'payout' | 'report' | 'job_deadline';
  related_id?: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const generateTasks = async () => {
    if (!user) return [];
    
    try {
      // First try to fetch stored tasks
      const { data: storedTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
      } else {
        console.log('Stored tasks fetched:', storedTasks);
      }

      const generatedTasks: Task[] = [];
      const today = startOfDay(new Date());
      
      // Fetch active jobs and their data
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active');

      // Check for jobs without recent attendance records
      const { data: recentAttendance } = await supabase
        .from('attendance')
        .select('job_id, attendance_date')
        .gte('attendance_date', format(addDays(today, -2), 'yyyy-MM-dd'));

      const jobsWithRecentAttendance = new Set(recentAttendance?.map(a => a.job_id) || []);

      // Check for pending payouts that need approval
      const { data: pendingPayouts } = await supabase
        .from('payouts')
        .select('*')
        .eq('status', 'pending');

      // Generate real tasks based on actual data
      jobs?.forEach(job => {
        // Task for jobs without recent attendance
        if (!jobsWithRecentAttendance.has(job.id)) {
          generatedTasks.push({
            id: `attendance-${job.id}`,
            title: `Record attendance for ${job.name}`,
            description: `No attendance recorded for ${job.name} in the last 2 days`,
            due_date: today.toISOString(),
            priority: 'high',
            status: 'pending',
            type: 'attendance',
            related_id: job.id
          });
        }

        // Task for deliverable recording based on frequency
        if (job.deliverable_frequency === 'daily') {
          generatedTasks.push({
            id: `deliverable-${job.id}`,
            title: `Record daily deliverables for ${job.name}`,
            description: `Daily deliverable recording due for ${job.name}`,
            due_date: today.toISOString(),
            priority: 'medium',
            status: 'pending',
            type: 'deliverables',
            related_id: job.id
          });
        }

        // Task for job deadlines if they exist
        if (job.end_date) {
          const endDate = new Date(job.end_date);
          const daysUntilDeadline = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) {
            generatedTasks.push({
              id: `deadline-${job.id}`,
              title: `${job.name} deadline approaching`,
              description: `Job ${job.name} ends in ${daysUntilDeadline} days`,
              due_date: endDate.toISOString(),
              priority: daysUntilDeadline <= 3 ? 'high' : 'medium',
              status: 'pending',
              type: 'job_deadline',
              related_id: job.id
            });
          } else if (job.deliverable_frequency === 'weekly') {
            generatedTasks.push({
              id: `weekly-deliverable-${job.id}`,
              title: `Weekly deliverables for ${job.name}`,
              description: `Weekly deliverable summary due for ${job.name}`,
              due_date: addDays(today, 1).toISOString(),
              priority: 'medium',
              status: 'pending',
              type: 'deliverables',
              related_id: job.id
            });
          }
        }
      });

      // Task for pending payouts
      if (pendingPayouts && pendingPayouts.length > 0) {
        generatedTasks.push({
          id: 'pending-payouts',
          title: `Approve ${pendingPayouts.length} pending payouts`,
          description: `${pendingPayouts.length} worker payouts are waiting for approval`,
          due_date: today.toISOString(),
          priority: 'high',
          status: 'pending',
          type: 'payout'
        });
      }

      // Remove old generic tasks and replace with real data-driven ones
      return generatedTasks;
    } catch (error) {
      console.error('Error generating tasks:', error);
      return [];
    }
  };

  const markTaskCompleted = async (taskId: string) => {
    if (!user) return;

    try {
      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating task:', error);
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed' }
          : task
      ));
    } catch (error) {
      console.error('Error marking task completed:', error);
    }
  };

  const getUpcomingTasks = () => {
    const today = startOfDay(new Date());
    const nextWeek = addDays(today, 7);
    
    return tasks.filter(task => {
      const taskDate = startOfDay(new Date(task.due_date));
      return task.status === 'pending' && 
             (isAfter(taskDate, today) || taskDate.getTime() === today.getTime()) &&
             isBefore(taskDate, nextWeek);
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  };

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const generatedTasks = await generateTasks();
      setTasks(generatedTasks);
      setLoading(false);
    };

    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    markTaskCompleted,
    getUpcomingTasks,
    refreshTasks: () => generateTasks().then(setTasks)
  };
};