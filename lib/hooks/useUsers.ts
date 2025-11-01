import { useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/types/chat';

interface UseUsersOptions {
  role?: string;
  status?: string;
}

interface UseUsersReturn {
  users: User[];
  isLoading: boolean;
  error: string | null;
  loadUsers: () => Promise<void>;
  searchUsers: (query: string) => User[];
}

export function useUsers({ role, status }: UseUsersOptions = {}): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (status) params.append('status', status);
      params.append('pageSize', '100');

      const response = await fetch(`/api/chat/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [role, status]);

  const searchUsers = useCallback((query: string): User[] => {
    if (!query.trim()) return users;

    const lowercaseQuery = query.toLowerCase();
    return users.filter(user =>
      user.name?.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery)
    );
  }, [users]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    isLoading,
    error,
    loadUsers,
    searchUsers,
  };
}
