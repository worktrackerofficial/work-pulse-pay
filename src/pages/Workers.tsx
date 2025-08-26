import { useState } from "react";
import { Plus, Search, Phone, Mail, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mock data
const workers = [
  {
    id: 1,
    name: "John Smith",
    role: "Warehouse Operator",
    department: "Manufacturing",
    phone: "+1 (555) 123-4567",
    email: "john.smith@company.com",
    status: "active",
    currentJobs: ["Warehouse Team Alpha"],
    joinDate: "2024-01-15",
    attendanceRate: 96.5
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "Delivery Driver",
    department: "Logistics",
    phone: "+1 (555) 234-5678",
    email: "sarah.j@company.com",
    status: "active",
    currentJobs: ["Delivery Squad Beta"],
    joinDate: "2024-02-01",
    attendanceRate: 98.2
  },
  {
    id: 3,
    name: "Mike Chen",
    role: "Support Agent",
    department: "Customer Service",
    phone: "+1 (555) 345-6789",
    email: "mike.chen@company.com",
    status: "active",
    currentJobs: ["Customer Support Team"],
    joinDate: "2024-01-20",
    attendanceRate: 94.8
  },
  {
    id: 4,
    name: "Emily Davis",
    role: "Quality Inspector",
    department: "Manufacturing",
    phone: "+1 (555) 456-7890",
    email: "emily.davis@company.com",
    status: "inactive",
    currentJobs: [],
    joinDate: "2023-11-10",
    attendanceRate: 89.5
  }
];

export default function Workers() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Worker Management</h1>
        <Button className="bg-gradient-to-r from-primary to-primary-glow">
          <Plus className="mr-2 h-4 w-4" />
          Add New Worker
        </Button>
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  <span className="font-medium">{worker.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-xs">{worker.email}</span>
                </div>
              </div>
              
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Attendance Rate:</span>
                  <span className={`font-medium ${worker.attendanceRate >= 95 ? 'text-success' : worker.attendanceRate >= 90 ? 'text-warning' : 'text-destructive'}`}>
                    {worker.attendanceRate}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Active Jobs:</span>
                  <span className="font-medium">{worker.currentJobs.length}</span>
                </div>
              </div>

              {worker.currentJobs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Current Jobs:</span>
                  {worker.currentJobs.map((job, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {job}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Profile
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}