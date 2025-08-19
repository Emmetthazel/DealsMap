import { render, screen, fireEvent } from '@testing-library/react';
import BusinessForm from '../components/BusinessForm';

describe('BusinessForm', () => {
  it('affiche le formulaire et valide les champs requis', () => {
    render(<BusinessForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Nom de l\'établissement'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Enregistrer'));
    expect(screen.getByText(/obligatoire/i)).toBeInTheDocument();
  });
});
// Fichier vidé pour nettoyage du projet
