import React from 'react';
import { useEscapeRoomStore } from '../../../stores/escapeRoomStore';

const roomThemeColors = {
  gold: '#c9a84c',
  emerald: '#2d6a4f',
  azure: '#3b82f6',
  ruby: '#9b2335',
  purple: '#8b5cf6',
};

export default function RoomMap() {
  const { rooms, currentRoomIndex } = useEscapeRoomStore();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      padding: '8px 16px',
    }}>
      {rooms.map((room, i) => {
        const color = roomThemeColors[room.theme];
        const isCurrent = i === currentRoomIndex;
        const isSolved = room.status === 'solved';
        return (
          <React.Fragment key={room.id}>
            {i > 0 && (
              <div style={{
                width: 24,
                height: 2,
                background: isSolved || rooms[i - 1].status === 'solved'
                  ? color : 'rgba(255,255,255,0.15)',
                transition: 'background 0.5s',
              }} />
            )}
            <div
              title={room.name}
              style={{
                width: isCurrent ? 16 : 12,
                height: isCurrent ? 16 : 12,
                borderRadius: '50%',
                background: isSolved
                  ? color
                  : isCurrent
                    ? color
                    : 'rgba(255,255,255,0.15)',
                border: isCurrent ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.2)',
                boxShadow: isCurrent ? `0 0 10px ${color}` : 'none',
                transition: 'all 0.5s ease',
                opacity: isSolved ? 1 : isCurrent ? 1 : 0.5,
              }}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
