import { useSupabaseClient } from '@/lib/supabase';
import type { Instrument, InstrumentInsert } from '@/types/database';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch all instruments from Supabase
 */
export function useInstruments() {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['instruments'],
    queryFn: async (): Promise<Instrument[]> => {
      const { data, error } = await supabase.from('instruments').select('*').order('name');

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
}

/**
 * Hook to fetch a single instrument by ID
 */
export function useInstrument(id: number) {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['instruments', id],
    queryFn: async (): Promise<Instrument> => {
      const { data, error } = await supabase.from('instruments').select('*').eq('id', id).single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new instrument
 */
export function useCreateInstrument() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instrument: InstrumentInsert): Promise<Instrument> => {
      const { data, error } = await supabase
        .from('instruments')
        .insert(instrument)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch instruments list
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
    },
  });
}

/**
 * Hook to delete an instrument
 */
export function useDeleteInstrument() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const { error } = await supabase.from('instruments').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch instruments list
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
    },
  });
}
