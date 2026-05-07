import React from 'react';

export interface StockBadgeProps {
  count: number;
}

export function StockBadge({ count }: StockBadgeProps) {
  if (count <= 5) {
    return (
      <span
        style={{
          padding: '4px 8px',
          backgroundColor: 'crimson',
          color: 'white',
          borderRadius: '4px',
          fontSize: '0.8rem',
        }}
      >
        Low Stock
      </span>
    );
  }
  return (
    <span
      style={{
        padding: '4px 8px',
        backgroundColor: 'mediumseagreen',
        color: 'white',
        borderRadius: '4px',
        fontSize: '0.8rem',
      }}
    >
      In Stock
    </span>
  );
}
