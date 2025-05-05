// src/components/gallery/RatingDisplay.tsx


interface RatingDisplayProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

const RatingDisplay = ({
  rating,
  count = 0,
  size = 'md',
  showCount = true
}: RatingDisplayProps) => {
  // Configuration not needed in this component

  // Round rating to nearest half star
  const roundedRating = Math.round(rating * 2) / 2;

  // Determine star size based on prop
  const starSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  }[size];

  // Generate stars
  const renderStars = () => {
    const stars = [];

    // Full stars
    const fullStars = Math.floor(roundedRating);
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="text-yellow-400">★</span>
      );
    }

    // Half star
    if (roundedRating % 1 !== 0) {
      stars.push(
        <span key="half" className="text-yellow-400 relative">
          <span className="absolute">★</span>
          <span className="text-gray-300 relative">
            <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>★</span>
            <span>☆</span>
          </span>
        </span>
      );
    }

    // Empty stars
    const emptyStars = 5 - Math.ceil(roundedRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">☆</span>
      );
    }

    return stars;
  };

  return (
    <div className="flex items-center">
      <div className={`flex ${starSize}`}>
        {renderStars()}
      </div>

      {showCount && (
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          {count > 0 ? `(${count})` : 'No ratings yet'}
        </span>
      )}
    </div>
  );
};

export default RatingDisplay;
