import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  const generateTasks = async () => {
    try {
      const generatedTasks: Task[] = [];
      const today = startOfDay(new Date());
      
      // Fetch active jobs for deliverable reminders
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active');

      jobs?.forEach(job => {
        // Generate deliverable reminder tasks
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
      });

      // Generate attendance reminder tasks
      generatedTasks.push({
        id: 'attendance-reminder',
        title: 'Record today\'s attendance',
        description: 'Mark attendance for all active workers',
        due_date: new Date().toISOString(),
        priority: 'high',
        status: 'pending',
        type: 'attendance'
      });

      // Generate payout tasks (weekly)
      generatedTasks.push({
        id: 'weekly-payouts',
        title: 'Process weekly payouts',
        description: 'Calculate and approve weekly worker payouts',
        due_date: addDays(today, 2).toISOString(),
        priority: 'high',
        status: 'pending',
        type: 'payout'
      });

      // Generate report tasks
      generatedTasks.push({
        id: 'performance-report',
        title: 'Generate performance reports',
        description: 'Weekly performance analysis and reporting',
        due_date: addDays(today, 3).toISOString(),
        priority: 'medium',
        status: 'pending',
        type: 'report'
      });

      return generatedTasks;
    } catch (error) {
      console.error('Error generating tasks:', error);
      return [];
    }
  };

  const markTaskCompleted = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'completed' }
        : task
    ));
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