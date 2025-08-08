// pages/CategoryPage.jsx
import React from 'react';
import CategoryPicker from '../components/CategoryPicker';

export default function CategoryPage() {
  const handleCategorySelect = (category) => {
    console.log('Catégorie sélectionnée :', category);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Choisissez une catégorie</h1>
      <CategoryPicker onSelect={handleCategorySelect} />
    </div>
  );
}
