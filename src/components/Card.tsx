import React from 'react';
import type { Card as CardType } from '../engine/types';

interface CardProps {
  card: CardType;
  selected?: boolean;
  disabled?: boolean;
  inHand?: boolean;
  inPool?: boolean;
  matched?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  showDescription?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  '定律': '#4a90d9',
  '概念': '#27ae60',
  '公式': '#e67e22',
  '方法': '#8e44ad',
};

const CardComponent: React.FC<CardProps> = ({
  card,
  selected = false,
  disabled = false,
  inHand = false,
  inPool = false,
  matched = false,
  size = 'medium',
  showDescription = true,
  onClick,
}) => {
  const color = CATEGORY_COLORS[card.category ?? ''] ?? '#666';
  
  const sizeClass = size === 'small' ? 'card-small' : size === 'large' ? 'card-large' : 'card-medium';
  const stateClass = selected ? 'card-selected' : disabled ? 'card-disabled' : '';
  const zoneClass = inHand ? 'card-in-hand' : inPool ? 'card-in-pool' : '';
  const matchedClass = matched ? 'card-matched' : '';

  return (
    <div
      className={`card ${sizeClass} ${stateClass} ${zoneClass} ${matchedClass}`}
      style={{ '--card-color': color } as React.CSSProperties}
      onClick={disabled ? undefined : onClick}
    >
      <div className="card-inner">
        <div className="card-category" style={{ backgroundColor: color }}>
          {card.category ?? '?'}
        </div>
        <div className="card-name">{card.name}</div>
        {card.description && showDescription && size !== 'small' && (
          <div className="card-desc">{card.description}</div>
        )}
      </div>
    </div>
  );
};

export default CardComponent;
