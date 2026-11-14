import { useEffect, useState } from 'react';
import { authService } from '../../services/api/authService';

export function useCollaborationPermissions() {
  const [permissions, setPermissions] = useState(() => new Set(authService.getCurrentUser()?.permissions));
  useEffect(() => {
    let active = true;
    authService.getMe().then(user => {
      if (active) setPermissions(new Set(user.permissions));
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  return permissions;
}
