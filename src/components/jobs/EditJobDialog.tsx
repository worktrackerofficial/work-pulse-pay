import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit } from "lucide-react";

interface EditJobDialogProps {
  jobId: string;
  onJobUpdated?: () => void;
  children?: React.ReactNode;
}

interface Job {
  id: string;
  name: string;
  description: string;
  industry: string;
  pay_structure: 'commission' | 'flat' | 'hourly' | 'commission_adjusted' | 'team_commission';
  commission_per_item: number;
  flat_rate: number;
  hourly_rate: number;
  start_date: string;
  end_date: string;
  deliverable_type: string;
  target_deliverable: number;
  status: string;
}

export function EditJobDialog({ jobId, onJobUpdated, children }: EditJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && jobId) {
      fetchJob();
    }
  }, [open, jobId]);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast({
        title: "Error",
        description: "Failed to fetch job details",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          name: job.name,
          description: job.description,
          industry: job.industry,
          pay_structure: job.pay_structure,
          commission_per_item: job.commission_per_item,
          flat_rate: job.flat_rate,
          hourly_rate: job.hourly_rate,
          start_date: job.start_date,
          end_date: job.end_date,
          deliverable_type: job.deliverable_type,
          target_deliverable: job.target_deliverable,
        })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job updated successfully",
      });

      setOpen(false);
      onJobUpdated?.();
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateJob = (field: keyof Job, value: any) => {
    if (!job) return;
    setJob({ ...job, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Job
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
        </DialogHeader>
        
        {job && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Job Name</Label>
                <Input
                  id="name"
                  value={job.name}
                  onChange={(e) => updateJob('name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={job.industry}
                  onChange={(e) => updateJob('industry', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={job.description}
                onChange={(e) => updateJob('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={job.start_date}
                  onChange={(e) => updateJob('start_date', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={job.end_date}
                  onChange={(e) => updateJob('end_date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay_structure">Pay Structure</Label>
              <Select
                value={job.pay_structure}
                onValueChange={(value) => updateJob('pay_structure', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="flat">Flat Rate</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="commission_adjusted">Commission Adjusted</SelectItem>
                  <SelectItem value="team_commission">Team Commission</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {job.pay_structure === 'commission' && (
              <div className="space-y-2">
                <Label htmlFor="commission_per_item">Commission per Item (KShs)</Label>
                <Input
                  id="commission_per_item"
                  type="number"
                  step="0.01"
                  value={job.commission_per_item}
                  onChange={(e) => updateJob('commission_per_item', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            )}

            {job.pay_structure === 'flat' && (
              <div className="space-y-2">
                <Label htmlFor="flat_rate">Flat Rate (KShs)</Label>
                <Input
                  id="flat_rate"
                  type="number"
                  step="0.01"
                  value={job.flat_rate}
                  onChange={(e) => updateJob('flat_rate', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            )}

            {job.pay_structure === 'hourly' && (
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate (KShs)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={job.hourly_rate}
                  onChange={(e) => updateJob('hourly_rate', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            )}

            {(job.pay_structure === 'commission_adjusted' || job.pay_structure === 'team_commission') && (
              <div className="space-y-2">
                <Label htmlFor="commission_per_item">Commission per Item (KShs)</Label>
                <Input
                  id="commission_per_item"
                  type="number"
                  step="0.01"
                  value={job.commission_per_item}
                  onChange={(e) => updateJob('commission_per_item', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliverable_type">Deliverable Type</Label>
                <Input
                  id="deliverable_type"
                  value={job.deliverable_type}
                  onChange={(e) => updateJob('deliverable_type', e.target.value)}
                  placeholder="e.g., Units, Items, Tasks"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target_deliverable">Target Deliverable</Label>
                <Input
                  id="target_deliverable"
                  type="number"
                  value={job.target_deliverable}
                  onChange={(e) => updateJob('target_deliverable', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Job"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
