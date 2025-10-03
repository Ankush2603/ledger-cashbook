import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "./TransactionForm";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  filter: "all" | "income" | "expense";
  onFilterChange: (filter: "all" | "income" | "expense") => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionList = ({ 
  transactions, 
  filter, 
  onFilterChange,
  onDeleteTransaction 
}: TransactionListProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "all") return true;
    return t.type === filter;
  });

  // Calculate running balance
  const transactionsWithBalance = filteredTransactions.map((transaction, index) => {
    const previousTransactions = filteredTransactions.slice(0, index + 1);
    const balance = previousTransactions.reduce((acc, t) => {
      return t.type === "income" ? acc + t.amount : acc - t.amount;
    }, 0);
    return { ...transaction, balance };
  });

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "income" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("income")}
          >
            Income
          </Button>
          <Button
            variant={filter === "expense" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("expense")}
          >
            Expenses
          </Button>
        </div>
      </div>

      {transactionsWithBalance.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No transactions yet. Add your first transaction above!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsWithBalance.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={transaction.type === "income" ? "default" : "destructive"}
                      className={
                        transaction.type === "income"
                          ? "bg-success hover:bg-success/90"
                          : ""
                      }
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      transaction.type === "income" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatCurrency(transaction.balance)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteTransaction(transaction.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive-light"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};
