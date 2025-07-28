import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StaffCredits, CreditTransaction } from '../types';

export function useCreditsData(spaceId?: string) {
  const [credits, setCredits] = useState<StaffCredits[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (spaceId) {
      loadCreditsData();
      console.log('Setting up credits real-time subscriptions for space:', spaceId);
    } else {
      setLoading(false);
      console.log('No spaceId, skipping credits real-time subscriptions');
    }
    
    // Set up real-time subscriptions
    if (!spaceId) {
      return;
    }

    const creditsChannel = supabase
      .channel(`credits_changes_${spaceId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'staff_credits',
          filter: `space_id=eq.${spaceId}`
        },
        (payload) => {
          console.log('Credits change detected:', payload);
          // Add a small delay to ensure database consistency
          setTimeout(() => {
            loadCreditsData();
          }, 100);
        }
      )
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'credit_transactions',
          filter: `space_id=eq.${spaceId}`
        },
        (payload) => {
          console.log('Transaction change detected:', payload);
          // Add a small delay to ensure database consistency
          setTimeout(() => {
            loadCreditsData();
          }, 100);
        }
      )
      .subscribe();

    // Log subscription status
    creditsChannel.subscribe((status) => {
      console.log('Credits channel subscription status:', status);
    });
    return () => {
      console.log('Cleaning up credits real-time subscriptions for space:', spaceId);
      supabase.removeChannel(creditsChannel);
    };
  }, [spaceId]);

  const loadCreditsData = async () => {
    if (!spaceId) return;

    try {
      setError(null);
      
      // Load credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('staff_credits')
        .select('*')
        .eq('space_id', spaceId)
        .order('credits', { ascending: false });

      if (creditsError) throw creditsError;

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Convert data
      const convertedCredits: StaffCredits[] = (creditsData || []).map(credit => ({
        id: credit.id,
        staffId: credit.staff_id,
        credits: credit.credits,
        createdAt: credit.created_at,
        updatedAt: credit.updated_at,
      }));

      const convertedTransactions: CreditTransaction[] = (transactionsData || []).map(transaction => ({
        id: transaction.id,
        staffId: transaction.staff_id,
        streamId: transaction.stream_id,
        amount: transaction.amount,
        reason: transaction.reason,
        createdAt: transaction.created_at,
      }));

      setCredits(convertedCredits);
      setTransactions(convertedTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credits data');
    } finally {
      setLoading(false);
    }
  };

  const awardStreamCredits = async (streamId: string, casterIds: string[]) => {
    try {
      // Award 5 credits to each caster
      for (const casterId of casterIds) {
        // Add transaction
        const { error: transactionError } = await supabase
          .from('credit_transactions')
          .insert({
            staff_id: casterId,
            stream_id: streamId,
            amount: 5,
            reason: 'Stream completion bonus',
          });

        if (transactionError) throw transactionError;

        // Update credits using RPC function (handles UPSERT automatically)
        const { error: updateError } = await supabase
          .rpc('increment_credits', {
            p_staff_id: casterId,
            p_amount: 5
          });

        if (updateError) {
          console.error('Failed to increment credits:', updateError);
          throw updateError;
        }
      }
    } catch (err) {
      throw err;
    }
  };

  const adjustCredits = async (staffId: string, amount: number, reason: string) => {
    if (!spaceId) throw new Error('No space selected');

    try {
      console.log('Adjusting credits:', { staffId, amount, reason });
      
      // Add transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          staff_id: staffId,
          amount,
          reason,
          space_id: spaceId,
        });

      if (transactionError) throw transactionError;

      console.log('Transaction added successfully');

      // Update credits using RPC function (handles UPSERT automatically)
      const { error: updateError } = await supabase
        .rpc('increment_credits', {
          p_staff_id: staffId,
          p_amount: amount
        });

      if (updateError) {
        console.error('RPC increment_credits error:', updateError);
        throw updateError;
      }

      console.log('Credits incremented successfully');
      
      // Force refresh the data to ensure UI updates
      await loadCreditsData();
    } catch (err) {
      console.error('Full error in adjustCredits:', err);
      throw err;
    }
  };

  return {
    credits,
    transactions,
    loading,
    error,
    awardStreamCredits,
    adjustCredits,
    refreshCredits: loadCreditsData,
  };
}