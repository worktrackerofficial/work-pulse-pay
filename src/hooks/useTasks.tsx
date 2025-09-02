import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, isAfter, isBefore, startOfDay } from "date-fns";

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  type: 'attendance' | 'deliverables' | 'payout' | 'report';
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
      
      // Fetch active jobs for deliverable reminders
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active');

      // Check if we need to create new tasks based on jobs
      const existingTaskTypes = new Set(storedTasks?.map(t => `${t.type}-${t.related_id}`) || []);

      jobs?.forEach(job => {
        const deliverableTaskKey = `deliverables-${job.id}`;
        
        if (!existingTaskTypes.has(deliverableTaskKey)) {
          if (job.deliverable_frequency === 'daily') {
            generatedTasks.push({
              id: `deliverable-${job.id}`,
              title: `Record deliverables for ${job.name}`,
              description: `Daily deliverable recording due for ${job.name}`,
              due_date: new Date().toISOString(),
              priority: 'high',
              status: 'pending',
              type: 'deliverables',
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

      // Add system tasks if they don't exist
      if (!existingTaskTypes.has('attendance-')) {
        generatedTasks.push({
          id: 'attendance-reminder',
          title: 'Record today\'s attendance',
          description: 'Mark attendance for all active workers',
          due_date: new Date().toISOString(),
          priority: 'high',
          status: 'pending',
          type: 'attendance'
        });
      }

      if (!existingTaskTypes.has('payout-')) {
        generatedTasks.push({
          id: 'weekly-payouts',
          title: 'Process weekly payouts',
          description: 'Calculate and approve weekly worker payouts',
          due_date: addDays(today, 2).toISOString(),
          priority: 'high',
          status: 'pending',
          type: 'payout'
        });
      }

      if (!existingTaskTypes.has('report-')) {
        generatedTasks.push({
          id: 'performance-report',
          title: 'Generate performance reports',
          description: 'Weekly performance analysis and reporting',
          due_date: addDays(today, 3).toISOString(),
          priority: 'medium',
          status: 'pending',
          type: 'report'
        });
      }

      // Store new tasks in database
      if (generatedTasks.length > 0) {
        const tasksToStore = generatedTasks.map(task => ({
          user_id: user.id,
          title: task.title,
          description: task.description,
          due_date: task.due_date,
          priority: task.priority,
          status: task.status,
          type: task.type,
          related_id: task.related_id
        }));

        const { error } = await supabase
          .from('tasks')
          .insert(tasksToStore);

        if (error) {
          console.error('Error storing tasks:', error);
        }
      }

      // Return all tasks (stored + new)
      const allTasks = [
        ...(storedTasks?.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          due_date: t.due_date,
          priority: t.priority as 'high' | 'medium' | 'low',
          status: t.status as 'pending' | 'completed',
          type: t.type as 'attendance' | 'deliverables' | 'payout' | 'report',
          related_id: t.related_id
        })) || []),
        ...generatedTasks
      ];

      return allTasks;
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