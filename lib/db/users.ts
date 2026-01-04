import { supabase, supabaseAdmin, User } from '@/lib/supabase';

/**
 * Get or create user by phone number
 */
export async function getOrCreateUser(phone: string, firstName: string): Promise<User | null> {
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      return existingUser as User;
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ phone, first_name: firstName })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return newUser as User;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    return null;
  }
}

/**
 * Get user by phone number
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) return null;
    return data as User;
  } catch (error) {
    return null;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as User;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user is banned
 */
export async function isUserBanned(phone: string): Promise<boolean> {
  const user = await getUserByPhone(phone);
  return user?.is_banned || false;
}

/**
 * Ban user (admin only)
 */
export async function banUser(phone: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_banned: true })
      .eq('phone', phone);

    return !error;
  } catch (error) {
    console.error('Error banning user:', error);
    return false;
  }
}
