import { useState, useEffect } from "react";
import { DollarSign, Calculator, Download, Search } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PayoutDetailsDialog } from "@/components/dialogs/PayoutDetailsDialog";

interface PayoutData {
  id: string;
  worker_name: string;
  job_name: string;
  days_worked: number;
  total_days: number;
  deliverables: number;
  target_deliverables: number;
  base_pay: number;
  commission: number;
  total_payout: number;
  status: string;
  payment_type: string;
}

// Mock data
const payouts = [
  {
    id: 1,
    worker: "John Smith",
    job: "Warehouse Team Alpha",
    period: "Week 1-2 Jan 2024",
    daysWorked: 10,
    totalDays: 10,
    deliverables: 1450,
    targetDeliverables: 1500,
    basePay: 800,
    commission: 290,
    bonus: 100,
    deductions: 0,
    totalPayout: 1190,
    status: "pending",
    paymentType: "Commission + Base"
  },
  {
    id: 2,
    worker: "Sarah Johnson", 
    job: "Delivery Squad Beta",
    period: "Week 1-2 Jan 2024",
    daysWorked: 9,
    totalDays: 10,
    deliverables: 520,
    targetDeliverables: 500,
    basePay: 720,
    commission: 260,
    bonus: 50,
    deductions: 10,
    totalPayout: 1020,
    status: "processed",
    paymentType: "Per Delivery"
  },
  {
    id: 3,
    worker: "Mike Chen",
    job: "Customer Support Team", 
    period: "Week 1-2 Jan 2024",
    daysWorked: 10,
    totalDays: 10,
    deliverables: 280,
    targetDeliverables: 300,
    basePay: 1000,
    commission: 140,
    bonus: 0,
    deductions: 0,
    totalPayout: 1140,
    status: "approved",
    paymentType: "Hourly + Bonus"
  }
];

