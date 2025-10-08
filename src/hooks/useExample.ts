import { useQuery } from '@tanstack/react-query';

interface ExampleData {
  id: number;
  title: string;
  completed: boolean;
}

/**
 * Example custom hook using Tanstack Query
 * Demonstrates best practices for data fetching
 */
export function useExample() {
  return useQuery({
    queryKey: ['example'],
    queryFn: async (): Promise<ExampleData> => {
      const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
  });
}
