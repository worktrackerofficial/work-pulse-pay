import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Users, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddWorkerDialog } from "@/components/jobs/AddWorkerDialog";
import { RecordAttendanceDialog } from "@/components/jobs/RecordAttendanceDialog";
import { RecordDeliverablesDialog } from "@/components/jobs/RecordDeliverablesDialog";
import { supabase } from "@/integrations/supabase/client";

interface Job {
  id: string;
  name: string;
  industry: string;
  description?: string;
  start_date: string;
  end_date: string;
  deliverable_type: string;
  deliverable_frequency: string;
  target_deliverable: number;
  pay_structure: string;
  commission_per_item: number;
  flat_rate: number;
  hourly_rate: number;
  payment_frequency: string;
  excluded_days: string[];
  status: string;
}

interface Worker {
  id: string;
  name: string;
  role: string;
  join_date: string;
  status: string;
}

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [job, setJob] = useState<Job | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [recentDeliverables, setRecentDeliverables] = useState<any[]>([]);
  const [teamDeliverables, setTeamDeliverables] = useState<any[]>([]);

  useEffect(() => {
    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Fetch workers for this job
      const { data: workersData, error: workersError } = await supabase
        .from('job_workers')
        .select(`
          workers (
            id,
            name,
            role,
            join_date,
            status
          )
        `)
        .eq('job_id', jobId)
        .eq('is_active', true);

      if (workersError) throw workersError;

      // Fetch recent attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          workers (name)
        `)
        .eq('job_id', jobId)
        .order('attendance_date', { ascending: false })
        .limit(10);

      // Fetch recent deliverables
      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('deliverables')
        .select(`
          *,
          workers (name)
        `)
        .eq('job_id', jobId)
        .order('deliverable_date', { ascending: false })
        .limit(10);

      // Fetch team deliverables for pool commission jobs
      const { data: teamDeliverablesData, error: teamDeliverablesError } = await supabase
        .from('team_deliverables')
        .select('*')
        .eq('job_id', jobId)
        .order('deliverable_date', { ascending: false })
        .limit(10);

      setJob(jobData);
      setWorkers(workersData?.map(jw => jw.workers).filter(Boolean) || []);
      setRecentAttendance(attendanceData || []);
      setRecentDeliverables(deliverablesData || []);
      setTeamDeliverables(teamDeliverablesData || []);
    } catch (error) {
      console.error('Error fetching job data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onWorkerAdded = () => {
    fetchJobData();
  };

  const onAttendanceRecorded = () => {
    fetchJobData();
  };

  const onDeliverablesRecorded = () => {
    fetchJobData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Job not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/jobs")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{job.name}</h1>
            <Badge 
              variant={job.status === 'active' ? 'default' : 'secondary'}
              className="bg-success text-success-foreground"
            >
              {job.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{job.industry} • {job.description}</p>
        </div>
      </div>

      {/* Job Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {new Date(job.start_date).toLocaleDateString()} - {new Date(job.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Workers</p>
                <p className="font-medium">{workers.length} Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="font-medium">{job.target_deliverable} {job.deliverable_type}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Pay Structure</p>
              <p className="font-medium">
                {job.pay_structure === 'commission' && `KShs ${job.commission_per_item} per item`}
                {job.pay_structure === 'flat' && `KShs ${job.flat_rate} flat rate`}
                {job.pay_structure === 'hourly' && `KShs ${job.hourly_rate}/hr`}
                {job.pay_structure === 'commission_adjusted' && `KShs ${job.commission_per_item} adjusted`}
                {job.pay_structure === 'team_commission' && `KShs ${job.commission_per_item} per item (Pool Commission)`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Schedule Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span>{new Date(job.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date:</span>
                      <span>{new Date(job.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Excluded Days:</span>
                      <span>{job.excluded_days?.join(", ") || "None"}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Payment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pay Structure:</span>
                      <span className="capitalize">{job.pay_structure.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate:</span>
                      <span>
                        {job.pay_structure === 'commission' && `KShs ${job.commission_per_item} per item`}
                        {job.pay_structure === 'flat' && `KShs ${job.flat_rate} flat rate`}
                        {job.pay_structure === 'hourly' && `KShs ${job.hourly_rate}/hr`}
                        {job.pay_structure === 'team_commission' && `KShs ${job.commission_per_item} per item (Pool Commission)`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Frequency:</span>
                      <span>{job.payment_frequency}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Job Workers</h3>
            <AddWorkerDialog jobId={job.id} onWorkerAdded={onWorkerAdded}>
              <Button className="bg-gradient-to-r from-primary to-primary-glow">
                <Plus className="mr-2 h-4 w-4" />
                Add Worker
              </Button>
            </AddWorkerDialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workers.map((worker) => (
              <Card key={worker.id} className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium">{worker.name}</h4>
                      <p className="text-sm text-muted-foreground">{worker.role}</p>
                    </div>
                    <Badge variant="secondary">{worker.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Joined: {new Date(worker.join_date).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Attendance Management</h3>
            <RecordAttendanceDialog jobId={job.id} workers={workers} onAttendanceRecorded={onAttendanceRecorded}>
              <Button className="bg-gradient-to-r from-primary to-primary-glow">
                <CheckCircle className="mr-2 h-4 w-4" />
                Record Attendance
              </Button>
            </RecordAttendanceDialog>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {recentAttendance.length > 0 ? (
                <div className="space-y-3">
                  {recentAttendance.map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{record.workers?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.attendance_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={record.status === 'present' ? 'default' : 'destructive'}>
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No attendance records yet. Start recording daily attendance for this job.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverables" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Deliverables Tracking</h3>
            <RecordDeliverablesDialog 
              jobId={job.id} 
              workers={workers} 
              deliverableType={job.deliverable_type}
              deliverableFrequency={job.deliverable_frequency as "daily" | "weekly" | "monthly"}
              payStructure={job.pay_structure}
              onDeliverablesRecorded={fetchJobData}
            >
              <Button className="bg-gradient-to-r from-primary to-primary-glow">
                <Plus className="mr-2 h-4 w-4" />
                Record Deliverables
              </Button>
            </RecordDeliverablesDialog>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Deliverables Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-muted-foreground">
                  Target: {job.target_deliverable} {job.deliverable_type}
                </p>
                <p className="text-muted-foreground">
                  Total Recorded: {
                    job.pay_structure === 'team_commission' 
                      ? teamDeliverables.reduce((sum, d) => sum + d.quantity, 0)
                      : recentDeliverables.reduce((sum, d) => sum + d.quantity, 0)
                  } {job.deliverable_type}
                </p>
              </div>

              {/* Team Commission Deliverables */}
              {job.pay_structure === 'team_commission' && teamDeliverables.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-primary">Team Deliverables</h4>
                  <div className="space-y-3">
                    {teamDeliverables.map((record) => (
                      <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg bg-primary/5">
                        <div>
                          <p className="font-medium">Team Total</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.deliverable_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary">{record.quantity} {job.deliverable_type}</p>
                          <p className="text-xs text-muted-foreground">Pool Commission</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Worker Deliverables */}
              {job.pay_structure !== 'team_commission' && recentDeliverables.length > 0 ? (
                <div className="space-y-3">
                  {recentDeliverables.map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{record.workers?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.deliverable_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{record.quantity} {job.deliverable_type}</p>
                        {record.notes && (
                          <p className="text-xs text-muted-foreground">{record.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : job.pay_structure !== 'team_commission' ? (
                <p className="text-muted-foreground">
                  No deliverables recorded yet. Start tracking worker output.
                </p>
              ) : teamDeliverables.length === 0 ? (
                <p className="text-muted-foreground">
                  No team deliverables recorded yet. Start tracking team output.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}