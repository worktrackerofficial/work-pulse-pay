import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Worker {
  id: string;
  name: string;
  role: string;
}

interface RecordAttendanceDialogProps {
  children: React.ReactNode;
  jobId: string;
  workers: Worker[];
}

export function RecordAttendanceDialog({ children, jobId, workers }: RecordAttendanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [attendance, setAttendance] = useState<{ [workerId: number]: boolean }>({});
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please select a date.",
        variant: "destructive",
      });
      return;
    }

    const attendanceRecords = Object.entries(attendance).map(([workerId, present]) => ({
      workerId: parseInt(workerId),
      present,
      date: selectedDate,
    }));

    // Here you would normally save to database
    console.log("Recording attendance:", { jobId, date: selectedDate, attendance: attendanceRecords });

    const presentCount = Object.values(attendance).filter(Boolean).length;
    toast({
      title: "Attendance Recorded",
      description: `${presentCount} of ${workers.length} workers marked present for ${format(selectedDate, "PPP")}.`,
    });

    setOpen(false);
    // Reset form
    setSelectedDate(undefined);
    setAttendance({});
  };

  const toggleWorkerAttendance = (workerId: number) => {
    setAttendance(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Daily Attendance</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Attendance Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Mark Present Workers</Label>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {workers.map((worker) => (
                <div key={worker.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{worker.name}</p>
                    <p className="text-sm text-muted-foreground">{worker.role}</p>
                  </div>
                  <Checkbox
                    checked={attendance[worker.id] || false}
                    onCheckedChange={() => toggleWorkerAttendance(worker.id)}
                  />
                </div>
              ))}
            </div>
            {workers.length === 0 && (
              <p className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                No workers assigned to this job yet.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-primary to-primary-glow"
              disabled={workers.length === 0}
            >
              Record Attendance
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}