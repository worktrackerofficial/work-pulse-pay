import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Worker {
  id: number;
  name: string;
  role: string;
}

interface RecordDeliverablesDialogProps {
  children: React.ReactNode;
  jobId: number;
  workers: Worker[];
  deliverableType: string;
  deliverableFrequency: "daily" | "weekly" | "monthly";
}

export function RecordDeliverablesDialog({ children, jobId, workers, deliverableType, deliverableFrequency }: RecordDeliverablesDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [deliverables, setDeliverables] = useState<{ [workerId: number]: string }>({});
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

    const deliverableRecords = Object.entries(deliverables)
      .filter(([_, value]) => value && parseFloat(value) > 0)
      .map(([workerId, count]) => ({
        workerId: parseInt(workerId),
        count: parseFloat(count),
        date: selectedDate,
      }));

    if (deliverableRecords.length === 0) {
      toast({
        title: "No Data",
        description: "Please enter deliverable counts for at least one worker.",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally save to database
    console.log("Recording deliverables:", { jobId, date: selectedDate, deliverables: deliverableRecords });

    const totalItems = deliverableRecords.reduce((sum, record) => sum + record.count, 0);
    toast({
      title: "Deliverables Recorded",
      description: `Total ${totalItems} ${deliverableType.toLowerCase()} recorded for ${format(selectedDate, "PPP")}.`,
    });

    setOpen(false);
    // Reset form
    setSelectedDate(undefined);
    setDeliverables({});
  };

  const updateWorkerDeliverables = (workerId: number, value: string) => {
    setDeliverables(prev => ({
      ...prev,
      [workerId]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record {deliverableType}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Date *</Label>
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
            <Label>Worker Deliverables</Label>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {workers.map((worker) => (
                <div key={worker.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{worker.name}</p>
                    <p className="text-sm text-muted-foreground">{worker.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="0"
                      value={deliverables[worker.id] || ""}
                      onChange={(e) => updateWorkerDeliverables(worker.id, e.target.value)}
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-muted-foreground">items</span>
                  </div>
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
              Record Deliverables
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}