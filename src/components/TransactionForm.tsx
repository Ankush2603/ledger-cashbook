import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  bookId: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
}

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, "id" | "bookId">) => void;
}

export const TransactionForm = ({ onAddTransaction }: TransactionFormProps) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("income");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      return;
    }

    onAddTransaction({
      date,
      description: description.trim(),
      amount: parseFloat(amount),
      type,
    });

    // Reset form
    setDescription("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value: TransactionType) => setType(value)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            type="text"
            placeholder="Enter transaction description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </form>
    </Card>
  );
};
