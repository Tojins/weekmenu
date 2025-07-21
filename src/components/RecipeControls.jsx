export function RecipeControls({ 
  recipe, 
  isSelected, 
  selectedRecipe, 
  onAdd, 
  onRemove, 
  onUpdateServings,
  size = 'normal' // 'normal' or 'large'
}) {
  const sizeClasses = {
    normal: {
      button: 'py-3 lg:py-4 px-4 lg:px-6 text-base lg:text-lg',
      servingButton: 'w-9 h-9 lg:w-11 lg:h-11 text-lg lg:text-xl',
      servingText: 'text-base lg:text-lg w-10 lg:w-12',
      removeButton: 'text-base lg:text-lg'
    },
    large: {
      button: 'py-4 px-6 text-lg',
      servingButton: 'w-11 h-11 text-xl',
      servingText: 'text-lg w-12',
      removeButton: 'text-lg'
    }
  };

  const classes = sizeClasses[size];

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent modal from opening when clicking controls
  };

  if (!isSelected) {
    return (
      <button
        onClick={(e) => {
          handleClick(e);
          onAdd(recipe.id);
        }}
        className={`w-full bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium ${classes.button}`}
      >
        Add to menu
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between" onClick={handleClick}>
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => {
            handleClick(e);
            onUpdateServings(recipe.id, -1);
          }}
          className={`rounded-md border border-gray-300 hover:bg-gray-100 ${classes.servingButton}`}
        >
          −
        </button>
        <span className={`font-medium text-center ${classes.servingText}`}>
          {selectedRecipe.servings}
        </span>
        <button
          onClick={(e) => {
            handleClick(e);
            onUpdateServings(recipe.id, 1);
          }}
          className={`rounded-md border border-gray-300 hover:bg-gray-100 ${classes.servingButton}`}
        >
          +
        </button>
      </div>
      <button
        onClick={(e) => {
          handleClick(e);
          onRemove(recipe.id);
        }}
        className={`text-red-600 hover:text-red-700 font-medium ${classes.removeButton}`}
      >
        Remove
      </button>
    </div>
  );
}