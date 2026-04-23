'use client';

import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';

export default function PlayerCard({ player, selected, isCaptain, onToggle, onSetCaptain }) {
  const { i18n } = useTranslation();
  const name = i18n.language === 'ar' && player.nameAr ? player.nameAr : player.nameEn;

  return (
    <div
      className={clsx(
        'card transition relative cursor-pointer',
        selected ? 'ring-2 ring-brand bg-brand/10' : 'hover:bg-white/10'
      )}
      onClick={() => onToggle?.(player)}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
          {player.photoUrl ? (
            <img 
              src={player.photoUrl} 
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to jersey number if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-full grid place-items-center text-xl font-bold bg-white/10"
            style={{ display: player.photoUrl ? 'none' : 'flex' }}
          >
            {player.jerseyNumber ?? '#'}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">
            {name}
            {player.jerseyNumber && (
              <span className="ml-2 text-sm text-white/60 font-normal">#{player.jerseyNumber}</span>
            )}
          </div>
          <div className="text-xs text-white/60">{player.position}</div>
        </div>
        <div className="text-brand font-bold tabular-nums">{player.fantasyValue}</div>
      </div>
      {selected && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSetCaptain?.(player.id); }}
          className={clsx(
            'absolute top-2 end-2 rounded-full p-1.5 border transition',
            isCaptain ? 'bg-brand text-black border-brand' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
          )}
          title="Captain"
        >
          <Star size={14} fill={isCaptain ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}
