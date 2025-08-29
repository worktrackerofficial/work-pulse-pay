import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddWorkerDialogProps {
  children: React.ReactNode;
  jobId: string | number;
  onWorkerAdded?: () => void;
}

export function AddWorkerDialog({ children, jobId, onWorkerAdded }: AddWorkerDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.role) {
      toast({
        title: "Error",
        description: "Name and role are required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, create the worker
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .insert({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          role: formData.role,
          department: formData.department
        })
        .select()
        .single();

      if (workerError) throw workerError;

      // If jobId is provided and not 0, assign worker to job
      if (jobId && jobId !== 0 && jobId !== "0") {
        const { error: assignmentError } = await supabase
          .from('job_workers')
          .insert({
            job_id: jobId.toString(),
            worker_id: worker.id
          });

        if (assignmentError) throw assignmentError;
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        action: 'Worker added',
        entity_type: 'worker',
        entity_name: formData.name
      });

      toast({
        title: "Success",
        description: `Worker ${formData.name} has been added successfully!`,
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        department: "",
      });
      
      setOpen(false);
      onWorkerAdded?.();
    } catch (error) {
      console.error('Error adding worker:', error);
      toast({
        title: "Error",
        description: "Failed to add worker. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Worker to Job</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter worker name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="worker@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <div className="space-y-2">
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Packer">Packer</SelectItem>
                  <SelectItem value="Quality Check">Quality Check</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Loader">Loader</SelectItem>
                  <SelectItem value="Assistant">Assistant</SelectItem>
                  <SelectItem value="Technician">Technician</SelectItem>
                  <SelectItem value="Operator">Operator</SelectItem>
                  <SelectItem value="Custom">Custom Role</SelectItem>
                </SelectContent>
              </Select>
              {formData.role === 'Custom' && (
                <Input
                  placeholder="Enter custom role"
                  value={formData.role === 'Custom' ? '' : formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <div className="space-y-2">
              <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                  <SelectItem value="Warehouse">Warehouse</SelectItem>
                  <SelectItem value="Logistics">Logistics</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Custom">Custom Department</SelectItem>
                </SelectContent>
              </Select>
              {formData.department === 'Custom' && (
                <Input
                  placeholder="Enter custom department"
                  value={formData.department === 'Custom' ? '' : formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow">
              Add Worker
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}