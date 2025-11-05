import { supabase } from './supabaseClient';

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: 'new' | 'read' | 'replied' | 'archived';
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Submit a contact form message
 */
export async function submitContactMessage(
  data: Omit<ContactMessage, 'id' | 'status' | 'created_at' | 'updated_at'>
): Promise<ContactMessage> {
  try {
    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    const messageData = {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      user_id: user?.id || null,
      status: 'new'
    };

    const { data: insertedMessage, error } = await supabase
      .from('contact_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Error submitting contact message:', error);
      throw new Error('Failed to submit contact message. Please try again.');
    }

    return insertedMessage;
  } catch (error) {
    console.error('Error in submitContactMessage:', error);
    throw error;
  }
}

/**
 * Get contact messages for the current user
 */
export async function getUserContactMessages(userId: string): Promise<ContactMessage[]> {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact messages:', error);
      throw new Error('Failed to fetch contact messages.');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserContactMessages:', error);
    throw error;
  }
}

/**
 * Get a single contact message by ID
 */
export async function getContactMessage(messageId: string): Promise<ContactMessage | null> {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) {
      console.error('Error fetching contact message:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getContactMessage:', error);
    return null;
  }
}

/**
 * Update contact message status (admin only)
 */
export async function updateContactMessageStatus(
  messageId: string,
  status: 'new' | 'read' | 'replied' | 'archived'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', messageId);

    if (error) {
      console.error('Error updating contact message status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateContactMessageStatus:', error);
    return false;
  }
}
