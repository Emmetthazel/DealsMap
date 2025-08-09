export const buildTree = (flatCategories) => {
    const idMap = {};
    const tree = [];
  
    flatCategories.forEach((cat) => {
      idMap[cat.id] = { ...cat, children: [] };
    });
  
    flatCategories.forEach((cat) => {
      if (cat.parent) {
        const parent = idMap[cat.parent];
        if (parent) {
          parent.children.push(idMap[cat.id]);
        }
      } else {
        tree.push(idMap[cat.id]);
      }
    });
  
    return tree;
  };
  
  /**
   * @param {Object} category 
   * @param {Object} categoriesMap 
   * @returns {string} 
   */
  export const getCategoryFullPath = (category, categoriesMap) => {
    const path = [];
    let current = category;
    while (current) {
      path.unshift(current.name);
      current = categoriesMap[current.parent];
    }
    return path.join(' > ');
  };
  