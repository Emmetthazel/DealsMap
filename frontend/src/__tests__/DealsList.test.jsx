import { render, screen, waitFor } from '@testing-library/react';
import DealsList from '../components/DealsList';
import * as dealsService from '../services/deals';

describe('DealsList', () => {
  it('affiche les deals retournés par le service', async () => {
    jest.spyOn(dealsService, 'fetchDeals').mockResolvedValueOnce([
      { id: 1, title: 'Deal 1', price: 10 },
      { id: 2, title: 'Deal 2', price: 20 },
    ]);
    render(<DealsList filters={{}} />);
    await waitFor(() => {
      expect(screen.getByText('Deal 1 - 10€')).toBeInTheDocument();
      expect(screen.getByText('Deal 2 - 20€')).toBeInTheDocument();
    });
  });
});
// Fichier vidé pour nettoyage du projet
