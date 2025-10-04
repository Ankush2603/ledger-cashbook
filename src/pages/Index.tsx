import { useState, useEffect } from "react";
import { TransactionForm, Transaction } from "@/components/TransactionForm";
import { SummaryCards } from "@/components/SummaryCards";
import { TransactionList } from "@/components/TransactionList";
import { BookManager, Book } from "@/components/BookManager";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { BookOpen, LogOut, User, Cloud } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const { user, logout } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load data from backend on mount
  useEffect(() => {
    loadDataFromBackend();
  }, []);

  // Load data from backend
  const loadDataFromBackend = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getLedgerData();
      
      if (response.success && response.data) {
        const { books: backendBooks, transactions: backendTransactions, selectedBookId: backendSelectedBookId } = response.data;
        
        setBooks(backendBooks || []);
        setTransactions(backendTransactions || []);
        
        if (backendSelectedBookId && backendBooks?.some((b: Book) => b.id === backendSelectedBookId)) {
          setSelectedBookId(backendSelectedBookId);
        } else if (backendBooks?.length > 0) {
          setSelectedBookId(backendBooks[0].id);
        }
        
        toast.success("Data loaded from cloud");
      } else {
        // No data in backend, create default book
        const defaultBook: Book = {
          id: crypto.randomUUID(),
          name: "Main Book",
          createdAt: new Date().toISOString(),
        };
        setBooks([defaultBook]);
        setSelectedBookId(defaultBook.id);
        
        // Save default book to backend
        await saveDataToBackend([defaultBook], [], defaultBook.id);
        toast.success("Created your first book");
      }
    } catch (error) {
      console.error("Error loading data from backend:", error);
      toast.error("Failed to load data from cloud");
      
      // Fall back to localStorage
      loadDataFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback to localStorage if backend fails
  const loadDataFromLocalStorage = () => {
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
  };

  // Save data to backend
  const saveDataToBackend = async (booksData: Book[], transactionsData: Transaction[], selectedId: string) => {
    setIsSyncing(true);
    try {
      await apiService.saveLedgerData({
        books: booksData,
        transactions: transactionsData,
        selectedBookId: selectedId
      });
      
      // Also save to localStorage as backup
      localStorage.setItem("ledger-books", JSON.stringify(booksData));
      localStorage.setItem("ledger-transactions", JSON.stringify(transactionsData));
      localStorage.setItem("ledger-selected-book", selectedId);
      
    } catch (error) {
      console.error("Error saving to backend:", error);
      toast.error("Failed to sync to cloud");
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-save to backend when data changes
  useEffect(() => {
    if (!isLoading && books.length > 0) {
      const timeoutId = setTimeout(() => {
        saveDataToBackend(books, transactions, selectedBookId);
      }, 1000); // Debounce saves by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [books, transactions, selectedBookId, isLoading]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your ledger data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Ledger Cashbook</h1>
                <p className="text-sm text-muted-foreground">Track your financial transactions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Welcome, {user?.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {isSyncing ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cloud className="h-4 w-4 animate-pulse" />
                    <span>Syncing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Cloud className="h-4 w-4" />
                    <span>Synced</span>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <BookManager
            books={books}
            selectedBookId={selectedBookId}
            onSelectBook={setSelectedBookId}
            onCreateBook={handleCreateBook}
            onDeleteBook={handleDeleteBook}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveDataToBackend(books, transactions, selectedBookId)}
            disabled={isSyncing}
            className="flex items-center gap-2"
          >
            <Cloud className={`h-4 w-4 ${isSyncing ? 'animate-pulse' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

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
