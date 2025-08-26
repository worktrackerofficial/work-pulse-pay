import { useState } from "react";
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

interface RecordAttendanceDialogProps {
  children: React.ReactNode;
}

// Mock data - replace with actual data from your database
const mockJobs = [
  { id: 1, name: "Warehouse Team Alpha" },
  { id: 2, name: "Delivery Squad Beta" },
  { id: 3, name: "Customer Support Team" },
];

const mockWorkers = [
  { id: 1, name: "John Smith", jobId: 1 },
  { id: 2, name: "Sarah Johnson", jobId: 2 },
  { id: 3, name: "Mike Chen", jobId: 3 },
  { id: 4, name: "Emily Davis", jobId: 1 },
  { id: 5, name: "Robert Wilson", jobId: 2 },
];

export function RecordAttendanceDialog({ children }: RecordAttendanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [attendanceDate, setAttendanceDate] = useState<Date>(new Date());
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [status, setStatus] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const { toast } = useToast();

  const filteredWorkers = mockWorkers.filter(worker => 
    selectedJob ? worker.jobId === parseInt(selectedJob) : true
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedJob || !selectedWorker || !status || !attendanceDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally save to database
    const workerName = mockWorkers.find(w => w.id === parseInt(selectedWorker))?.name;
    const jobName = mockJobs.find(j => j.id === parseInt(selectedJob))?.name;
    
    console.log("Recording attendance:", {
      jobId: selectedJob,
      workerId: selectedWorker,
      date: attendanceDate,
      clockIn,
      clockOut,
      status,
      deliverables: parseInt(deliverables) || 0,
    });

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
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger>
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {mockJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="worker">Worker *</Label>
            <Select value={selectedWorker} onValueChange={setSelectedWorker} disabled={!selectedJob}>
              <SelectTrigger>
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                {filteredWorkers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id.toString()}>
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
            <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow">
              <CheckCircle className="mr-2 h-4 w-4" />
              Record Attendance
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}