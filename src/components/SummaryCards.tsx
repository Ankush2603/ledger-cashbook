import { Card } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export const SummaryCards = ({ totalIncome, totalExpense, balance }: SummaryCardsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-6 bg-success-light border-success">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Income</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</p>
          </div>
          <ArrowUpCircle className="h-10 w-10 text-success" />
        </div>
      </Card>

      <Card className="p-6 bg-destructive-light border-destructive">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpense)}</p>
          </div>
          <ArrowDownCircle className="h-10 w-10 text-destructive" />
        </div>
      </Card>

      <Card className="p-6 bg-primary/5 border-primary">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(balance)}</p>
          </div>
          <Wallet className="h-10 w-10 text-primary" />
        </div>
      </Card>
    </div>
  );
};
