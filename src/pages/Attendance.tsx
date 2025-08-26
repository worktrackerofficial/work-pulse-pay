import { useState } from "react";
import { Calendar, Clock, CheckCircle, XCircle, Search } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data
const attendanceRecords = [
  {
    id: 1,
    workerName: "John Smith",
    job: "Warehouse Team Alpha",
    date: "2024-01-15",
    clockIn: "08:00",
    clockOut: "17:00",
    status: "present",
    deliverables: 145,
    target: 150
  },
  {
    id: 2,
    workerName: "Sarah Johnson",
    job: "Delivery Squad Beta",
    date: "2024-01-15",
    clockIn: "09:00",
    clockOut: "18:00",
    status: "present",
    deliverables: 52,
    target: 50
  },
  {
    id: 3,
    workerName: "Mike Chen",
    job: "Customer Support Team",
    date: "2024-01-15",
    clockIn: "10:00",
    clockOut: "19:00",
    status: "present",
    deliverables: 28,
    target: 30
  },
  {
    id: 4,
    workerName: "Emily Davis",
    job: "Warehouse Team Alpha",
    date: "2024-01-15",
    clockIn: null,
    clockOut: null,
    status: "absent",
    deliverables: 0,
    target: 150
  }
];

export default function Attendance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("2024-01-15");

  const filteredRecords = attendanceRecords.filter(record =>
    record.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.job.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-success text-success-foreground">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'late':
        return <Badge className="bg-warning text-warning-foreground">Late</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Attendance Tracking</h1>
        <Button className="bg-gradient-to-r from-primary to-primary-glow">
          <Clock className="mr-2 h-4 w-4" />
          Record Attendance
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by worker name or job..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01-15">January 15, 2024</SelectItem>
                <SelectItem value="2024-01-14">January 14, 2024</SelectItem>
                <SelectItem value="2024-01-13">January 13, 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold text-success">3</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absent Today</p>
                <p className="text-2xl font-bold text-destructive">1</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
              <p className="text-2xl font-bold text-primary">75%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Target Achievement</p>
              <p className="text-2xl font-bold text-primary">92%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Daily Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deliverables</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.workerName}</TableCell>
                  <TableCell>{record.job}</TableCell>
                  <TableCell>{record.clockIn || "-"}</TableCell>
                  <TableCell>{record.clockOut || "-"}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>
                    {record.deliverables}/{record.target}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (record.deliverables / record.target) >= 1 ? 'bg-success' :
                            (record.deliverables / record.target) >= 0.8 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${Math.min(100, (record.deliverables / record.target) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Math.round((record.deliverables / record.target) * 100)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}