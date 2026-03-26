const BACKEND_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.178:3000';

interface AuthResponse {
  access_token: string;
  user: User;
}

WebBrowser.maybeCompleteAuthSession();

const redirectTo = AuthSession.makeRedirectUri();

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.log(error);
    return;
  }

  await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
};

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

  return {
    access_token: data.session?.access_token || '',
    user: {
      id: user.id,
      email: user.email || '',
      name: (user.user_metadata as { name?: string })?.name || name,
    },
  };
};

export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
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
