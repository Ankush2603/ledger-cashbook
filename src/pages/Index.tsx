import { useState, useEffect } from "react";
import { TransactionForm, Transaction } from "@/components/TransactionForm";
import { SummaryCards } from "@/components/SummaryCards";
import { TransactionList } from "@/components/TransactionList";
import { BookManager, Book } from "@/components/BookManager";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  // Load books and transactions from localStorage on mount
  useEffect(() => {
    const storedBooks = localStorage.getItem("ledger-books");
    const storedSelectedBookId = localStorage.getItem("ledger-selected-book");
    const storedTransactions = localStorage.getItem("ledger-transactions");

    if (storedBooks) {
      try {
        const parsedBooks = JSON.parse(storedBooks);
        setBooks(parsedBooks);
        
        if (storedSelectedBookId && parsedBooks.some((b: Book) => b.id === storedSelectedBookId)) {
          setSelectedBookId(storedSelectedBookId);
        } else if (parsedBooks.length > 0) {
          setSelectedBookId(parsedBooks[0].id);
        }
      } catch (error) {
        console.error("Error loading books:", error);
      }
    } else {
      // Create default book if none exists
      const defaultBook: Book = {
        id: crypto.randomUUID(),
        name: "Main Book",
        createdAt: new Date().toISOString(),
      };
      setBooks([defaultBook]);
      setSelectedBookId(defaultBook.id);
    }

    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch (error) {
        console.error("Error loading transactions:", error);
      }
    }
  }, []);

  // Save books to localStorage whenever they change
  useEffect(() => {
    if (books.length > 0) {
      localStorage.setItem("ledger-books", JSON.stringify(books));
    }
  }, [books]);

  // Save selected book to localStorage whenever it changes
  useEffect(() => {
    if (selectedBookId) {
      localStorage.setItem("ledger-selected-book", selectedBookId);
    }
  }, [selectedBookId]);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("ledger-transactions", JSON.stringify(transactions));
  }, [transactions]);

  const handleCreateBook = (name: string) => {
    const newBook: Book = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };
    setBooks((prev) => [...prev, newBook]);
    setSelectedBookId(newBook.id);
    toast.success(`Book "${name}" created!`);
  };

  const handleDeleteBook = (bookId: string) => {
    if (books.length === 1) {
      toast.error("Cannot delete the last book");
      return;
    }

    const bookToDelete = books.find((b) => b.id === bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    setTransactions((prev) => prev.filter((t) => t.bookId !== bookId));
    
    if (selectedBookId === bookId) {
      const remainingBooks = books.filter((b) => b.id !== bookId);
      setSelectedBookId(remainingBooks[0].id);
    }
    
    toast.success(`Book "${bookToDelete?.name}" deleted`);
  };

  const handleAddTransaction = (transaction: Omit<Transaction, "id" | "bookId">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      bookId: selectedBookId,
    };
    
    setTransactions((prev) => [newTransaction, ...prev]);
    toast.success("Transaction added successfully!");
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    toast.success("Transaction deleted");
  };

  // Filter transactions for selected book
  const bookTransactions = transactions.filter((t) => t.bookId === selectedBookId);

  const totalIncome = bookTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = bookTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Ledger Cashbook</h1>
              <p className="text-sm text-muted-foreground">Track your financial transactions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <BookManager
          books={books}
          selectedBookId={selectedBookId}
          onSelectBook={setSelectedBookId}
          onCreateBook={handleCreateBook}
          onDeleteBook={handleDeleteBook}
        />

        <SummaryCards
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          balance={balance}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TransactionForm onAddTransaction={handleAddTransaction} />
          </div>

          <div className="lg:col-span-2">
            <TransactionList
              transactions={bookTransactions}
              filter={filter}
              onFilterChange={setFilter}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
