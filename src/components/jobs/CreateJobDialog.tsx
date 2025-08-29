import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateJobDialogProps {
  children: React.ReactNode;
  onJobCreated?: () => void;
}

export function CreateJobDialog({ children, onJobCreated }: CreateJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    description: "",
    startDate: "",
    endDate: "",
    deliverableType: "",
    deliverableFrequency: "daily",
    targetDeliverable: 0,
    payStructure: "commission",
    commissionPerItem: 0,
    flatRate: 0,
    hourlyRate: 0,
    paymentFrequency: "Weekly",
    excludedDays: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.industry || !formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.from('jobs').insert({
        name: formData.name,
        industry: formData.industry,
        description: formData.description,
        start_date: formData.startDate,
        end_date: formData.endDate,
        deliverable_type: formData.deliverableType,
        deliverable_frequency: formData.deliverableFrequency as any,
        target_deliverable: formData.targetDeliverable,
        pay_structure: formData.payStructure as any,
        commission_per_item: formData.commissionPerItem,
        flat_rate: formData.flatRate,
        hourly_rate: formData.hourlyRate,
        payment_frequency: formData.paymentFrequency,
        excluded_days: formData.excludedDays
      });

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        action: 'New job created',
        entity_type: 'job',
        entity_name: formData.name
      });

      toast({
        title: "Success",
        description: "Job created successfully!",
      });

      // Reset form
      setFormData({
        name: "",
        industry: "",
        description: "",
        startDate: "",
        endDate: "",
        deliverableType: "",
        deliverableFrequency: "daily",
        targetDeliverable: 0,
        payStructure: "commission",
        commissionPerItem: 0,
        flatRate: 0,
        hourlyRate: 0,
        paymentFrequency: "Weekly",
        excludedDays: []
      });
      
      setOpen(false);
      onJobCreated?.();
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: "Error",
        description: "Failed to create job. Please try again.",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>
            Add a new job to your system with all the necessary details.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Job Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Warehouse Team Alpha"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="e.g., Manufacturing"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the job"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliverableType">Deliverable Type</Label>
              <Input
                id="deliverableType"
                value={formData.deliverableType}
                onChange={(e) => setFormData(prev => ({ ...prev, deliverableType: e.target.value }))}
                placeholder="e.g., Daily Items, Weekly Reports"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliverableFrequency">Deliverable Frequency</Label>
              <Select
                value={formData.deliverableFrequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, deliverableFrequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDeliverable">Target Deliverable</Label>
            <Input
              id="targetDeliverable"
              type="number"
              value={formData.targetDeliverable}
              onChange={(e) => setFormData(prev => ({ ...prev, targetDeliverable: parseInt(e.target.value) || 0 }))}
              placeholder="150"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payStructure">Pay Structure</Label>
            <Select
              value={formData.payStructure}
              onValueChange={(value) => setFormData(prev => ({ ...prev, payStructure: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commission">Commission</SelectItem>
                <SelectItem value="flat">Flat Rate</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="commission_adjusted">Commission Adjusted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.payStructure === 'commission' && (
            <div className="space-y-2">
              <Label htmlFor="commissionPerItem">Commission Per Item ($)</Label>
              <Input
                id="commissionPerItem"
                type="number"
                step="0.01"
                value={formData.commissionPerItem}
                onChange={(e) => setFormData(prev => ({ ...prev, commissionPerItem: parseFloat(e.target.value) || 0 }))}
                placeholder="2.50"
              />
            </div>
          )}

          {formData.payStructure === 'flat' && (
            <div className="space-y-2">
              <Label htmlFor="flatRate">Flat Rate ($)</Label>
              <Input
                id="flatRate"
                type="number"
                step="0.01"
                value={formData.flatRate}
                onChange={(e) => setFormData(prev => ({ ...prev, flatRate: parseFloat(e.target.value) || 0 }))}
                placeholder="100.00"
              />
            </div>
          )}

          {formData.payStructure === 'hourly' && (
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                placeholder="15.00"
              />
            </div>
          )}

          {formData.payStructure === 'commission_adjusted' && (
            <div className="space-y-2">
              <Label htmlFor="commissionPerItem">Commission Per Item ($)</Label>
              <Input
                id="commissionPerItem"
                type="number"
                step="0.01"
                value={formData.commissionPerItem}
                onChange={(e) => setFormData(prev => ({ ...prev, commissionPerItem: parseFloat(e.target.value) || 0 }))}
                placeholder="2.50"
              />
              <p className="text-xs text-muted-foreground">
                Commission will be adjusted based on days worked vs expected days
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Excluded Days</Label>
            <div className="grid grid-cols-2 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.excludedDays.includes(day)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData(prev => ({ ...prev, excludedDays: [...prev.excludedDays, day] }));
                      } else {
                        setFormData(prev => ({ ...prev, excludedDays: prev.excludedDays.filter(d => d !== day) }));
                      }
                    }}
                  />
                  <Label htmlFor={day} className="text-sm">{day}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}