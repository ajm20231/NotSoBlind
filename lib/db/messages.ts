import { supabase, Message } from '@/lib/supabase';
import { formatPhoneNumber } from '@/lib/utils';

/**
 * Send a message in a nomination chat
 */
export async function sendMessage(
  nominationId: string,
  senderPhone: string,
  content: string
): Promise<Message | null> {
  try {
    const formattedPhone = formatPhoneNumber(senderPhone);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        nomination_id: nominationId,
        sender_phone: formattedPhone,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return data as Message;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return null;
  }
}

/**
 * Get all messages for a nomination
 */
export async function getMessages(nominationId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('nomination_id', nominationId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return data as Message[];
  } catch (error) {
    return [];
  }
}

/**
 * Subscribe to new messages in real-time
 */
export function subscribeToMessages(
  nominationId: string,
  callback: (message: Message) => void
) {
  return supabase
    .channel(`messages:${nominationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `nomination_id=eq.${nominationId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();
}

/**
 * Count messages in a chat
 */
export async function getMessageCount(nominationId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('nomination_id', nominationId);

    return count || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Get message statistics for a chat (for prompting number exchange)
 */
export async function getChatStats(nominationId: string, nomination: any): Promise<{
  messageCount: number;
  hoursActive: number;
  shouldPromptExchange: boolean;
}> {
  try {
    const messages = await getMessages(nominationId);
    const messageCount = messages.length;

    // Calculate hours since first message
    const firstMessage = messages[0];
    const hoursActive = firstMessage
      ? (Date.now() - new Date(firstMessage.created_at).getTime()) / (1000 * 60 * 60)
      : 0;

    // Count messages per person
    const personAMessages = messages.filter(
      (m) => m.sender_phone === nomination.person_a_phone
    ).length;
    const personBMessages = messages.filter(
      (m) => m.sender_phone === nomination.person_b_phone
    ).length;

    // Prompt if: 24+ hours active OR both sent 3+ messages
    const shouldPromptExchange =
      hoursActive >= 24 || (personAMessages >= 3 && personBMessages >= 3);

    return {
      messageCount,
      hoursActive,
      shouldPromptExchange,
    };
  } catch (error) {
    return {
      messageCount: 0,
      hoursActive: 0,
      shouldPromptExchange: false,
    };
  }
}
