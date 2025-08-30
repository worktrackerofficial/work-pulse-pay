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

  useEffect(() => {
    fetchPayoutsData();
  }, []);

  const fetchPayoutsData = async () => {
    try {
      // Fetch attendance data to calculate payouts
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          worker_id,
          attendance_date,
          status,
          workers (name),
          jobs (
            name,
            pay_structure,
            flat_rate,
            commission_per_item,
            hourly_rate,
            target_deliverable
          )
        `);

      if (attendanceError) throw attendanceError;

      // Fetch deliverables data
      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('deliverables')
        .select(`
          worker_id,
          quantity,
          deliverable_date,
          workers (name),
          jobs (name)
        `);

      if (deliverablesError) throw deliverablesError;

      // Calculate actual payouts
      const calculatedPayouts = calculatePayouts(attendanceData || [], deliverablesData || []);
      setPayoutsData(calculatedPayouts);
      
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePayouts = (attendance: any[], deliverables: any[]): PayoutData[] => {
    const workerMap = new Map();
    
    // Process attendance data
    attendance.forEach(record => {
      const key = record.worker_id;
      if (!workerMap.has(key)) {
        workerMap.set(key, {
          id: key,
          worker_name: record.workers?.name || 'Unknown',
          job_name: record.jobs?.name || 'Unknown',
          days_worked: 0,
          total_days: 0,
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
      worker.total_days++;
      if (record.status === 'present') {
        worker.days_worked++;
      }
    });

    // Process deliverables data
    deliverables.forEach(record => {
      const key = record.worker_id;
      if (workerMap.has(key)) {
        const worker = workerMap.get(key);
        worker.deliverables += record.quantity;
      }
    });

    // Calculate payouts
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
      
      worker.base_pay = basePay;
      worker.commission = commission;
      worker.total_payout = basePay + commission;
      
      return worker;
    });
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
    fetchPayoutsData();
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
  };

  const approvePayout = async (payoutId: string) => {
    // In a real app, you'd update the payout status in the database
    // For now, just update the local state
    setPayoutsData(prev => prev.map(payout => 
      payout.id === payoutId 
        ? { ...payout, status: 'approved' }
        : payout
    ));
  };

  const viewDetails = (payout: any) => {
    // In a real app, this would open a detailed view
    alert(`Detailed view for ${payout.worker_name || payout.worker}`);
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

  const totalPending = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.totalPayout, 0);
  const totalProcessed = payouts.filter(p => p.status === 'processed').reduce((sum, p) => sum + p.totalPayout, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Payouts Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={recalculatePayouts}>
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Payouts
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-glow" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payouts</p>
                <p className="text-2xl font-bold text-warning">${totalPending.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-success">${totalProcessed.toLocaleString()}</p>
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
                ${Math.round(payouts.reduce((sum, p) => sum + p.totalPayout, 0) / payouts.length).toLocaleString()}
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
                        {daysWorked}/{totalDays} days
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{payout.deliverables}/{targetDeliverables}</span>
                            <span>{Math.round((payout.deliverables / targetDeliverables) * 100)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full ${
                                (payout.deliverables / targetDeliverables) >= 1 ? 'bg-success' :
                                (payout.deliverables / targetDeliverables) >= 0.8 ? 'bg-warning' : 'bg-destructive'
                              }`}
                              style={{ width: `${Math.min(100, (payout.deliverables / targetDeliverables) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>${basePay}</TableCell>
                      <TableCell>${payout.commission}</TableCell>
                      <TableCell className="font-bold">${totalPayout}</TableCell>
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
    </div>
  );
}