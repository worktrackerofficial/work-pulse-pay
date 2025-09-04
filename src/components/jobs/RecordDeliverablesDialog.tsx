import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Worker {
  id: string;
  name: string;
  role: string;
}

interface RecordDeliverablesDialogProps {
  children: React.ReactNode;
  jobId: string;
  workers: Worker[];
  deliverableType: string;
  deliverableFrequency: "daily" | "weekly" | "monthly";
  payStructure?: string;
  onDeliverablesRecorded?: () => void;
}

export function RecordDeliverablesDialog({ children, jobId, workers, deliverableType, deliverableFrequency, payStructure, onDeliverablesRecorded }: RecordDeliverablesDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [deliverables, setDeliverables] = useState<{ [workerId: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please select a date.",
        variant: "destructive",
      });
      return;
    }

    let deliverableRecords;
    
    if (payStructure === 'team_commission') {
      // For team commission, create one record under a team identifier, not individual workers
      const teamTotal = parseInt(deliverables['team_total'] || '0');
      if (teamTotal === 0) {
        toast({
          title: "No Data",
          description: "Please enter the team deliverables total.",
          variant: "destructive",
        });
        return;
      }
      
      // For team commission, use the new team_deliverables table
      try {
        const { error } = await supabase
          .from('team_deliverables')
          .insert([{
            job_id: jobId,
            deliverable_date: selectedDate.toLocaleDateString('en-CA'),
            quantity: teamTotal
          }]);

        if (error) throw error;

        const totalItems = teamTotal;
        toast({
          title: "Team Deliverables Recorded",
          description: `Total ${totalItems} ${deliverableType.toLowerCase()} recorded for team on ${format(selectedDate, "PPP")}.`,
        });

        setOpen(false);
        setSelectedDate(undefined);
        setDeliverables({});
        onDeliverablesRecorded?.();
        return;
      } catch (error) {
        console.error('Error recording team deliverables:', error);
        toast({
          title: "Error",
          description: "Failed to record team deliverables. Please try again.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Individual worker deliverables
      deliverableRecords = Object.entries(deliverables)
        .filter(([_, value]) => value && parseFloat(value) > 0)
        .map(([workerId, count]) => ({
          worker_id: workerId,
          job_id: jobId,
          deliverable_date: selectedDate.toLocaleDateString('en-CA'),
          quantity: parseInt(count)
        }));

      if (deliverableRecords.length === 0) {
        toast({
          title: "No Data",
          description: "Please enter deliverable counts for at least one worker.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('deliverables')
        .insert(deliverableRecords);

      if (error) throw error;

      const totalItems = deliverableRecords.reduce((sum, record) => sum + record.quantity, 0);
      toast({
        title: "Deliverables Recorded",
        description: `Total ${totalItems} ${deliverableType.toLowerCase()} recorded for ${format(selectedDate, "PPP")}.`,
      });

      setOpen(false);
      setSelectedDate(undefined);
      setDeliverables({});
      onDeliverablesRecorded?.();
    } catch (error) {
      console.error('Error recording deliverables:', error);
      toast({
        title: "Error",
        description: "Failed to record deliverables. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateWorkerDeliverables = (workerId: string, value: string) => {
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

          {payStructure === 'team_commission' ? (
            <div className="space-y-2">
              <Label>Team Deliverables Total</Label>
              <div className="p-4 border rounded-lg bg-blue-50">
                <p className="text-sm text-muted-foreground mb-2">
                  For pool commission jobs, record the total team deliverables for the day.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={deliverables['team_total'] || ""}
                    onChange={(e) => setDeliverables({ team_total: e.target.value })}
                    className="w-32 text-center"
                  />
                  <span className="text-sm text-muted-foreground">total items</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Worker Deliverables</Label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {workers
                  .filter(worker => 
                    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    worker.role.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((worker) => (
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
            </div>
          )}
          {workers.length === 0 && payStructure !== 'team_commission' && (
            <p className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
              No workers assigned to this job yet.
            </p>
          )}

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