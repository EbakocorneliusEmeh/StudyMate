const BACKEND_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.5:3000';

interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const register = async ({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Invalid response from server');
    }

    if (!res.ok) {
      const errorMsg = Array.isArray(data.message)
        ? data.message[0]
        : data.message || 'Registration failed';

      throw new Error(errorMsg);
    }
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Registration failed');
  }
};

export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Invalid response from server');
    }

    if (!res.ok) {
      const errorMsg = Array.isArray(data.message)
        ? data.message[0]
        : data.message || 'Login failed';

      throw new Error(errorMsg);
    }
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Login failed');
  }
};
