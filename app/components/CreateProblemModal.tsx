'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { supabase } from '@/lib/supabase';

interface CreateProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
}

export default function CreateProblemModal({
  isOpen,
  onClose,
  defaultCategoryId,
}: CreateProblemModalProps) {
  const { user } = useAuth();
  const { categories, refreshData } = useProgress();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId || '');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [leetcodeNumber, setLeetcodeNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultCategoryId) {
      setCategoryId(defaultCategoryId);
    }
  }, [defaultCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Problem title is required');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    if (!user) {
      setError('You must be logged in to create problems');
      return;
    }

    setIsLoading(true);

    try {
      // Get the max order_index for this category
      const { data: problems } = await supabase
        .from('problems')
        .select('order_index')
        .eq('category_id', categoryId)
        .order('order_index', { ascending: false })
        .limit(1);

      const maxOrder = problems && problems.length > 0 ? problems[0].order_index : -1;

      const { error: insertError } = await supabase.from('problems').insert({
        category_id: categoryId,
        created_by: user.id,
        title: title.trim(),
        difficulty,
        leetcode_number: leetcodeNumber ? parseInt(leetcodeNumber) : null,
        is_default: false,
        order_index: maxOrder + 1,
      });

      if (insertError) {
        throw insertError;
      }

      // Refresh the data
      await refreshData();
      setTitle('');
      setCategoryId(defaultCategoryId || '');
      setDifficulty('Easy');
      setLeetcodeNumber('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create problem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Problem</DialogTitle>
          <DialogDescription>
            Add a custom problem to your roadmap.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Problem Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Two Sum"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as 'Easy' | 'Medium' | 'Hard')}
                required
              >
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leetcodeNumber">LeetCode Number (Optional)</Label>
              <Input
                id="leetcodeNumber"
                type="number"
                value={leetcodeNumber}
                onChange={(e) => setLeetcodeNumber(e.target.value)}
                placeholder="e.g., 1"
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Add Problem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
