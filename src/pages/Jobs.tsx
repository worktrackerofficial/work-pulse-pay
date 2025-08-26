import { useState } from "react";
import { Plus, Search, Calendar, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data
const jobs = [
  {
    id: 1,
    name: "Warehouse Team Alpha",
    industry: "Manufacturing",
    startDate: "2024-01-15",
    endDate: "2024-03-15",
    workers: 12,
    payStructure: "Commission + Base",
    status: "active",
    deliverableType: "Daily Items",
    targetDeliverable: 150
  },
  {
    id: 2,
    name: "Delivery Squad Beta",
    industry: "Logistics",
    startDate: "2024-02-01",
    endDate: "2024-04-30",
    workers: 8,
    payStructure: "Per Delivery",
    status: "active",
    deliverableType: "Weekly Deliveries",
    targetDeliverable: 50
  },
  {
    id: 3,
    name: "Customer Support Team",
    industry: "Service",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    workers: 15,
    payStructure: "Hourly + Bonus",
    status: "active",
    deliverableType: "Monthly Tickets",
    targetDeliverable: 200
  }
];

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredJobs = jobs.filter(job =>
    job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Job Management</h1>
        <Button className="bg-gradient-to-r from-primary to-primary-glow">
          <Plus className="mr-2 h-4 w-4" />
          Create New Job
        </Button>
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  {new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Workers</span>
                </div>
                <div className="text-right font-medium">{job.workers}</div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Pay Structure</span>
                </div>
                <div className="text-right font-medium">{job.payStructure}</div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-medium">{job.targetDeliverable} {job.deliverableType}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}