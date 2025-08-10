import React, { useState, useMemo, useCallback } from 'react';
import { Search, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';

const HierarchicalCategorySelector = ({ 
  categories = [], 
  onSelect, 
  selectedCategories = [], 
  multiple = false,
  placeholder = "Sélectionner une catégorie...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Fonction pour vérifier si une catégorie est sélectionnée
  const isSelected = useCallback((categoryId) => {
    if (multiple) {
      return selectedCategories && selectedCategories.some(cat => cat.id === categoryId);
    }
    return selectedCategories?.id === categoryId;
  }, [selectedCategories, multiple]);

  // Fonction pour basculer l'expansion d'un nœud
  const toggleExpanded = useCallback((categoryId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  // Fonction pour filtrer les catégories selon la recherche
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;

    const searchLower = searchTerm.toLowerCase();
    
    const filterCategory = (cat) => {
      const matchesSearch = cat.name.toLowerCase().includes(searchLower) ||
                           cat.description.toLowerCase().includes(searchLower);
      
      if (cat.children && cat.children.length > 0) {
        const filteredChildren = cat.children
          .map(filterCategory)
          .filter(Boolean);
        
        if (filteredChildren.length > 0 || matchesSearch) {
          return {
            ...cat,
            children: filteredChildren
          };
        }
      }
      
      return matchesSearch ? cat : null;
    };

    return categories
      .map(filterCategory)
      .filter(Boolean);
  }, [categories, searchTerm]);

  // Fonction pour gérer la sélection
  const handleSelect = useCallback((category) => {
    if (onSelect) {
      if (multiple) {
        const isAlreadySelected = isSelected(category.id);
        if (isAlreadySelected) {
          onSelect((selectedCategories || []).filter(cat => cat.id !== category.id));
        } else {
          onSelect([...(selectedCategories || []), category]);
        }
      } else {
        onSelect(category);
        setIsOpen(false);
      }
    }
  }, [onSelect, multiple, selectedCategories, isSelected]);

  // Fonction pour obtenir le texte affiché dans le sélecteur
  const getDisplayText = useCallback(() => {
    if (multiple) {
      if (!selectedCategories || selectedCategories.length === 0) return placeholder;
      if (selectedCategories.length === 1) return selectedCategories[0].name;
      return `${selectedCategories.length} catégories sélectionnées`;
    }
    return selectedCategories?.name || placeholder;
  }, [selectedCategories, multiple, placeholder]);

  // Composant pour afficher une catégorie individuelle
  const CategoryItem = ({ category, level = 0, isSearchResult = false }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const isCategorySelected = isSelected(category.id);

    return (
      <div className="w-full">
        <div
          className={clsx(
            "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200",
            "hover:bg-gray-50 dark:hover:bg-gray-800",
            isCategorySelected && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700",
            level > 0 && "ml-4"
          )}
          onClick={() => {
            // Si la catégorie a des enfants, basculer l'expansion
            if (hasChildren) {
              toggleExpanded(category.id);
            } else {
              // Sinon, sélectionner la catégorie
              handleSelect(category);
            }
          }}
        >
          <div className="flex items-center flex-1 min-w-0">
            {/* Icône de la catégorie */}
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
              style={{ backgroundColor: category.color + '20' }}
            >
              <span 
                className="text-lg"
                style={{ color: category.color }}
              >
                {getCategoryIcon(category.icon, category.name)}
              </span>
            </div>

            {/* Informations de la catégorie */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {category.name}
              </div>
              {category.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {category.description}
                </div>
              )}
            </div>

            {/* Indicateur de sélection */}
            {isCategorySelected && (
              <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            )}
          </div>

          {/* Indicateur visuel d'expansion pour les catégories avec enfants */}
          {hasChildren && !isSearchResult && (
            <div className="ml-2 p-1 text-gray-400">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          )}
        </div>

        {/* Sous-catégories */}
        {hasChildren && (isExpanded || isSearchResult) && (
          <div className="mt-1">
            {category.children.map((child) => (
              <CategoryItem
                key={child.id}
                category={child}
                level={level + 1}
                isSearchResult={isSearchResult}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Fonction pour obtenir l'icône de la catégorie de manière intelligente
  const getCategoryIcon = (iconName, categoryName = '') => {
    // Si on a un nom d'icône spécifique, l'utiliser en priorité
    if (iconName && iconName !== 'null' && iconName !== 'undefined') {
      const iconMap = {
        'utensils': '🍴', 'burger': '🍔', 'hamburger': '🍔', 'pizza-slice': '🍕',
        'wine-glass': '🍷', 'shopping-bag': '🛍️', 'tshirt': '👕', 'shoe-prints': '👟',
        'coffee': '☕', 'car': '🚗', 'home': '🏠', 'heart': '❤️', 'star': '⭐',
        'gift': '🎁', 'music': '🎵', 'book': '📚', 'gamepad': '🎮', 'dumbbell': '🏋️',
        'paintbrush': '🎨', 'camera': '📷', 'electronics': '💻', 'computer': '💻',
        'laptop': '💻', 'smartphone': '📱', 'phone': '📱', 'tablet': '📱',
        'restaurant': '🍽️', 'food': '🍽️', 'shopping': '🛒', 'fashion': '👗',
        'clothing': '👕', 'sport': '⚽', 'fitness': '🏋️', 'health': '🏥',
        'medical': '🏥', 'education': '🎓', 'school': '🎓', 'travel': '✈️',
        'tourism': '✈️', 'entertainment': '🎭', 'leisure': '🎮'
      };
      
      if (iconMap[iconName]) {
        return iconMap[iconName];
      }
    }
    
    // Mapping intelligent basé sur le nom de la catégorie
    const name = (categoryName || '').toLowerCase();
    
    // Technologies & Électronique
    if (name.includes('tech') || name.includes('technologie') || name.includes('digital') || 
        name.includes('software') || name.includes('programming') || name.includes('code') ||
        name.includes('web') || name.includes('internet') || name.includes('online')) {
      return '💻';
    }
    
    // Alimentation & Restauration
    if (name.includes('food') || name.includes('restaurant') || name.includes('cafe') ||
        name.includes('bar') || name.includes('bistro') || name.includes('pizzeria') ||
        name.includes('bakery') || name.includes('patisserie') || name.includes('fast') ||
        name.includes('cuisine') || name.includes('gastronomie') || name.includes('menu')) {
      return '🍽️';
    }
    
    // Shopping & Mode
    if (name.includes('shop') || name.includes('store') || name.includes('boutique') ||
        name.includes('mall') || name.includes('center') || name.includes('market') ||
        name.includes('fashion') || name.includes('style') || name.includes('trend') ||
        name.includes('clothing') || name.includes('accessories') || name.includes('jewelry')) {
      return '🛍️';
    }
    
    // Sport & Fitness
    if (name.includes('sport') || name.includes('fitness') || name.includes('gym') ||
        name.includes('workout') || name.includes('training') || name.includes('athletic') ||
        name.includes('outdoor') || name.includes('adventure') || name.includes('hiking') ||
        name.includes('swimming') || name.includes('running') || name.includes('cycling')) {
      return '⚽';
    }
    
    // Santé & Bien-être
    if (name.includes('health') || name.includes('medical') || name.includes('pharmacy') ||
        name.includes('clinic') || name.includes('hospital') || name.includes('doctor') ||
        name.includes('wellness') || name.includes('beauty') || name.includes('spa') ||
        name.includes('salon') || name.includes('therapy') || name.includes('care')) {
      return '🏥';
    }
    
    // Éducation & Formation
    if (name.includes('education') || name.includes('school') || name.includes('university') ||
        name.includes('college') || name.includes('academy') || name.includes('training') ||
        name.includes('course') || name.includes('learning') || name.includes('study') ||
        name.includes('library') || name.includes('museum') || name.includes('gallery')) {
      return '🎓';
    }
    
    // Transport & Voyage
    if (name.includes('travel') || name.includes('tourism') || name.includes('hotel') ||
        name.includes('accommodation') || name.includes('transport') || name.includes('car') ||
        name.includes('bike') || name.includes('taxi') || name.includes('bus') ||
        name.includes('train') || name.includes('airport') || name.includes('station')) {
      return '✈️';
    }
    
    // Loisirs & Divertissement
    if (name.includes('entertainment') || name.includes('leisure') || name.includes('fun') ||
        name.includes('game') || name.includes('play') || name.includes('movie') ||
        name.includes('cinema') || name.includes('theater') || name.includes('concert') ||
        name.includes('music') || name.includes('art') || name.includes('culture')) {
      return '🎭';
    }
    
    // Maison & Jardin
    if (name.includes('home') || name.includes('house') || name.includes('garden') ||
        name.includes('furniture') || name.includes('decoration') || name.includes('interior') ||
        name.includes('renovation') || name.includes('construction') || name.includes('real estate')) {
      return '🏠';
    }
    
    // Automobile & Transport
    if (name.includes('auto') || name.includes('car') || name.includes('vehicle') ||
        name.includes('motorcycle') || name.includes('bike') || name.includes('scooter') ||
        name.includes('dealership') || name.includes('garage') || name.includes('service')) {
      return '🚗';
    }
    
    // Finance & Business
    if (name.includes('finance') || name.includes('bank') || name.includes('insurance') ||
        name.includes('investment') || name.includes('business') || name.includes('office') ||
        name.includes('corporate') || name.includes('consulting') || name.includes('legal')) {
      return '💰';
    }
    
    // Services & Professionnels
    if (name.includes('service') || name.includes('professional') || name.includes('expert') ||
        name.includes('consultant') || name.includes('specialist') || name.includes('advisor') ||
        name.includes('agency') || name.includes('company') || name.includes('enterprise')) {
      return '🔧';
    }
    
    // Par défaut, essayer de deviner par le nom
    if (name.includes('book') || name.includes('reading') || name.includes('literature')) return '📚';
    if (name.includes('music') || name.includes('audio') || name.includes('sound')) return '🎵';
    if (name.includes('photo') || name.includes('camera') || name.includes('image')) return '📷';
    if (name.includes('gift') || name.includes('present') || name.includes('surprise')) return '🎁';
    if (name.includes('star') || name.includes('favorite') || name.includes('premium')) return '⭐';
    if (name.includes('heart') || name.includes('love') || name.includes('romance')) return '❤️';
    if (name.includes('coffee') || name.includes('tea') || name.includes('beverage')) return '☕';
    
    // Si rien ne correspond, retourner une icône générique basée sur le type
    return '📁';
  };

  return (
    <div className={clsx("relative w-full", className)}>
      {/* Zone de recherche et sélection unifiée */}
      <div className="relative">
        {/* Titre "Toutes les catégories" */}
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Toutes les catégories
          </h3>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm || (selectedCategories?.name || (selectedCategories && selectedCategories.length > 0 ? getDisplayText() : ''))}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              setIsOpen(true);
              // Vider le champ de recherche au focus pour permettre une nouvelle recherche
              setSearchTerm('');
            }}
            className={clsx(
              "w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
              "rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200",
              isOpen && "ring-2 ring-blue-500 border-blue-500"
            )}
          />
          {/* Bouton pour ouvrir/fermer le dropdown */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute inset-y-0 right-0 px-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-lg transition-colors"
          >
            <ChevronDown 
              className={clsx(
                "w-5 h-5 text-gray-400 transition-transform duration-200",
                isOpen && "rotate-180"
              )} 
            />
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-hidden">

          {/* Liste des catégories */}
          <div className="max-h-80 overflow-y-auto p-2">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  isSearchResult={searchTerm.trim().length > 0}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucune catégorie trouvée
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay pour fermer le dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default HierarchicalCategorySelector;
