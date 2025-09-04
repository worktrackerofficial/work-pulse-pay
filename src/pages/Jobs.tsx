import { useState, useEffect } from "react";
import { Plus, Search, Calendar, Users, DollarSign, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreateJobDialog } from "@/components/jobs/CreateJobDialog";
import { EditJobDialog } from "@/components/jobs/EditJobDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface Job {
  id: string;
  name: string;
  description: string;
  industry: string;
  pay_structure: 'commission' | 'flat' | 'hourly' | 'commission_adjusted' | 'team_commission';
  commission_per_item: number;
  flat_rate: number;
  hourly_rate: number;
  target_deliverable: number;
  deliverable_type: string;
  deliverable_frequency: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_frequency: string;
  excluded_days: string[];
  created_at: string;
  commission_pool?: number;
  worker_count?: number;
}

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          job_workers(count)
        `);

      if (error) throw error;

      const jobsWithCount = data?.map(job => ({
        ...job,
        worker_count: job.job_workers?.[0]?.count || 0
      })) || [];

      setJobs(jobsWithCount);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job deleted successfully",
      });

      fetchJobs(); // Refresh the jobs list
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    }
  };

  const getPayStructureDisplay = (job: Job) => {
    switch (job.pay_structure) {
      case 'commission':
        return `KShs ${job.commission_per_item} per item`;
      case 'flat':
        return `KShs ${job.flat_rate} flat rate`;
      case 'hourly':
        return `KShs ${job.hourly_rate}/hr`;
      case 'commission_adjusted':
        return `KShs ${job.commission_per_item} per item (adjusted)`;
      case 'team_commission':
        return `KShs ${job.commission_per_item} per item (Pool Commission)`;
      default:
        return 'Commission';
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Jobs Management</h1>
          <div className="w-full sm:w-auto">
            <CreateJobDialog onJobCreated={fetchJobs}>
              <Button className="bg-gradient-to-r from-primary to-primary-glow w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create New Job
              </Button>
            </CreateJobDialog>
          </div>
        </div>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Jobs Management</h1>
        <div className="w-full sm:w-auto">
          <CreateJobDialog onJobCreated={fetchJobs}>
            <Button className="bg-gradient-to-r from-primary to-primary-glow w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create New Job
            </Button>
          </CreateJobDialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by name or industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{job.name}</CardTitle>
                <Badge 
                  variant={job.status === 'active' ? 'default' : 'secondary'}
                  className="bg-success text-success-foreground"
                >
                  {job.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{job.industry}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Duration</span>
                </div>
                <div className="text-right">
                  {new Date(job.start_date).toLocaleDateString()} - {new Date(job.end_date).toLocaleDateString()}
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Workers</span>
                </div>
                <div className="text-right font-medium">{job.worker_count || 0}</div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Pay Structure</span>
                </div>
                <div className="text-right font-medium">{getPayStructureDisplay(job)}</div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-medium">{job.target_deliverable} {job.deliverable_type}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  View Details
                </Button>
                <EditJobDialog jobId={job.id} onJobUpdated={fetchJobs}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </EditJobDialog>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeleteJob(job.id)}
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