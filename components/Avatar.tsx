import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  status?: 'online' | 'offline' | 'busy';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar: React.FC<AvatarProps> = ({ src, name, status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-slate-400',
    busy: 'bg-red-500',
  };

  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold border border-slate-200`}>
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${statusColors[status]}`}
        />
      )}
    </div>
  );
};

export default Avatar;