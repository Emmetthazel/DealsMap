import { Link } from 'react-router-dom';

const VerifyEmailInfo = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full space-y-8 text-center">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Vérification de l'email</h2>
      <p className="mb-4">Un email de vérification a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception et cliquer sur le lien pour activer votre compte.</p>
      <Link to="/login" className="text-blue-600 hover:underline">Retour à la connexion</Link>
    </div>
  </div>
);

export default VerifyEmailInfo;