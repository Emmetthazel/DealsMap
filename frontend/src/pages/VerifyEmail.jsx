import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('pending');
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  useEffect(() => {
    if (uid && token) {
      axios.get(`http://localhost:8000/api/auth/verify-email/?uid=${uid}&token=${token}`)
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'));
    }
  }, [uid, token]);

  if (status === 'pending') return <p>Vérification en cours...</p>;
  if (status === 'success') return (
    <div>
      <p>Email vérifié avec succès !</p>
      <Link to="/login" className="text-blue-600">Se connecter</Link>
    </div>
  );
  return <p>Erreur de vérification. Lien invalide ou expiré.</p>;
};

export default VerifyEmail;