// Helper functions for making authenticated API calls

export function getAuthHeaders() {
  const user = localStorage.getItem('focus-user');
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  try {
    const userData = JSON.parse(user);
    return {
      'Content-Type': 'application/json',
      'x-user-id': userData.id.toString()
    };
  } catch (error) {
    throw new Error('Invalid user data');
  }
}

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };
  
  return fetch(url, {
    ...options,
    headers
  });
}
