import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RecordAttendanceDialogProps {
  children: React.ReactNode;
}

interface Job {
  id: string;
  name: string;
}

interface Worker {
  id: string;
  name: string;
}

interface JobWithWorkers extends Job {
  workers: Worker[];
}

export function RecordAttendanceDialog({ children }: RecordAttendanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [attendanceDate, setAttendanceDate] = useState<Date>(new Date());
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [status, setStatus] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [jobs, setJobs] = useState<JobWithWorkers[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      fetchJobsAndWorkers();
    }
  }, [open, user]);

  const fetchJobsAndWorkers = async () => {
    try {
      setLoading(true);
      
      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, name')
        .eq('status', 'active')
        .eq('user_id', user?.id);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        toast({
          title: "Error",
          description: "Failed to load jobs",
          variant: "destructive",
        });
        return;
      }

      // Fetch workers for each job
      const jobsWithWorkers: JobWithWorkers[] = [];
      
      for (const job of jobsData || []) {
        const { data: workersData, error: workersError } = await supabase
          .from('workers')
          .select('id, name')
          .eq('status', 'active')
          .eq('user_id', user?.id);

        if (workersError) {
          console.error('Error fetching workers:', workersError);
          continue;
        }

        jobsWithWorkers.push({
          ...job,
          workers: workersData || []
        });
      }

      setJobs(jobsWithWorkers);
    } catch (error) {
      console.error('Error in fetchJobsAndWorkers:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedJobData = jobs.find(job => job.id === selectedJob);
  const availableWorkers = selectedJobData?.workers || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedJob || !selectedWorker || !status || !attendanceDate || !user) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('attendance')
        .insert({
          job_id: selectedJob,
          worker_id: selectedWorker,
          attendance_date: format(attendanceDate, 'yyyy-MM-dd'),
          status: status as any,
          notes: deliverables ? `Deliverables: ${deliverables}` : null
        });

      if (error) {
        console.error('Error recording attendance:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Record deliverables if provided and status is present
      if (deliverables && (status === 'present' || status === 'late')) {
        const { error: deliverablesError } = await supabase
          .from('deliverables')
          .insert({
            job_id: selectedJob,
            worker_id: selectedWorker,
            deliverable_date: format(attendanceDate, 'yyyy-MM-dd'),
            quantity: parseInt(deliverables) || 0
          });

        if (deliverablesError) {
          console.error('Error recording deliverables:', deliverablesError);
        }
      }

      const workerName = availableWorkers.find(w => w.id === selectedWorker)?.name;
      const jobName = selectedJobData?.name;
      
      toast({
        title: "Attendance Recorded",
        description: `Attendance for ${workerName} in ${jobName} has been recorded.`,
      });

      setOpen(false);
      // Reset form
      setSelectedJob("");
      setSelectedWorker("");
      setAttendanceDate(new Date());
      setClockIn("");
      setClockOut("");
      setStatus("");
      setDeliverables("");
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "Failed to record attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Record Attendance
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {attendanceDate ? format(attendanceDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={attendanceDate}
                  onSelect={(date) => date && setAttendanceDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job">Job *</Label>
            <Select value={selectedJob} onValueChange={setSelectedJob} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading jobs..." : "Select job"} />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="worker">Worker *</Label>
            <Select value={selectedWorker} onValueChange={setSelectedWorker} disabled={!selectedJob || loading}>
              <SelectTrigger>
                <SelectValue placeholder={!selectedJob ? "Select a job first" : "Select worker"} />
              </SelectTrigger>
              <SelectContent>
                {availableWorkers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="excused">Excused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "present" || status === "late" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clockIn">Clock In</Label>
                  <Input
                    id="clockIn"
                    type="time"
                    value={clockIn}
                    onChange={(e) => setClockIn(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clockOut">Clock Out</Label>
                  <Input
                    id="clockOut"
                    type="time"
                    value={clockOut}
                    onChange={(e) => setClockOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliverables">Deliverables Completed</Label>
                <Input
                  id="deliverables"
                  type="number"
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  placeholder="Number of items/tasks completed"
                />
              </div>
            </>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow" disabled={loading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {loading ? "Recording..." : "Record Attendance"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}