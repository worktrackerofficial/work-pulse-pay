import { useState, useEffect } from "react";
import { Plus, Search, Phone, Mail, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddWorkerDialog } from "@/components/jobs/AddWorkerDialog";
import { WorkerProfileDialog } from "@/components/workers/WorkerProfileDialog";
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
  current_jobs?: string[];
  attendance_rate?: number;
}

export default function Workers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          job_workers!inner(
            jobs(name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Process workers data to include current jobs and attendance rate
      const processedWorkers = await Promise.all((data || []).map(async (worker) => {
        // Get current jobs
        const currentJobs = worker.job_workers?.map((jw: any) => jw.jobs?.name).filter(Boolean) || [];
        
        // Calculate attendance rate
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('status')
          .eq('worker_id', worker.id);
        
        const totalAttendance = attendanceData?.length || 0;
        const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0;
        const attendanceRate = totalAttendance > 0 ? (presentDays / totalAttendance) * 100 : 0;
        
        return {
          ...worker,
          current_jobs: currentJobs,
          attendance_rate: attendanceRate
        };
      }));
      
      setWorkers(processedWorkers);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    if (!confirm('Are you sure you want to delete this worker? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', workerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Worker deleted successfully",
      });

      fetchWorkers(); // Refresh the workers list
    } catch (error) {
      console.error('Error deleting worker:', error);
      toast({
        title: "Error",
        description: "Failed to delete worker",
        variant: "destructive",
      });
    }
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Worker Management</h1>
          <AddWorkerDialog jobId={0} onWorkerAdded={fetchWorkers}>
            <Button className="bg-gradient-to-r from-primary to-primary-glow">
              <Plus className="mr-2 h-4 w-4" />
              Add New Worker
            </Button>
          </AddWorkerDialog>
        </div>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading workers...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Workers Management</h1>
        <div className="w-full sm:w-auto">
          <AddWorkerDialog onWorkerAdded={fetchWorkers}>
            <Button className="bg-gradient-to-r from-primary to-primary-glow w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add New Worker
            </Button>
          </AddWorkerDialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workers by name, role, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workers Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkers.map((worker) => (
          <Card key={worker.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(worker.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{worker.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{worker.role}</p>
                </div>
                <Badge 
                  variant={worker.status === 'active' ? 'default' : 'secondary'}
                  className={worker.status === 'active' ? 'bg-success text-success-foreground' : ''}
                >
                  {worker.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{worker.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{worker.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-xs">{worker.email || 'N/A'}</span>
                </div>
              </div>
              
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Attendance Rate:</span>
                  <span className={`font-medium ${worker.attendance_rate >= 95 ? 'text-success' : worker.attendance_rate >= 90 ? 'text-warning' : 'text-destructive'}`}>
                    {worker.attendance_rate}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Active Jobs:</span>
                  <span className="font-medium">{worker.current_jobs?.length || 0}</span>
                </div>
              </div>

              {worker.current_jobs && worker.current_jobs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Current Jobs:</span>
                  {worker.current_jobs.map((job, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {job}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <WorkerProfileDialog workerId={worker.id} onWorkerUpdated={fetchWorkers}>
                  <Button variant="outline" size="sm" className="flex-1">
                    View Profile
                  </Button>
                </WorkerProfileDialog>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeleteWorker(worker.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}