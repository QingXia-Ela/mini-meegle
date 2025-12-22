import { useLocation } from 'react-router';

function useRouteActive(path: string, mode: 'exact' | 'includes' = 'includes') {
  const location = useLocation();
  const isActive = (path: string, mode: 'exact' | 'includes' = 'includes') => {
    if (mode === 'exact') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  }
  return isActive(path, mode);
}

export default useRouteActive;