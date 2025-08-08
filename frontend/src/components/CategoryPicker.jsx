// Components/CategoryPicker.jsx
import { useEffect, useState } from 'react';
import { useCategoryStore } from '../store/categoryStore';
import './categoryPicker.css'; 

const CategoryPicker = ({ onChange }) => {
  const { categories, loading, error, fetchAllCategories } = useCategoryStore();
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchAllCategories();
  }, []);

  const handleSelect = (category) => {
    if (!category.is_active) return;
    setSelectedId(category.id);
    onChange?.(category);
  };

  const renderTree = (nodes, depth = 0) => {
    return nodes.map((cat) => (
      <div
        key={cat.id}
        style={{ marginLeft: depth * 16 }}
        className={`category-item ${!cat.is_active ? 'disabled' : ''} ${selectedId === cat.id ? 'selected' : ''}`}
        onClick={() => handleSelect(cat)}
      >
        {cat.icon && <span className="icon" style={{ color: cat.color }}>{cat.icon}</span>}
        <span>{cat.name}</span>
        {cat.children && cat.children.length > 0 && renderTree(cat.children, depth + 1)}
      </div>
    ));
  };

  if (loading) return <div>Chargement des catégories...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!categories) return null;

  return (
    <div className="category-picker">
      {renderTree(categories)}
    </div>
  );
};

export default CategoryPicker;
