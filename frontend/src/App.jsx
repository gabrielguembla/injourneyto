import { useCallback, useState } from 'react';
import axios from 'axios';

import './App.css';
import Menu from './components/Menu/Menu.jsx';
import GoogleSignInButton from './components/GoogleSignInButton/GoogleSignInButton.jsx';
import ClienteForm from './components/ClienteForm/ClienteForm.jsx';

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [credential, setCredential] = useState('');
  const [googleProfile, setGoogleProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  const saveSession = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    setUser(data.user);
    setCredential('');
    setGoogleProfile(null);
    setMessage('You are signed in successfully.');
  };

  const handleGoogleCredential = useCallback(async (googleCredential) => {
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/google`,
        { credential: googleCredential }
      );

      if (response.data.status === 'profile_required') {
        setCredential(googleCredential);
        setGoogleProfile(response.data.googleProfile);
        setMessage('Complete your address to create your account.');
      } else {
        saveSession(response.data);
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Google sign-in failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleCompleteProfile(address) {
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/google/complete`,
        {
          credential,
          address
        }
      );

      saveSession(response.data);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Could not complete registration.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
    setMessage('You have signed out.');
  }

  return (
    <>
      <Menu />

      <main>
        <h1>InJourneyTo</h1>

        {user ? (
          <section>
            <h2>Welcome, {user.first_name}!</h2>
            <p>{user.email}</p>

            {user.photo_url && (
              <img
                src={user.photo_url}
                alt="Profile"
                width="80"
              />
            )}

            <button onClick={handleLogout}>
              Sign out
            </button>
          </section>
        ) : googleProfile ? (
          <ClienteForm
            googleProfile={googleProfile}
            onSubmit={handleCompleteProfile}
            loading={loading}
          />
        ) : (
          <GoogleSignInButton
            onCredential={handleGoogleCredential}
          />
        )}

        {loading && <p role="status">Please wait...</p>}
        {message && <p role="status">{message}</p>}
      </main>
    </>
  );
}