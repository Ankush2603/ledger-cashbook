import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export interface Book {
  id: string;
  name: string;
  createdAt: string;
}

interface BookManagerProps {
  books: Book[];
  selectedBookId: string;
  onSelectBook: (bookId: string) => void;
  onCreateBook: (name: string) => void;
  onDeleteBook: (bookId: string) => void;
}

export const BookManager = ({
  books,
  selectedBookId,
  onSelectBook,
  onCreateBook,
  onDeleteBook,
}: BookManagerProps) => {
  const [newBookName, setNewBookName] = useState("");
  const [isAddingBook, setIsAddingBook] = useState(false);

  const handleCreateBook = () => {
    if (!newBookName.trim()) {
      toast.error("Please enter a book name");
      return;
    }

    onCreateBook(newBookName.trim());
    setNewBookName("");
    setIsAddingBook(false);
  };

  const selectedBook = books.find((b) => b.id === selectedBookId);

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Current Book</h2>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedBookId} onValueChange={onSelectBook}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a book" />
            </SelectTrigger>
            <SelectContent>
              {books.map((book) => (
                <SelectItem key={book.id} value={book.id}>
                  {book.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {books.length > 1 && selectedBook && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Book</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{selectedBook.name}"? All transactions in this book will be permanently deleted. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteBook(selectedBookId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {isAddingBook ? (
          <div className="flex gap-2">
            <Input
              placeholder="Enter book name"
              value={newBookName}
              onChange={(e) => setNewBookName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateBook()}
              autoFocus
            />
            <Button onClick={handleCreateBook}>Add</Button>
            <Button variant="outline" onClick={() => {
              setIsAddingBook(false);
              setNewBookName("");
            }}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAddingBook(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Book
          </Button>
        )}
      </div>
    </Card>
  );
};
