import { useState } from "react";
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

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = payout.worker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.job.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payout.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <Button variant="outline">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Payouts
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-glow">
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
              {filteredPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-medium">{payout.worker}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payout.job}</p>
                      <p className="text-xs text-muted-foreground">{payout.paymentType}</p>
                    </div>
                  </TableCell>
                  <TableCell>{payout.period}</TableCell>
                  <TableCell>
                    {payout.daysWorked}/{payout.totalDays} days
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{payout.deliverables}/{payout.targetDeliverables}</span>
                        <span>{Math.round((payout.deliverables / payout.targetDeliverables) * 100)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full ${
                            (payout.deliverables / payout.targetDeliverables) >= 1 ? 'bg-success' :
                            (payout.deliverables / payout.targetDeliverables) >= 0.8 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${Math.min(100, (payout.deliverables / payout.targetDeliverables) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>${payout.basePay}</TableCell>
                  <TableCell>${payout.commission}</TableCell>
                  <TableCell className="font-bold">${payout.totalPayout}</TableCell>
                  <TableCell>{getStatusBadge(payout.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                      {payout.status === 'pending' && (
                        <Button size="sm" className="bg-primary">
                          Approve
                        </Button>
                      )}
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