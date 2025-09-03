import { useState, useEffect } from "react";
import { BarChart3, Download, Calendar, TrendingUp, FileText } from "lucide-react";
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
  const [selectedReportType, setSelectedReportType] = useState("payout");
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
  }, [selectedJob, selectedPeriod, selectedReportType]);

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
      
      // Build query with filters
      let attendanceQuery = supabase
        .from('attendance')
        .select(`
          worker_id,
          job_id,
          attendance_date,
          status,
          workers (name),
          jobs (name, pay_structure, flat_rate, commission_per_item, hourly_rate, id)
        `)
        .gte('attendance_date', getDateRange().start)
        .lte('attendance_date', getDateRange().end);

      if (selectedJob !== 'all-jobs') {
        attendanceQuery = attendanceQuery.eq('job_id', selectedJob);
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery;

      if (attendanceError) throw attendanceError;

      let deliverablesQuery = supabase
        .from('deliverables')
        .select(`
          worker_id,
          job_id,
          quantity,
          deliverable_date,
          workers (name),
          jobs (name, id)
        `)
        .gte('deliverable_date', getDateRange().start)
        .lte('deliverable_date', getDateRange().end);

      if (selectedJob !== 'all-jobs') {
        deliverablesQuery = deliverablesQuery.eq('job_id', selectedJob);
      }

      const { data: deliverablesData, error: deliverablesError } = await deliverablesQuery;

      if (deliverablesError) throw deliverablesError;

      // Calculate reports from real data
      const calculatedReports = await calculateReports(attendanceData || [], deliverablesData || []);
      
      // Apply job filter to calculated reports if needed
      const filteredReports = selectedJob !== 'all-jobs' 
        ? calculatedReports.filter(report => {
            // Find the job by name since we have job names in reports
            const job = jobs.find(j => j.name === report.job_name);
            return job?.id === selectedJob;
          })
        : calculatedReports;
      
      setReports(filteredReports);
      calculateStats(filteredReports, attendanceData || [], deliverablesData || []);
      
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;

    switch (selectedPeriod) {
      case 'this-week':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'last-month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      default: // this-month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const exportToExcel = () => {
    const csv = [
      ['Worker', 'Job', 'Period', 'Days Worked', 'Deliverables', 'Base Pay', 'Commission', 'Total Payout', 'Status'],
      ...reports.map(report => [
        report.worker_name,
        report.job_name,
        report.period,
        `${report.days_worked}/${report.total_days}`,
        report.deliverables,
        report.base_pay.toFixed(2),
        report.commission.toFixed(2),
        report.total_payout.toFixed(2),
        report.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReportType}-report-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateReports = async (attendance: any[], deliverables: any[]): Promise<ReportData[]> => {
    // Fetch all payout data from database
    const { data: payoutsData } = await supabase
      .from('payouts')
      .select('*');

    // Filter for approved/processed payouts only
    const approvedPayouts = payoutsData?.filter(payout => 
      payout.status === 'approved' || payout.status === 'processed'
    ) || [];

    // If no approved payouts, return empty array
    if (approvedPayouts.length === 0) {
      return [];
    }

    // Calculate total expected working days for the period
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const calculateWorkingDays = (start: Date, end: Date) => {
      let workingDays = 0;
      const current = new Date(start);
      while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
          workingDays++;
        }
        current.setDate(current.getDate() + 1);
      }
      return workingDays;
    };
    
    const totalExpectedDays = calculateWorkingDays(periodStart, periodEnd);

    // Create reports directly from approved payout data
    const reports = await Promise.all(approvedPayouts.map(async (payout) => {
      // Get worker and job details
      const { data: workerData } = await supabase
        .from('workers')
        .select('name')
        .eq('id', payout.worker_id)
        .single();

      const { data: jobData } = await supabase
        .from('jobs')
        .select('name')
        .eq('id', payout.job_id)
        .single();

      // Count days worked for this worker-job combination
      const daysWorked = attendance.filter(record => 
        record.worker_id === payout.worker_id && 
        record.job_id === payout.job_id && 
        record.status === 'present'
      ).length;

      // Count deliverables for this worker-job combination
      const totalDeliverables = deliverables
        .filter(record => 
          record.worker_id === payout.worker_id && 
          record.job_id === payout.job_id
        )
        .reduce((sum, record) => sum + record.quantity, 0);

      return {
        worker_name: workerData?.name || 'Unknown',
        job_name: jobData?.name || 'Unknown',
        period: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
        days_worked: daysWorked,
        total_days: totalExpectedDays,
        deliverables: totalDeliverables,
        base_pay: payout.base_pay || 0,
        commission: payout.commission || 0,
        total_payout: payout.total_payout || 0,
        status: payout.status
      };
    }));

    return reports;
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Worker', 'Job', 'Period', 'Days Worked', 'Total Days', 'Deliverables', 'Base Pay', 'Commission', 'Total Payout', 'Status'],
      ...reports.map(report => [
        report.worker_name,
        report.job_name,
        report.period,
        report.days_worked,
        report.total_days,
        report.deliverables,
        `KShs ${report.base_pay}`,
        `KShs ${report.commission}`,
        `KShs ${report.total_payout}`,
        report.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateStats = (reports: ReportData[], attendanceData: any[], deliverablesData: any[]) => {
    const totalPayouts = reports.reduce((sum, r) => sum + r.total_payout, 0);
    const avgAttendance = attendanceData.length > 0 
      ? (attendanceData.filter(a => a.status === 'present').length / attendanceData.length) * 100 
      : 0;
    const deliverablesMet = deliverablesData.reduce((sum, d) => sum + d.quantity, 0);
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
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button className="bg-gradient-to-r from-primary to-primary-glow w-full sm:w-auto" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select Job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-jobs">All Jobs</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedReportType} onValueChange={setSelectedReportType}>
              <SelectTrigger className="w-full sm:w-48">
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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
        <CardContent className="overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Worker</TableHead>
                  <TableHead className="min-w-[120px]">Job</TableHead>
                  <TableHead className="min-w-[140px]">Period</TableHead>
                  <TableHead className="min-w-[100px]">Days Worked</TableHead>
                  <TableHead className="min-w-[100px]">Deliverables</TableHead>
                  <TableHead className="min-w-[100px]">Base Pay</TableHead>
                  <TableHead className="min-w-[100px]">Commission</TableHead>
                  <TableHead className="min-w-[120px]">Total Payout</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
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
                          : report.status === 'approved'
                          ? 'bg-primary text-primary-foreground'
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}