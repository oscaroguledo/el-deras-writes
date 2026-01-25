import React from 'react';
import { getInitialsAvatarData } from '../utils/userUtils';

interface UserAvatarProps {
  user: {
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  className?: string;
}

/**
 * UserAvatar component that displays user initials in a colored circle
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ user, className = 'h-10 w-10' }) => {
  const { initials, className: avatarClassName } = getInitialsAvatarData(user, className);

  return (
    <div className={avatarClassName}>
      {initials}
    </div>
  );
};

export default UserAvatar;