export default function Payouts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payoutsData, setPayoutsData] = useState<PayoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayoutsData();
  }, []);

  const fetchPayoutsData = async () => {
    try {
      // First check for existing stored payouts
      const { data: storedPayouts, error: payoutsError } = await supabase
        .from('payouts')
        .select('*');

      if (payoutsError) throw payoutsError;

      // Always fetch fresh attendance and deliverables data
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          worker_id,
          attendance_date,
          status,
          job_id,
          workers (name),
          jobs (
            id,
            name,
            pay_structure,
            flat_rate,
            commission_per_item,
            hourly_rate,
            target_deliverable,
 
          )
        `);

      if (attendanceError) throw attendanceError;

      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('deliverables')
        .select(`
          worker_id,
          quantity,
          deliverable_date,
          job_id,
          workers (name),
          jobs (name)
        `);

      if (deliverablesError) throw deliverablesError;

      // Calculate fresh payouts from current data
      const calculatedPayouts = await calculateAndStorePayouts(attendanceData || [], deliverablesData || [], storedPayouts || []);
      setPayoutsData(calculatedPayouts);
      
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAndStorePayouts = async (attendance: any[], deliverables: any[], existingPayouts: any[] = []): Promise<PayoutData[]> => {
    const workerMap = new Map();
    
    // Calculate total expected working days for the period
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Calculate working days (excluding weekends)
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
    // Working days completed in the current period **up to today**
    const totalWorkingDaysSoFar = calculateWorkingDays(periodStart, today);
    
    // Process attendance data
    attendance.forEach(record => {
      const key = record.worker_id;
      if (!workerMap.has(key)) {
        workerMap.set(key, {
          id: key,
          worker_id: record.worker_id,
          job_id: record.job_id,
          worker_name: record.workers?.name || 'Unknown',
          job_name: record.jobs?.name || 'Unknown',
          days_worked: 0,
          total_days: totalWorkingDaysSoFar,
          deliverables: 0,
          target_deliverables: record.jobs?.target_deliverable || 0,
          base_pay: 0,
          commission: 0,
          total_payout: 0,
          status: 'pending',
          payment_type: record.jobs?.pay_structure || 'commission',
          pay_structure: record.jobs?.pay_structure,
          flat_rate: record.jobs?.flat_rate || 0,
          commission_per_item: record.jobs?.commission_per_item || 0,
          hourly_rate: record.jobs?.hourly_rate || 0
        });
      }
      
      const worker = workerMap.get(key);
      if (record.status === 'present') {
        worker.days_worked++;
      }
    });

    // Include workers assigned to team_commission jobs even if they have no attendance yet
    const { data: jobWorkersData, error: jobWorkersError } = await supabase
      .from('job_workers')
      .select(`
        worker_id,
        job_id,
        workers (name),
        jobs (
          id,
          name,
          pay_structure,
          flat_rate,
          commission_per_item,
          hourly_rate,
          target_deliverable,
          commission_pool
        )
      `);

    if (jobWorkersError) throw jobWorkersError;

    jobWorkersData?.forEach(record => {
      if (record.jobs?.pay_structure === 'team_commission') {
        const key = record.worker_id;
        if (!workerMap.has(key)) {
          workerMap.set(key, {
            id: key,
            worker_id: record.worker_id,
            job_id: record.job_id,
            worker_name: record.workers?.name || 'Unknown',
            job_name: record.jobs?.name || 'Unknown',
            days_worked: 0,
            total_days: totalWorkingDaysSoFar,
            deliverables: 0,
            target_deliverables: record.jobs?.target_deliverable || 0,
            base_pay: 0,
            commission: 0,
            total_payout: 0,
            status: 'pending',
            payment_type: record.jobs?.pay_structure,
            pay_structure: record.jobs?.pay_structure,
            flat_rate: record.jobs?.flat_rate || 0,
            commission_per_item: record.jobs?.commission_per_item || 0,
            hourly_rate: record.jobs?.hourly_rate || 0,
 : record.jobs?.commission_pool || 0
          });
        }
      }
    });

    // Accumulate deliverables totals per job for pool calculation (individual + team)
    const jobDeliverableSums = new Map<string, number>();

    // Process individual deliverables data
    // Individual deliverables
    deliverables.forEach(record => {
      const key = record.worker_id;
      if (workerMap.has(key)) {
        const worker = workerMap.get(key);
        worker.deliverables += record.quantity;

        // accumulate job total
        jobDeliverableSums.set(record.job_id, (jobDeliverableSums.get(record.job_id) || 0) + record.quantity);
      }
    });



    // Calculate payouts and store them
    const payoutRecords = [];

    // Group workers by job for team commission calculation
    const jobGroups = new Map();
    for (const worker of workerMap.values()) {
      if (!jobGroups.has(worker.job_id)) {
        jobGroups.set(worker.job_id, []);
      }
      jobGroups.get(worker.job_id).push(worker);
    }

    for (const worker of workerMap.values()) {
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
          basePay = worker.hourly_rate * worker.days_worked * 8;
          break;
        case 'team_commission':
          // Pool-based job: pool equals *all deliverables for this job so far* × commission_per_item
          const pool = (jobDeliverableSums.get(worker.job_id) || 0) * worker.commission_per_item;
          if (worker.total_days > 0 && pool > 0) {
            const shareRatio = worker.days_worked / totalWorkingDaysSoFar;
            commission = pool * shareRatio;
          }
          break;
      }
      
      const totalPayout = basePay + commission;
      
      const payoutRecord = {
        worker_id: worker.worker_id,
        job_id: worker.job_id,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        days_worked: worker.days_worked,
        total_days: worker.total_days,
        deliverables: worker.pay_structure === 'team_commission' ? 0 : worker.deliverables,
        target_deliverables: worker.target_deliverables,
        base_pay: basePay,
        commission: commission,
        total_payout: totalPayout,
        status: 'pending',
        payment_type: worker.payment_type
      };

      payoutRecords.push(payoutRecord);
    }

    // Only store new payouts that don't already exist
    const existingPayoutKeys = new Set(existingPayouts.map(p => `${p.worker_id}-${p.job_id}-${p.period_start}`));
    const newPayoutRecords = payoutRecords.filter(record => 
      !existingPayoutKeys.has(`${record.worker_id}-${record.job_id}-${record.period_start}`)
    );

    if (newPayoutRecords.length > 0) {
      const { error } = await supabase
        .from('payouts')
        .insert(newPayoutRecords);
      
      if (error) {
        console.error('Error storing payouts:', error);
      }
    }

    // Merge existing payouts with calculated ones, prioritizing existing approved/processed payouts
    const existingPayoutMap = new Map();
    existingPayouts.forEach(payout => {
      const key = `${payout.worker_id}-${payout.job_id}`;
      existingPayoutMap.set(key, payout);
    });

    // Return formatted data combining existing and calculated payouts
    const allPayouts = [];
    
    // Add existing payouts first
    if (existingPayouts.length > 0) {
      const workerIds = [...new Set(existingPayouts.map(p => p.worker_id))];
      const jobIds = [...new Set(existingPayouts.map(p => p.job_id))];

      const { data: workers } = await supabase
        .from('workers')
        .select('id, name')
        .in('id', workerIds);

      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, name')
        .in('id', jobIds);

      const workerNameMap = new Map(workers?.map(w => [w.id, w.name]) || []);
      const jobNameMap = new Map(jobs?.map(j => [j.id, j.name]) || []);

      existingPayouts.forEach(payout => {
        allPayouts.push({
          id: payout.id,
          worker_name: workerNameMap.get(payout.worker_id) || 'Unknown',
          job_name: jobNameMap.get(payout.job_id) || 'Unknown',
          days_worked: payout.days_worked,
          total_days: payout.total_days,
          deliverables: payout.deliverables,
          target_deliverables: payout.target_deliverables,
          base_pay: Number(payout.base_pay),
          commission: Number(payout.commission),
          total_payout: Number(payout.total_payout),
          status: payout.status,
          payment_type: payout.payment_type,
          period: `${new Date(payout.period_start).toLocaleDateString()} - ${new Date(payout.period_end).toLocaleDateString()}`
        });
      });
    }

    // Add new calculated payouts for workers not already in existing payouts
    Array.from(workerMap.values()).forEach(worker => {
      const key = `${worker.worker_id}-${worker.job_id}`;
      if (!existingPayoutMap.has(key)) {
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
            basePay = worker.hourly_rate * worker.days_worked * 8;
            break;
          case 'team_commission':
            // Pool-based job: pool equals job deliverables × commission_per_item so far
            const pool = (jobDeliverableSums.get(worker.job_id) || 0) * worker.commission_per_item;
            if (worker.total_days > 0 && pool > 0) {
              const shareRatio = worker.days_worked / totalWorkingDaysSoFar;
              commission = pool * shareRatio;
            }
            break;
        }
        
        allPayouts.push({
          id: worker.id,
          worker_name: worker.worker_name,
          job_name: worker.job_name,
          days_worked: worker.days_worked,
          total_days: worker.total_days,
          deliverables: worker.deliverables,
          target_deliverables: worker.target_deliverables,
          base_pay: basePay,
          commission: commission,
          total_payout: basePay + commission,
          status: 'pending',
          payment_type: worker.payment_type
        });
      }
    });

    return allPayouts;
  };

  const filteredPayouts = (payoutsData.length > 0 ? payoutsData : payouts).filter(payout => {
    const workerName = 'worker' in payout ? payout.worker : payout.worker_name;
    const jobName = 'job' in payout ? payout.job : payout.job_name;
    const matchesSearch = workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jobName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payout.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const recalculatePayouts = () => {
    setLoading(true);
    fetchPayoutsData();
    toast({
      title: "Recalculating payouts",
      description: "Payouts are being recalculated based on current data.",
    });
  };

  const exportReport = () => {
    const csv = [
      ['Worker', 'Job', 'Period', 'Days Worked', 'Total Days', 'Deliverables', 'Target', 'Base Pay', 'Commission', 'Total Payout', 'Status'],
      ...filteredPayouts.map(payout => {
        const workerName = 'worker' in payout ? payout.worker : payout.worker_name;
        const jobName = 'job' in payout ? payout.job : payout.job_name;
        const daysWorked = 'daysWorked' in payout ? payout.daysWorked : payout.days_worked;
        const totalDays = 'totalDays' in payout ? payout.totalDays : payout.total_days;
        const targetDeliverables = 'targetDeliverables' in payout ? payout.targetDeliverables : payout.target_deliverables;
        const basePay = 'basePay' in payout ? payout.basePay : payout.base_pay;
        const totalPayout = 'totalPayout' in payout ? payout.totalPayout : payout.total_payout;

        return [
          workerName,
          jobName,
          'period' in payout ? payout.period : 'Current Period',
          daysWorked,
          totalDays,
          payout.deliverables,
          targetDeliverables,
          basePay,
          payout.commission,
          totalPayout,
          payout.status
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Report exported",
      description: `Payouts report for ${filteredPayouts.length} records has been downloaded.`,
    });
  };

  const approvePayout = async (payoutId: string) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('payouts')
        .update({ status: 'approved' })
        .eq('id', payoutId);

      if (error) throw error;

      // Update local state
      setPayoutsData(prev => prev.map(payout => 
        payout.id === payoutId 
          ? { ...payout, status: 'approved' }
          : payout
      ));

      toast({
        title: "Payout approved",
        description: "The payout has been successfully approved and saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve payout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const viewDetails = (payout: any) => {
    setSelectedPayout(payout);
    setDetailsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-primary text-primary-foreground">Approved</Badge>;
      case 'processed':
        return <Badge className="bg-success text-success-foreground">Processed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const actualPayouts = payoutsData.length > 0 ? payoutsData : payouts;
  const totalPending = actualPayouts.filter(p => p.status === 'pending').reduce((sum, p) => {
    const total = 'totalPayout' in p ? p.totalPayout : p.total_payout;
    return sum + Number(total);
  }, 0);
  const totalProcessed = actualPayouts.filter(p => p.status === 'processed').reduce((sum, p) => {
    const total = 'totalPayout' in p ? p.totalPayout : p.total_payout;
    return sum + Number(total);
  }, 0);
  const averagePayout = actualPayouts.length > 0 ? actualPayouts.reduce((sum, p) => {
    const total = 'totalPayout' in p ? p.totalPayout : p.total_payout;
    return sum + Number(total);
  }, 0) / actualPayouts.length : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Payouts Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={recalculatePayouts} className="w-full sm:w-auto">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Payouts
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-glow w-full sm:w-auto" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payouts</p>
                <p className="text-2xl font-bold text-warning">KShs {totalPending.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processed This Period</p>
                <p className="text-2xl font-bold text-success">KShs {totalProcessed.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Average Payout</p>
              <p className="text-2xl font-bold text-primary">
                KShs {Math.round(averagePayout).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Payout Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Base Pay</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">Loading payouts...</TableCell>
                </TableRow>
              ) : filteredPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No payouts found</TableCell>
                </TableRow>
              ) : (
                filteredPayouts.map((payout) => {
                  const workerName = 'worker' in payout ? payout.worker : payout.worker_name;
                  const jobName = 'job' in payout ? payout.job : payout.job_name;
                  const daysWorked = 'daysWorked' in payout ? payout.daysWorked : payout.days_worked;
                  const totalDays = 'totalDays' in payout ? payout.totalDays : payout.total_days;
                  const targetDeliverables = 'targetDeliverables' in payout ? payout.targetDeliverables : payout.target_deliverables;
                  const basePay = 'basePay' in payout ? payout.basePay : payout.base_pay;
                  const totalPayout = 'totalPayout' in payout ? payout.totalPayout : payout.total_payout;
                  const paymentType = 'paymentType' in payout ? payout.paymentType : payout.payment_type;
                  
                  return (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">{workerName}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{jobName}</p>
                          <p className="text-xs text-muted-foreground">{paymentType}</p>
                        </div>
                      </TableCell>
                      <TableCell>{'period' in payout ? payout.period : 'Current Period'}</TableCell>
                      <TableCell>
                        {`${daysWorked}/${totalDays}`} days
                      </TableCell>
                      <TableCell>
                        {paymentType === 'team_commission' ? (
                          <div className="text-center">
                            <span className="text-sm text-muted-foreground">Team Pool</span>
                            <p className="text-xs text-primary">Based on days worked</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{`${payout.deliverables}/${targetDeliverables}`}</span>
                              <span>{Math.round((payout.deliverables / targetDeliverables) * 100)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1">
                              <div 
                                className={`h-1 rounded-full ${
                                  ((payout.deliverables / targetDeliverables) >= 1) ? 'bg-success' :
                                  ((payout.deliverables / targetDeliverables) >= 0.8) ? 'bg-warning' : 'bg-destructive'
                                }`}
                                style={{ width: `${Math.min(100, (payout.deliverables / targetDeliverables) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>KShs {basePay}</TableCell>
                      <TableCell>KShs {payout.commission}</TableCell>
                      <TableCell className="font-bold">KShs {totalPayout}</TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => viewDetails(payout)}>
                            Details
                          </Button>
                          {payout.status === 'pending' && (
                            <Button size="sm" className="bg-primary" onClick={() => approvePayout(payout.id.toString())}>
                              Approve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PayoutDetailsDialog
        payout={selectedPayout}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </div>
  );
}