// import { createContext, useContext, useState, useEffect } from 'react';
// import { authApi } from '../api/authApi';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(() => localStorage.getItem('invoice_token'));
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split('.')[1]));
//         const isExpired = payload.exp * 1000 < Date.now();
//         if (isExpired) {
//           logout();
//         } else {
//           setUser({
//             userId: payload.userId || payload.sub,
//             email: payload.email,
//             role: payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
//             name: payload.name || payload.email,
//           });
//         }
//       } catch {
//         logout();
//       }
//     }
//     setLoading(false);
//   }, [token]);

//   const login = async (email, password) => {
//     const data = await authApi.login(email, password);
//     localStorage.setItem('invoice_token', data.token);
//     setToken(data.token);
//     return data;
//   };

//   const logout = () => {
//     localStorage.removeItem('invoice_token');
//     setToken(null);
//     setUser(null);
//   };

//   const hasRole = (...roles) => {
//     if (!user) return false;
//     return roles.some(r => r.toLowerCase() === user.role?.toLowerCase());
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// };













import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const padded = payloadPart + '='.repeat((4 - (payloadPart.length % 4)) % 4);
    const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    // Clear any potentially cached tokens for debugging
    const storedToken = localStorage.getItem('invoice_token');
    if (storedToken) {
      // Validate token format
      try {
        const payload = decodeToken(storedToken);
        if (!payload || !payload.role) {
          localStorage.removeItem('invoice_token');
          return null;
        }
      } catch {
        localStorage.removeItem('invoice_token');
        return null;
      }
    }
    return storedToken;
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('invoice_token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const payload = decodeToken(token);
    if (!payload || !payload.exp) {
      logout();
      return;
    }

    const isExpired = payload.exp * 1000 < Date.now();
    if (isExpired) {
      logout();
      return;
    }

    const roleClaim =
      payload.role ||
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const idClaim =
      payload.userId ||
      payload.sub ||
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

    setUser({
      userId: idClaim,
      email: payload.email,
      role: roleClaim,
      name: payload.name || payload.email || 'User',
    });
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('invoice_token', data.token);
    setToken(data.token);
    return data;
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    
    // Map backend roles to frontend expectations
    const roleMapping = {
      'Admin': 'Admin',
      'FinanceManager': 'FinanceManager',
      'FinanceUser': 'FinanceUser',
      'User': 'User'
    };
    
    const userRole = roleMapping[user.role] || user.role;
    return roles.some((r) => r.toLowerCase() === userRole?.toLowerCase());
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};