import { render, screen, fireEvent } from '@testing-library/react';
import DealForm from '../components/DealForm';

describe('DealForm', () => {
  it('affiche le formulaire et valide les champs requis', () => {
    render(<DealForm onSubmit={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Titre du deal'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Enregistrer'));
    expect(screen.getByText(/obligatoire/i)).toBeInTheDocument();
  });
});
// Fichier vidé pour nettoyage du projet
