import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle, XCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordAttendanceDialog } from "@/components/attendance/RecordAttendanceDialog";
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
import { supabase } from "@/integrations/supabase/client";

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  status: string;
  notes?: string;
  worker_id: string;
  job_id: string;
  workers: {
    name: string;
  };
  jobs: {
    name: string;
    target_deliverable?: number;
  };
  deliverables?: {
    quantity: number;
  }[];
}


export default function Attendance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showAllRecords, setShowAllRecords] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [selectedDate, showAllRecords]);

  const fetchAttendanceRecords = async () => {
    try {
      let attendanceQuery = supabase
        .from('attendance')
        .select(`
          *,
          workers(name),
          jobs(name, target_deliverable)
        `)
        .order('attendance_date', { ascending: false });

      let deliverablesQuery = supabase
        .from('deliverables')
        .select(`
          *,
          workers(name)
        `)
        .order('deliverable_date', { ascending: false });

      if (!showAllRecords && selectedDate) {
        attendanceQuery = attendanceQuery.eq('attendance_date', selectedDate);
        deliverablesQuery = deliverablesQuery.eq('deliverable_date', selectedDate);
      } else {
        // Show records from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
        
        attendanceQuery = attendanceQuery.gte('attendance_date', thirtyDaysAgoStr);
        deliverablesQuery = deliverablesQuery.gte('deliverable_date', thirtyDaysAgoStr);
      }

      const [attendanceRes, deliverablesRes] = await Promise.all([
        attendanceQuery,
        deliverablesQuery
      ]);

      if (attendanceRes.error) throw attendanceRes.error;
      if (deliverablesRes.error) throw deliverablesRes.error;
      
      setRecords(attendanceRes.data || []);
      setDeliverables(deliverablesRes.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record =>
    record.workers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.jobs?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <RecordAttendanceDialog>
          <Button className="bg-gradient-to-r from-primary to-primary-glow">
            <Clock className="mr-2 h-4 w-4" />
            Record Attendance
          </Button>
        </RecordAttendanceDialog>
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
            <Select
              value={showAllRecords ? "all" : "date"}
              onValueChange={(value) => {
                setShowAllRecords(value === "all");
                if (value === "all") setSelectedDate("");
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Last 30 days</SelectItem>
                <SelectItem value="date">Specific date</SelectItem>
              </SelectContent>
            </Select>
            {!showAllRecords && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              />
            )}
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
                <p className="text-2xl font-bold text-success">
                  {new Set(records.filter(r => r.status === 'present').map(r => r.worker_id)).size}
                </p>
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
                <p className="text-2xl font-bold text-destructive">
                  {new Set(records.filter(r => r.status === 'absent').map(r => r.worker_id)).size}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
              <p className="text-2xl font-bold text-primary">
                {(() => {
                  const uniqueWorkers = new Set(records.map(r => r.worker_id)).size;
                  const uniquePresentWorkers = new Set(records.filter(r => r.status === 'present').map(r => r.worker_id)).size;
                  return uniqueWorkers > 0 ? Math.round((uniquePresentWorkers / uniqueWorkers) * 100) : 0;
                })()}%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold text-primary">{new Set(records.map(r => r.worker_id)).size}</p>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center text-muted-foreground">
                     No attendance records found {!showAllRecords && selectedDate ? `for ${selectedDate}` : 'in the last 30 days'}
                   </TableCell>
                 </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.workers?.name}</TableCell>
                    <TableCell>{record.jobs?.name}</TableCell>
                     <TableCell>08:00</TableCell>
                     <TableCell>{record.status === 'present' ? '17:00' : '-'}</TableCell>
                     <TableCell>{getStatusBadge(record.status)}</TableCell>
                     <TableCell>
                       {(() => {
                         const workerDeliverables = deliverables.filter(d => d.worker_id === record.worker_id);
                         const totalDeliverables = workerDeliverables.reduce((sum, d) => sum + d.quantity, 0);
                         return totalDeliverables || '-';
                       })()}
                     </TableCell>
                     <TableCell>
                       {(() => {
                         const workerDeliverables = deliverables.filter(d => d.worker_id === record.worker_id);
                         const totalDeliverables = workerDeliverables.reduce((sum, d) => sum + d.quantity, 0);
                         const target = (record.jobs as any)?.target_deliverable || 0;
                         if (target === 0) return '-';
                         const percentage = Math.round((totalDeliverables / target) * 100);
                         return (
                           <div className="flex items-center gap-2">
                             <span className={`text-sm ${
                               percentage >= 100 ? 'text-success' : 
                               percentage >= 80 ? 'text-warning' : 'text-destructive'
                             }`}>
                               {percentage}%
                             </span>
                             <div className="w-16 bg-muted rounded-full h-2">
                               <div 
                                 className={`h-2 rounded-full ${
                                   percentage >= 100 ? 'bg-success' : 
                                   percentage >= 80 ? 'bg-warning' : 'bg-destructive'
                                 }`}
                                 style={{ width: `${Math.min(100, percentage)}%` }}
                               />
                             </div>
                           </div>
                         );
                       })()}
                     </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}