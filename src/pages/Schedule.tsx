import { Calendar, Plus, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data
const schedules = [
  {
    id: 1,
    job: "Warehouse Team Alpha",
    startDate: "2024-01-15",
    endDate: "2024-03-15",
    workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workers: ["John Smith", "Emily Davis", "Mark Wilson"],
    shiftTime: "08:00 - 17:00",
    status: "active"
  },
  {
    id: 2,
    job: "Delivery Squad Beta", 
    startDate: "2024-02-01",
    endDate: "2024-04-30",
    workDays: ["Monday", "Wednesday", "Friday", "Saturday"],
    workers: ["Sarah Johnson", "Tom Garcia"],
    shiftTime: "09:00 - 18:00",
    status: "active"
  },
  {
    id: 3,
    job: "Customer Support Team",
    startDate: "2024-01-01", 
    endDate: "2024-12-31",
    workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workers: ["Mike Chen", "Lisa Park", "David Brown"],
    shiftTime: "10:00 - 19:00",
    status: "active"
  }
];

export default function Schedule() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Schedule Management</h1>
        <Button className="bg-gradient-to-r from-primary to-primary-glow">
          <Plus className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </div>

      {/* Schedule Cards */}
      <div className="grid gap-6">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{schedule.job}</CardTitle>
                <Badge className="bg-success text-success-foreground">
                  {schedule.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {new Date(schedule.startDate).toLocaleDateString()} - {new Date(schedule.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Shift Hours</p>
                    <p className="font-medium">{schedule.shiftTime}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned Workers</p>
                    <p className="font-medium">{schedule.workers.length} workers</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Work Days</p>
                  <p className="font-medium">{schedule.workDays.length} days/week</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Work Days:</p>
                <div className="flex flex-wrap gap-2">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <Badge 
                      key={day}
                      variant={schedule.workDays.includes(day) ? "default" : "outline"}
                      className={schedule.workDays.includes(day) ? "bg-primary text-primary-foreground" : ""}
                    >
                      {day.slice(0, 3)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Assigned Workers:</p>
                <div className="flex flex-wrap gap-2">
                  {schedule.workers.map((worker, index) => (
                    <Badge key={index} variant="outline">
                      {worker}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm">
                  Edit Schedule
                </Button>
                <Button variant="outline" size="sm">
                  Manage Workers
                </Button>
                <Button variant="outline" size="sm">
                  View Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}