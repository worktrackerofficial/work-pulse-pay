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

// Mock data
const payoutReports = [
  {
    worker: "John Smith",
    job: "Warehouse Team Alpha",
    period: "Week 1-2 Jan",
    daysWorked: 10,
    totalDays: 10,
    deliverables: 1450,
    basePay: 800,
    commission: 290,
    totalPayout: 1090,
    status: "processed"
  },
  {
    worker: "Sarah Johnson",
    job: "Delivery Squad Beta",
    period: "Week 1-2 Jan",
    daysWorked: 9,
    totalDays: 10,
    deliverables: 520,
    basePay: 720,
    commission: 260,
    totalPayout: 980,
    status: "pending"
  },
  {
    worker: "Mike Chen",
    job: "Customer Support Team",
    period: "Week 1-2 Jan",
    daysWorked: 10,
    totalDays: 10,
    deliverables: 280,
    basePay: 1000,
    commission: 140,
    totalPayout: 1140,
    status: "processed"
  }
];

export default function Reports() {
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
            <Select defaultValue="all-jobs">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-jobs">All Jobs</SelectItem>
                <SelectItem value="warehouse">Warehouse Team Alpha</SelectItem>
                <SelectItem value="delivery">Delivery Squad Beta</SelectItem>
                <SelectItem value="support">Customer Support Team</SelectItem>
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
                <p className="text-2xl font-bold text-foreground">$3,210</p>
                <p className="text-xs text-success">+12% from last period</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Attendance</p>
              <p className="text-2xl font-bold text-foreground">93.3%</p>
              <p className="text-xs text-success">+2.1% from last period</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Deliverables Met</p>
              <p className="text-2xl font-bold text-foreground">2,250</p>
              <p className="text-xs text-success">+5.8% from last period</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Efficiency Rate</p>
              <p className="text-2xl font-bold text-foreground">96.8%</p>
              <p className="text-xs text-success">+1.2% from last period</p>
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
              {payoutReports.map((report, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{report.worker}</TableCell>
                  <TableCell>{report.job}</TableCell>
                  <TableCell>{report.period}</TableCell>
                  <TableCell>
                    {report.daysWorked}/{report.totalDays}
                  </TableCell>
                  <TableCell>{report.deliverables}</TableCell>
                  <TableCell>${report.basePay}</TableCell>
                  <TableCell>${report.commission}</TableCell>
                  <TableCell className="font-medium">${report.totalPayout}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}