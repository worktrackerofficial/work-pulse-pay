import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface CreateJobDialogProps {
  children: React.ReactNode;
}

export function CreateJobDialog({ children }: CreateJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    description: "",
    deliverableType: "",
    targetDeliverable: "",
    payStructure: "",
    commissionPerItem: "",
    flatRate: "",
    paymentFrequency: "",
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [excludedDays, setExcludedDays] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.industry || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally save to database
    console.log("Creating job:", {
      ...formData,
      startDate,
      endDate,
      excludedDays,
    });

    toast({
      title: "Job Created",
      description: `${formData.name} has been created successfully.`,
    });

    setOpen(false);
    // Reset form
    setFormData({
      name: "",
      industry: "",
      description: "",
      deliverableType: "",
      targetDeliverable: "",
      payStructure: "",
      commissionPerItem: "",
      flatRate: "",
      paymentFrequency: "",
    });
    setStartDate(undefined);
    setEndDate(undefined);
    setExcludedDays([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create New Job
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Job Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Warehouse Team Alpha"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Logistics">Logistics</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
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
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliverableType">Deliverable Type</Label>
              <Select value={formData.deliverableType} onValueChange={(value) => setFormData(prev => ({ ...prev, deliverableType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily Items">Daily Items</SelectItem>
                  <SelectItem value="Weekly Deliveries">Weekly Deliveries</SelectItem>
                  <SelectItem value="Monthly Tickets">Monthly Tickets</SelectItem>
                  <SelectItem value="Hourly Tasks">Hourly Tasks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDeliverable">Target per Period</Label>
              <Input
                id="targetDeliverable"
                type="number"
                value={formData.targetDeliverable}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDeliverable: e.target.value }))}
                placeholder="e.g., 150"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payStructure">Pay Structure</Label>
            <Select value={formData.payStructure} onValueChange={(value) => setFormData(prev => ({ ...prev, payStructure: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select pay structure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commission">Commission per Item</SelectItem>
                <SelectItem value="flat">Flat Rate</SelectItem>
                <SelectItem value="commission_adjusted">Commission × (Days Worked / Total Expected Days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.payStructure === "commission" && (
            <div className="space-y-2">
              <Label htmlFor="commissionPerItem">Commission per Item ($)</Label>
              <Input
                id="commissionPerItem"
                type="number"
                step="0.01"
                value={formData.commissionPerItem}
                onChange={(e) => setFormData(prev => ({ ...prev, commissionPerItem: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
          )}

          {formData.payStructure === "flat" && (
            <div className="space-y-2">
              <Label htmlFor="flatRate">Flat Rate ($)</Label>
              <Input
                id="flatRate"
                type="number"
                step="0.01"
                value={formData.flatRate}
                onChange={(e) => setFormData(prev => ({ ...prev, flatRate: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
          )}

          {formData.payStructure === "commission_adjusted" && (
            <div className="space-y-2">
              <Label htmlFor="commissionPerItem">Commission per Item ($)</Label>
              <Input
                id="commissionPerItem"
                type="number"
                step="0.01"
                value={formData.commissionPerItem}
                onChange={(e) => setFormData(prev => ({ ...prev, commissionPerItem: e.target.value }))}
                placeholder="0.00"
                required
              />
              <p className="text-sm text-muted-foreground">
                Final pay = Items × Commission × (Days Worked / Total Expected Days)
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentFrequency">Payment Frequency</Label>
              <Select value={formData.paymentFrequency} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentFrequency: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Exclude Days of Week</Label>
              <div className="grid grid-cols-2 gap-2">
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={excludedDays.includes(day)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExcludedDays(prev => [...prev, day]);
                        } else {
                          setExcludedDays(prev => prev.filter(d => d !== day));
                        }
                      }}
                    />
                    <Label htmlFor={day} className="text-sm">{day.slice(0, 3)}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow">
              Create Job
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}