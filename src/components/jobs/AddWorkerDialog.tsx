import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AddWorkerDialogProps {
  children: React.ReactNode;
  jobId: string | number;
  onWorkerAdded?: () => void;
}

export function AddWorkerDialog({ children, jobId, onWorkerAdded }: AddWorkerDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("existing");
  const [existingWorkers, setExistingWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    taxInfo: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchExistingWorkers();
    }
  }, [open, user]);

  const fetchExistingWorkers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('id, name, role, department, email')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      setExistingWorkers(data || []);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const handleAddExistingWorker = async () => {
    if (!selectedWorkerId) {
      toast({
        title: "Error",
        description: "Please select a worker to add.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if worker is already assigned to this job
      const { data: existingAssignment } = await supabase
        .from('job_workers')
        .select('id')
        .eq('job_id', jobId.toString())
        .eq('worker_id', selectedWorkerId)
        .single();

      if (existingAssignment) {
        toast({
          title: "Error",
          description: "This worker is already assigned to this job.",
          variant: "destructive",
        });
        return;
      }

      // Assign worker to job
      const { error } = await supabase
        .from('job_workers')
        .insert({
          job_id: jobId.toString(),
          worker_id: selectedWorkerId
        });

      if (error) throw error;

      const selectedWorker = existingWorkers.find(w => w.id === selectedWorkerId);
      
      // Log activity
      await supabase.from('activity_logs').insert({
        action: 'Worker assigned to job',
        entity_type: 'worker',
        entity_name: selectedWorker?.name || 'Unknown',
        entity_id: selectedWorkerId
      });

      toast({
        title: "Success",
        description: `${selectedWorker?.name} has been added to the job!`,
      });

      setSelectedWorkerId("");
      setOpen(false);
      onWorkerAdded?.();
    } catch (error) {
      console.error('Error adding existing worker:', error);
      toast({
        title: "Error",
        description: "Failed to add worker. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add a worker.",
          variant: "destructive",
        });
        return;
      }

      // First, create the worker
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .insert({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          role: formData.role,
          department: formData.department,
          tax_info: formData.taxInfo || null,
          user_id: user.id
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
        entity_name: formData.name,
        entity_id: worker.id
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
        taxInfo: "",
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Existing Worker</TabsTrigger>
            <TabsTrigger value="new">New Worker</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Workers</Label>
              <Input
                id="search"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Select Worker</Label>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {existingWorkers
                  .filter(worker => 
                    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    worker.role.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((worker) => (
                    <div
                      key={worker.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedWorkerId === worker.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedWorkerId(worker.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{worker.name}</p>
                          <p className="text-sm text-muted-foreground">{worker.role}</p>
                          <p className="text-xs text-muted-foreground">{worker.department}</p>
                        </div>
                        {selectedWorkerId === worker.id && (
                          <div className="w-4 h-4 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              {existingWorkers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No existing workers found. Create a new worker instead.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddExistingWorker}
                className="bg-gradient-to-r from-primary to-primary-glow"
                disabled={!selectedWorkerId}
              >
                Add Worker
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="taxInfo">Tax Information</Label>
            <Input
              id="taxInfo"
              value={formData.taxInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, taxInfo: e.target.value }))}
              placeholder="KRA PIN or tax identification number (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Optional tax information for payroll purposes
            </p>
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}