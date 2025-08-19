import { render, screen, fireEvent } from '@testing-library/react';
import DealsFilter from '../components/DealsFilter';

describe('DealsFilter', () => {
  it('appelle onChange avec les bons filtres', () => {
    const onChange = jest.fn();
    render(<DealsFilter onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('Catégorie'), { target: { value: 'Food', name: 'category' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ category: 'Food' }));
  });
});
// Fichier vidé pour nettoyage du projet
