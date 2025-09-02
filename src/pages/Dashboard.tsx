import { useEffect, useState } from "react";
import { 
  Users, 
  Briefcase, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Calendar,
  AlertTriangle,
  Plus,
  CheckCircle
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
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useTasks, Task } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";

interface ActivityLog {
  id: string;
  action: string;
  entity_name: string;
  created_at: string;
}

interface DashboardStats {
  activeWorkers: number;
  activeJobs: number;
  attendanceRate: string;
  pendingPayouts: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tasks, loading: tasksLoading, markTaskCompleted, getUpcomingTasks } = useTasks();
  const [stats, setStats] = useState<DashboardStats>({
    activeWorkers: 0,
    activeJobs: 0,
    attendanceRate: "0%",
    pendingPayouts: "$0"
  });
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const upcomingTasks = getUpcomingTasks();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [workersResult, jobsResult, activityResult, attendanceResult] = await Promise.all([
        supabase.from('workers').select('*', { count: 'exact' }).eq('status', 'active'),
        supabase.from('jobs').select('*', { count: 'exact' }).eq('status', 'active'),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(4),
        supabase.from('attendance').select('status', { count: 'exact' }).gte('attendance_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ]);

      // Calculate actual attendance rate
      const { data: presentCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact' })
        .eq('status', 'present')
        .gte('attendance_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      const totalAttendance = attendanceResult.count || 0;
      const presentAttendance = (presentCount as any)?.count || 0;
      const attendanceRate = totalAttendance > 0 ? `${Math.round((presentAttendance / totalAttendance) * 100)}%` : "0%";

      // Calculate actual pending payouts
      const { data: pendingPayoutsData } = await supabase
        .from('payouts')
        .select('total_payout')
        .eq('status', 'pending');
      
      const totalPendingAmount = pendingPayoutsData?.reduce((sum, payout) => sum + Number(payout.total_payout), 0) || 0;
      const pendingPayouts = `$${totalPendingAmount.toLocaleString()}`;

      setStats({
        activeWorkers: workersResult.count || 0,
        activeJobs: jobsResult.count || 0,
        attendanceRate,
        pendingPayouts
      });

      if (activityResult.data) {
        console.log('Activity logs fetched:', activityResult.data);
        setRecentActivity(activityResult.data);
      } else {
        console.log('No activity logs found');
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = (task: Task) => {
    markTaskCompleted(task.id);
    toast({
      title: "Task completed",
      description: `"${task.title}" has been marked as completed.`,
    });
  };

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
          value={loading ? "..." : stats.activeWorkers}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 12, isPositive: true }}
          description="8 new this week"
        />
        <StatsCard
          title="Active Jobs"
          value={loading ? "..." : stats.activeJobs}
          icon={<Briefcase className="h-4 w-4" />}
          trend={{ value: 5, isPositive: true }}
          description="3 ending this week"
        />
        <StatsCard
          title="Attendance Rate"
          value={loading ? "..." : stats.attendanceRate}
          icon={<Clock className="h-4 w-4" />}
          trend={{ value: 2.1, isPositive: true }}
          description="This week average"
        />
        <StatsCard
          title="Pending Payouts"
          value={loading ? "..." : stats.pendingPayouts}
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
                      {activity.entity_name}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
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
              {tasksLoading ? (
                <p className="text-center text-muted-foreground">Loading tasks...</p>
              ) : upcomingTasks.length === 0 ? (
                <p className="text-center text-muted-foreground">No upcoming tasks</p>
              ) : (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-4 w-4 ${
                        task.priority === 'high' ? 'text-destructive' : 
                        task.priority === 'medium' ? 'text-warning' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        task.priority === 'high' ? 'destructive' : 
                        task.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {task.priority}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleTaskComplete(task)}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}