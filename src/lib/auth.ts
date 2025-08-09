// Simple user management without external auth
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (name: string, email: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

// Get or create user
export async function getOrCreateUser(name: string, email: string): Promise<User> {
  try {
    // Try to find existing user
    const response = await fetch('/api/auth/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to create user');
    }
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
}
