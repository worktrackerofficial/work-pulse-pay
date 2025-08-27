import { 
  Users, 
  Briefcase, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Calendar,
  AlertTriangle,
  Plus
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data
const recentActivity = [
  { id: 1, action: "New job created", job: "Warehouse Team Alpha", time: "2 hours ago" },
  { id: 2, action: "Attendance recorded", worker: "John Smith", time: "3 hours ago" },
  { id: 3, action: "Payout processed", amount: "$2,340", time: "5 hours ago" },
  { id: 4, action: "Worker added", worker: "Sarah Johnson", time: "1 day ago" },
];

const upcomingTasks = [
  { id: 1, task: "Process weekly payouts", due: "Tomorrow", priority: "high" },
  { id: 2, task: "Update deliverable targets", due: "2 days", priority: "medium" },
  { id: 3, task: "Review attendance reports", due: "3 days", priority: "low" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary-glow">
              <Plus className="mr-2 h-4 w-4" />
              Quick Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/jobs')}>
              <Briefcase className="mr-2 h-4 w-4" />
              Create New Job
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/workers')}>
              <Users className="mr-2 h-4 w-4" />
              Add New Worker
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/attendance')}>
              <Clock className="mr-2 h-4 w-4" />
              Record Attendance
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Workers"
          value={156}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 12, isPositive: true }}
          description="8 new this week"
        />
        <StatsCard
          title="Active Jobs"
          value={23}
          icon={<Briefcase className="h-4 w-4" />}
          trend={{ value: 5, isPositive: true }}
          description="3 ending this week"
        />
        <StatsCard
          title="Attendance Rate"
          value="94.2%"
          icon={<Clock className="h-4 w-4" />}
          trend={{ value: 2.1, isPositive: true }}
          description="This week average"
        />
        <StatsCard
          title="Pending Payouts"
          value="$18,450"
          icon={<DollarSign className="h-4 w-4" />}
          description="Due this week"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.job || activity.worker || activity.amount}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-4 w-4 ${
                      task.priority === 'high' ? 'text-destructive' : 
                      task.priority === 'medium' ? 'text-warning' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{task.task}</p>
                      <p className="text-xs text-muted-foreground">Due in {task.due}</p>
                    </div>
                  </div>
                  <Badge variant={
                    task.priority === 'high' ? 'destructive' : 
                    task.priority === 'medium' ? 'default' : 'secondary'
                  }>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}