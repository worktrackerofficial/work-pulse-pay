import { useState, useEffect } from "react";
import { Calendar, Plus, Users, Clock, Edit, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Schedule {
  id: string;
  job_name: string;
  start_date: string;
  end_date: string;
  excluded_days: string[];
  status: string;
  workers: { name: string }[];
}

export default function Schedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          id,
          name,
          start_date,
          end_date,
          excluded_days,
          status,
          job_workers!inner (
            workers (
              name
            )
          )
        `)
        .eq('status', 'active');

      if (error) throw error;

      const formattedSchedules = jobs?.map(job => ({
        id: job.id,
        job_name: job.name,
        start_date: job.start_date,
        end_date: job.end_date,
        excluded_days: job.excluded_days || [],
        status: job.status,
        workers: job.job_workers.map((jw: any) => jw.workers)
      })) || [];

      setSchedules(formattedSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysOfWeek = () => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const getWorkDays = (excludedDays: string[]) => {
    return getDaysOfWeek().filter(day => !excludedDays.includes(day.toLowerCase()));
  };

  const createSchedule = () => {
    // Navigate to create job dialog (reuse existing functionality)
    const event = new CustomEvent('open-create-job');
    window.dispatchEvent(event);
  };

  const editSchedule = (scheduleId: string) => {
    // For now, navigate to jobs page where they can edit
    window.location.href = '/jobs';
  };

  const manageWorkers = (scheduleId: string) => {
    // Navigate to workers page to manage team
    window.location.href = '/workers';
  };

  const viewCalendar = (scheduleId: string) => {
    // Navigate to attendance page to view calendar-like data
    window.location.href = '/attendance';
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Schedule Management</h1>
        <Button className="bg-gradient-to-r from-primary to-primary-glow" onClick={createSchedule}>
          <Plus className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </div>

      {/* Schedule Cards */}
      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-8">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No active schedules found</div>
        ) : (
          schedules.map((schedule) => {
            const workDays = getWorkDays(schedule.excluded_days);
            return (
              <Card key={schedule.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{schedule.job_name}</CardTitle>
                    <Badge className="bg-success text-success-foreground">
                      {schedule.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">
                          {new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Shift Hours</p>
                        <p className="font-medium">08:00 - 17:00</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Assigned Workers</p>
                        <p className="font-medium">{schedule.workers.length} workers</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Work Days</p>
                      <p className="font-medium">{workDays.length} days/week</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Work Days:</p>
                    <div className="flex flex-wrap gap-2">
                      {getDaysOfWeek().map((day) => (
                        <Badge 
                          key={day}
                          variant={workDays.includes(day) ? "default" : "outline"}
                          className={workDays.includes(day) ? "bg-primary text-primary-foreground" : ""}
                        >
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Assigned Workers:</p>
                    <div className="flex flex-wrap gap-2">
                      {schedule.workers.map((worker, index) => (
                        <Badge key={index} variant="outline">
                          {worker.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => editSchedule(schedule.id)}>
                      <Edit className="mr-1 h-3 w-3" />
                      Edit Schedule
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => manageWorkers(schedule.id)}>
                      <Users className="mr-1 h-3 w-3" />
                      Manage Workers
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => viewCalendar(schedule.id)}>
                      <Calendar className="mr-1 h-3 w-3" />
                      View Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}