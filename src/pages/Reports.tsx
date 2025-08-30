import { useState, useEffect } from "react";
import { BarChart3, Download, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface ReportData {
  worker_name: string;
  job_name: string;
  period: string;
  days_worked: number;
  total_days: number;
  deliverables: number;
  base_pay: number;
  commission: number;
  total_payout: number;
  status: string;
}

export default function Reports() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState("all-jobs");
  const [selectedPeriod, setSelectedPeriod] = useState("this-month");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPayouts: 0,
    avgAttendance: 0,
    deliverablesMet: 0,
    efficiencyRate: 0
  });

  useEffect(() => {
    fetchJobs();
    fetchReports();
  }, [selectedJob, selectedPeriod]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, name')
        .eq('status', 'active');
      
      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch attendance, deliverables, and worker data
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          worker_id,
          attendance_date,
          status,
          workers (name),
          jobs (name, pay_structure, flat_rate, commission_per_item, hourly_rate)
        `)
        .gte('attendance_date', getDateRange().start)
        .lte('attendance_date', getDateRange().end);

      if (attendanceError) throw attendanceError;

      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('deliverables')
        .select(`
          worker_id,
          quantity,
          deliverable_date,
          workers (name),
          jobs (name)
        `)
        .gte('deliverable_date', getDateRange().start)
        .lte('deliverable_date', getDateRange().end);

      if (deliverablesError) throw deliverablesError;

      // Calculate reports from real data
      const calculatedReports = calculateReports(attendanceData || [], deliverablesData || []);
      setReports(calculatedReports);
      calculateStats(calculatedReports, attendanceData || [], deliverablesData || []);
      
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const calculateReports = (attendance: any[], deliverables: any[]): ReportData[] => {
    // Group by worker and calculate payouts
    const workerMap = new Map();
    
    attendance.forEach(record => {
      const key = record.worker_id;
      if (!workerMap.has(key)) {
        workerMap.set(key, {
          worker_name: record.workers?.name || 'Unknown',
          job_name: record.jobs?.name || 'Unknown',
          days_worked: 0,
          total_days: 0,
          deliverables: 0,
          base_pay: 0,
          commission: 0,
          total_payout: 0,
          status: 'processed',
          pay_structure: record.jobs?.pay_structure,
          flat_rate: record.jobs?.flat_rate || 0,
          commission_per_item: record.jobs?.commission_per_item || 0,
          hourly_rate: record.jobs?.hourly_rate || 0
        });
      }
      
      const worker = workerMap.get(key);
      worker.total_days++;
      if (record.status === 'present') {
        worker.days_worked++;
      }
    });

    deliverables.forEach(record => {
      const key = record.worker_id;
      if (workerMap.has(key)) {
        const worker = workerMap.get(key);
        worker.deliverables += record.quantity;
      }
    });

    // Calculate payouts for each worker
    return Array.from(workerMap.values()).map(worker => {
      let basePay = 0;
      let commission = 0;
      
      switch (worker.pay_structure) {
        case 'flat_rate':
          basePay = worker.flat_rate * worker.days_worked;
          break;
        case 'commission':
          commission = worker.commission_per_item * worker.deliverables;
          break;
        case 'hourly':
          basePay = worker.hourly_rate * worker.days_worked * 8; // 8 hours per day
          break;
      }
      
      return {
        worker_name: worker.worker_name,
        job_name: worker.job_name,
        period: "Current Period",
        days_worked: worker.days_worked,
        total_days: worker.total_days,
        deliverables: worker.deliverables,
        base_pay: basePay,
        commission: commission,
        total_payout: basePay + commission,
        status: worker.status
      };
    });
  };

  const calculateStats = (reports: ReportData[], attendance: any[], deliverables: any[]) => {
    const totalPayouts = reports.reduce((sum, r) => sum + r.total_payout, 0);
    const avgAttendance = attendance.length > 0 
      ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100 
      : 0;
    const deliverablesMet = deliverables.reduce((sum, d) => sum + d.quantity, 0);
    const efficiencyRate = reports.length > 0 
      ? (reports.reduce((sum, r) => sum + (r.days_worked / r.total_days), 0) / reports.length) * 100 
      : 0;

    setStats({
      totalPayouts,
      avgAttendance,
      deliverablesMet,
      efficiencyRate
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-glow">
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-jobs">All Jobs</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="this-month">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="payout">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payout">Payout Report</SelectItem>
                <SelectItem value="attendance">Attendance Report</SelectItem>
                <SelectItem value="performance">Performance Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payouts</p>
                <p className="text-2xl font-bold text-foreground">${stats.totalPayouts.toLocaleString()}</p>
                <p className="text-xs text-success">Current period</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Attendance</p>
              <p className="text-2xl font-bold text-foreground">{stats.avgAttendance.toFixed(1)}%</p>
              <p className="text-xs text-success">Current period</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Deliverables Met</p>
              <p className="text-2xl font-bold text-foreground">{stats.deliverablesMet.toLocaleString()}</p>
              <p className="text-xs text-success">Current period</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Efficiency Rate</p>
              <p className="text-2xl font-bold text-foreground">{stats.efficiencyRate.toFixed(1)}%</p>
              <p className="text-xs text-success">Current period</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Detailed Payout Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Days Worked</TableHead>
                <TableHead>Deliverables</TableHead>
                <TableHead>Base Pay</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Total Payout</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">Loading reports...</TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No data available</TableCell>
                </TableRow>
              ) : (
                reports.map((report, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{report.worker_name}</TableCell>
                    <TableCell>{report.job_name}</TableCell>
                    <TableCell>{report.period}</TableCell>
                    <TableCell>
                      {report.days_worked}/{report.total_days}
                    </TableCell>
                    <TableCell>{report.deliverables}</TableCell>
                    <TableCell>${report.base_pay.toFixed(2)}</TableCell>
                    <TableCell>${report.commission.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">${report.total_payout.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.status === 'processed' 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-warning text-warning-foreground'
                      }`}>
                        {report.status}
                      </span>
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