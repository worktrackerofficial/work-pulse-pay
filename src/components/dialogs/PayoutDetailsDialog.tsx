import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Calendar, Target, Clock } from "lucide-react";

interface PayoutDetailsDialogProps {
  payout: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayoutDetailsDialog({ payout, open, onOpenChange }: PayoutDetailsDialogProps) {
  if (!payout) return null;

  const workerName = 'worker' in payout ? payout.worker : payout.worker_name;
  const jobName = 'job' in payout ? payout.job : payout.job_name;
  const daysWorked = 'daysWorked' in payout ? payout.daysWorked : payout.days_worked;
  const totalDays = 'totalDays' in payout ? payout.totalDays : payout.total_days;
  const targetDeliverables = 'targetDeliverables' in payout ? payout.targetDeliverables : payout.target_deliverables;
  const basePay = 'basePay' in payout ? payout.basePay : payout.base_pay;
  const totalPayout = 'totalPayout' in payout ? payout.totalPayout : payout.total_payout;
  const paymentType = 'paymentType' in payout ? payout.paymentType : payout.payment_type;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Payout Details
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown for {workerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">WORKER</h4>
              <p className="font-medium">{workerName}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">JOB</h4>
              <p className="font-medium">{jobName}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">PAYMENT TYPE</h4>
              <p className="font-medium">{paymentType}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">STATUS</h4>
              {getStatusBadge(payout.status)}
            </div>
          </div>

          <Separator />

          {/* Attendance Details */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Attendance Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-2xl font-bold text-primary">{daysWorked}</p>
                <p className="text-sm text-muted-foreground">Days Worked</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-2xl font-bold">{totalDays}</p>
                <p className="text-sm text-muted-foreground">Total Work Days</p>
              </div>
            </div>
          </div>

          {/* Performance Details */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Performance Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-2xl font-bold text-success">{payout.deliverables}</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-2xl font-bold">{targetDeliverables}</p>
                <p className="text-sm text-muted-foreground">Target</p>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Performance Rate</span>
                <span className="text-sm font-bold">
                  {Math.round((payout.deliverables / targetDeliverables) * 100)}%
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (payout.deliverables / targetDeliverables) >= 1 ? 'bg-success' :
                    (payout.deliverables / targetDeliverables) >= 0.8 ? 'bg-warning' : 'bg-destructive'
                  }`}
                  style={{ width: `${Math.min(100, (payout.deliverables / targetDeliverables) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Payment Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>Base Pay</span>
                <span className="font-bold">${basePay}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>Commission</span>
                <span className="font-bold">${payout.commission}</span>
              </div>
              {'bonus' in payout && payout.bonus > 0 && (
                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                  <span>Bonus</span>
                  <span className="font-bold text-success">+${payout.bonus}</span>
                </div>
              )}
              {'deductions' in payout && payout.deductions > 0 && (
                <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                  <span>Deductions</span>
                  <span className="font-bold text-destructive">-${payout.deductions}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                <span className="font-semibold text-lg">Total Payout</span>
                <span className="font-bold text-2xl text-primary">${totalPayout}</span>
              </div>
            </div>
          </div>

          {'period' in payout && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-semibold">Period</span>
              </div>
              <p className="text-muted-foreground">{payout.period}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}