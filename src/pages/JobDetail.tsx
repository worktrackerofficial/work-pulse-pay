import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Users, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddWorkerDialog } from "@/components/jobs/AddWorkerDialog";
import { RecordAttendanceDialog } from "@/components/jobs/RecordAttendanceDialog";
import { RecordDeliverablesDialog } from "@/components/jobs/RecordDeliverablesDialog";

// Mock data - in real app this would come from backend
const mockJob = {
  id: 1,
  name: "Warehouse Team Alpha",
  industry: "Manufacturing",
  description: "Processing and packaging items for delivery",
  startDate: "2024-01-15",
  endDate: "2024-03-15",
  deliverableType: "Daily Items",
  targetDeliverable: 150,
  payStructure: "commission",
  commissionPerItem: 2.50,
  flatRate: 0,
  paymentFrequency: "Weekly",
  excludedDays: ["Sunday"],
  status: "active",
  workers: [
    { id: 1, name: "John Doe", role: "Packer", joinDate: "2024-01-15", status: "active" },
    { id: 2, name: "Jane Smith", role: "Quality Check", joinDate: "2024-01-16", status: "active" },
    { id: 3, name: "Mike Johnson", role: "Supervisor", joinDate: "2024-01-15", status: "active" },
  ]
};

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // In real app, you'd fetch job data based on jobId
  const job = mockJob;

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
                  {new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}
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
                <p className="font-medium">{job.workers.length} Active</p>
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
                <p className="font-medium">{job.targetDeliverable} {job.deliverableType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Pay Structure</p>
              <p className="font-medium">
                {job.payStructure === 'commission' && `$${job.commissionPerItem} per item`}
                {job.payStructure === 'flat' && `$${job.flatRate} flat rate`}
                {job.payStructure === 'commission_adjusted' && `$${job.commissionPerItem} adjusted`}
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
                      <span>{new Date(job.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date:</span>
                      <span>{new Date(job.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Excluded Days:</span>
                      <span>{job.excludedDays.join(", ") || "None"}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Payment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pay Structure:</span>
                      <span className="capitalize">{job.payStructure.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate:</span>
                      <span>${job.commissionPerItem} per item</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Frequency:</span>
                      <span>{job.paymentFrequency}</span>
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
            <AddWorkerDialog jobId={job.id}>
              <Button className="bg-gradient-to-r from-primary to-primary-glow">
                <Plus className="mr-2 h-4 w-4" />
                Add Worker
              </Button>
            </AddWorkerDialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {job.workers.map((worker) => (
              <Card key={worker.id} className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium">{worker.name}</h4>
                      <p className="text-sm text-muted-foreground">{worker.role}</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Joined: {new Date(worker.joinDate).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Attendance Management</h3>
            <RecordAttendanceDialog jobId={job.id} workers={job.workers}>
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
              <p className="text-muted-foreground">No attendance records yet. Start recording daily attendance for this job.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverables" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Deliverables Tracking</h3>
            <RecordDeliverablesDialog 
              jobId={job.id} 
              workers={job.workers} 
              deliverableType={job.deliverableType}
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
              <p className="text-muted-foreground">
                Target: {job.targetDeliverable} {job.deliverableType}
              </p>
              <p className="text-muted-foreground mt-2">
                No deliverables recorded yet. Start tracking worker output.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}