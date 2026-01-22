'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Problem, Category } from '@/lib/database.types';

// Extended problem type with category info
export interface ProblemWithCategory extends Problem {
  categoryId: string;
  categoryName: string;
}

// Category with problems for the sidebar
export interface CategoryWithProblems {
  id: string;
  name: string;
  icon: string;
  order_index: number;
  created_by: string | null;
  problems: Problem[];
}

interface ProgressContextType {
  // Data from Supabase
  categories: CategoryWithProblems[];
  isLoadingData: boolean;
  
  // Progress tracking
  completedProblems: Set<string>;
  markComplete: (problemId: string) => void;
  markIncomplete: (problemId: string) => void;
  isCompleted: (problemId: string) => boolean;
  getCompletedCount: () => number;
  
  // Current selection
  selectedProblem: ProblemWithCategory | null;
  setSelectedProblem: (problem: ProblemWithCategory | null) => void;
  
  // Mode
  mode: 'roadmap' | 'interview';
  setMode: (mode: 'roadmap' | 'interview') => void;
  
  // Roadmap info
  activeRoadmapId: string | null;
  
  // Refresh data
  refreshData: () => Promise<void>;
  
  // Delete functions
  deleteCategory: (categoryId: string) => Promise<void>;
  deleteProblem: (problemId: string) => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Data state
  const [categories, setCategories] = useState<CategoryWithProblems[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  
  // Progress state
  const [completedProblems, setCompletedProblems] = useState<Set<string>>(new Set());
  
  // Selection state
  const [selectedProblem, setSelectedProblem] = useState<ProblemWithCategory | null>(null);
  const [mode, setMode] = useState<'roadmap' | 'interview'>('roadmap');

  // Fetch categories and problems from Supabase
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('order_index');
      
      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      // Fetch problems (default ones + user's custom ones)
      const { data: problemsData, error: problemsError } = await supabase
        .from('problems')
        .select('*')
        .order('order_index');
      
      if (problemsError) {
        console.error('Error fetching problems:', problemsError);
        return;
      }

      // Group problems by category
      const cats = categoriesData as Category[] || [];
      const probs = problemsData as Problem[] || [];
      
      const categoriesWithProblems: CategoryWithProblems[] = cats.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '',
        order_index: cat.order_index,
        created_by: (cat as any).created_by || null,
        problems: probs.filter((p) => p.category_id === cat.id),
      }));

      setCategories(categoriesWithProblems);

      // If user is logged in, fetch their active roadmap and progress
      if (user) {
        // Get active roadmap
        const { data: roadmapData } = await supabase
          .from('roadmaps')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        const roadmap = roadmapData as { id: string } | null;
        if (roadmap) {
          setActiveRoadmapId(roadmap.id);

          // Fetch user's progress
          const { data: progressData } = await supabase
            .from('user_progress')
            .select('problem_id')
            .eq('user_id', user.id)
            .eq('roadmap_id', roadmap.id);

          const progress = progressData as { problem_id: string }[] | null;
          if (progress) {
            setCompletedProblems(new Set(progress.map((p) => p.problem_id)));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  // Refresh data function
  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Fetch data on mount and when user changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Mark problem as complete
  const markComplete = useCallback(async (problemId: string) => {
    // Update local state immediately
    setCompletedProblems((prev) => new Set([...prev, problemId]));

    // If user is logged in, save to database
    if (user && activeRoadmapId) {
      const { error } = await supabase.from('user_progress').insert({
        user_id: user.id,
        roadmap_id: activeRoadmapId,
        problem_id: problemId,
        status: 'completed',
      });

      if (error) {
        console.error('Error saving progress:', error);
        // Revert on error
        setCompletedProblems((prev) => {
          const next = new Set(prev);
          next.delete(problemId);
          return next;
        });
      }
    }
  }, [user, activeRoadmapId]);

  // Mark problem as incomplete
  const markIncomplete = useCallback(async (problemId: string) => {
    // Update local state immediately
    setCompletedProblems((prev) => {
      const next = new Set(prev);
      next.delete(problemId);
      return next;
    });

    // If user is logged in, remove from database
    if (user && activeRoadmapId) {
      const { error } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('roadmap_id', activeRoadmapId)
        .eq('problem_id', problemId);

      if (error) {
        console.error('Error removing progress:', error);
        // Revert on error
        setCompletedProblems((prev) => new Set([...prev, problemId]));
      }
    }
  }, [user, activeRoadmapId]);

  const isCompleted = useCallback((problemId: string) => {
    return completedProblems.has(problemId);
  }, [completedProblems]);

  const getCompletedCount = useCallback(() => {
    return completedProblems.size;
  }, [completedProblems]);

  // Delete category
  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('created_by', user.id);

    if (error) {
      console.error('Error deleting category:', error);
      throw error;
    }

    // Refresh data
    await refreshData();
  }, [user, refreshData]);

  // Delete problem
  const deleteProblem = useCallback(async (problemId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('problems')
      .delete()
      .eq('id', problemId)
      .eq('created_by', user.id);

    if (error) {
      console.error('Error deleting problem:', error);
      throw error;
    }

    // Refresh data
    await refreshData();
  }, [user, refreshData]);

  // Get total problems count
  const getTotalProblems = useCallback(() => {
    return categories.reduce((acc, cat) => acc + cat.problems.length, 0);
  }, [categories]);

  return (
    <ProgressContext.Provider
      value={{
        categories,
        isLoadingData,
        completedProblems,
        markComplete,
        markIncomplete,
        isCompleted,
        getCompletedCount,
        selectedProblem,
        setSelectedProblem,
        mode,
        setMode,
        activeRoadmapId,
        refreshData,
        deleteCategory,
        deleteProblem,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}

// Helper to get total problems from categories
export function getTotalProblemsFromCategories(categories: CategoryWithProblems[]): number {
  return categories.reduce((acc, cat) => acc + cat.problems.length, 0);
}
