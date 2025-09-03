import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Building, Phone, Mail, Users, TrendingUp } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Worker {
  id: string;
  name: string;
  role: string;
  department: string;
  phone?: string;
  email?: string;
  status: string;
  join_date: string;
  tax_info?: string;
}

interface WorkerProfileDialogProps {
  children: React.ReactNode;
  workerId: string;
  onWorkerUpdated?: () => void;
}

export function WorkerProfileDialog({ children, workerId, onWorkerUpdated }: WorkerProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Worker>>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && workerId) {
      fetchWorkerData();
    }
  }, [open, workerId]);

  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      // Fetch worker details
      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('id', workerId)
        .single();

      if (workerError) throw workerError;

      // Fetch worker's jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_workers')
        .select(`
          jobs (
            id,
            name,
            industry,
            status,
            start_date,
            end_date
          )
        `)
        .eq('worker_id', workerId)
        .eq('is_active', true);

      // Fetch recent attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          jobs (name)
        `)
        .eq('worker_id', workerId)
        .order('attendance_date', { ascending: false })
        .limit(10);

      // Fetch recent deliverables
      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('deliverables')
        .select(`
          *,
          jobs (name, deliverable_type)
        `)
        .eq('worker_id', workerId)
        .order('deliverable_date', { ascending: false })
        .limit(10);

      setWorker(workerData);
      setFormData(workerData);
      setJobs(jobsData?.map(jw => jw.jobs).filter(Boolean) || []);
      setAttendance(attendanceData || []);
      setDeliverables(deliverablesData || []);
    } catch (error) {
      console.error('Error fetching worker data:', error);
      toast({
        title: "Error",
        description: "Failed to load worker details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Ensure status is one of the allowed values
      const updateData = {
        ...formData,
        status: formData.status as 'active' | 'inactive' | 'terminated'
      };
      
      const { error } = await supabase
        .from('workers')
        .update(updateData)
        .eq('id', workerId);

      if (error) throw error;

      setWorker({ ...worker!, ...updateData });
      setIsEditing(false);
      onWorkerUpdated?.();
      
      toast({
        title: "Success",
        description: "Worker details updated successfully.",
      });
    } catch (error) {
      console.error('Error updating worker:', error);
      toast({
        title: "Error",
        description: "Failed to update worker details.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const attendanceRate = attendance.length > 0 
    ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
    : 0;

  const totalDeliverables = deliverables.reduce((sum, d) => sum + d.quantity, 0);

  if (loading || !worker) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading worker profile...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getInitials(worker.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">{worker.name}</DialogTitle>
                <p className="text-muted-foreground">{worker.role} • {worker.department}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-primary-glow">
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Input
                          id="role"
                          value={formData.role || ''}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={formData.department || ''}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="taxInfo">Tax Information</Label>
                        <Input
                          id="taxInfo"
                          value={formData.tax_info || ''}
                          onChange={(e) => setFormData({ ...formData, tax_info: e.target.value })}
                          placeholder="KRA PIN or tax identification number"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Department:</span>
                        <span className="font-medium">{worker.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{worker.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{worker.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Join Date:</span>
                        <span className="font-medium">{new Date(worker.join_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Tax Info:</span>
                        <span className="font-medium">{worker.tax_info || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={worker.status === 'active' ? 'default' : 'secondary'}>
                          {worker.status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Attendance Rate:</span>
                    <span className={`font-medium ${attendanceRate >= 95 ? 'text-success' : attendanceRate >= 90 ? 'text-warning' : 'text-destructive'}`}>
                      {attendanceRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active Jobs:</span>
                    <span className="font-medium">{jobs.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Deliverables:</span>
                    <span className="font-medium">{totalDeliverables}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{job.name}</h4>
                        <p className="text-sm text-muted-foreground">{job.industry}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(job.start_date).toLocaleDateString()} - {new Date(job.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {jobs.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No active jobs assigned.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Attendance Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <CalendarComponent
                      mode="multiple"
                      selected={attendance
                        .filter(record => record.status === 'present')
                        .map(record => new Date(record.attendance_date))}
                      className="rounded-md border"
                      modifiers={{
                        present: attendance
                          .filter(record => record.status === 'present')
                          .map(record => new Date(record.attendance_date)),
                        absent: attendance
                          .filter(record => record.status === 'absent')
                          .map(record => new Date(record.attendance_date)),
                        late: attendance
                          .filter(record => record.status === 'late')
                          .map(record => new Date(record.attendance_date))
                      }}
                      modifiersStyles={{
                        present: { backgroundColor: '#3b82f6', color: 'white' },
                        absent: { backgroundColor: '#ef4444', color: 'white' },
                        late: { backgroundColor: '#f59e0b', color: 'white' }
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-sm">Late</span>
                    </div>
                    <div className="pt-4 space-y-2">
                      <h4 className="font-medium">Recent Records</h4>
                      {attendance.slice(0, 5).map((record) => (
                        <div key={record.id} className="flex justify-between items-center text-sm">
                          <span>{new Date(record.attendance_date).toLocaleDateString()}</span>
                          <Badge variant={record.status === 'present' ? 'default' : record.status === 'late' ? 'secondary' : 'destructive'} className="text-xs">
                            {record.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="space-y-3">
              {deliverables.map((record) => (
                <Card key={record.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{record.jobs?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.deliverable_date).toLocaleDateString()}
                        </p>
                        {record.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{record.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{record.quantity} {record.jobs?.deliverable_type}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {deliverables.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No deliverables recorded.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}