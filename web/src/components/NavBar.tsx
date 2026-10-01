import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { loggedOut } from '../features/auth/authSlice';
import { useLogoutMutation } from '../api/auth.api';
import { Button } from './Button';

export function NavBar() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      // Refresh cookie may already be gone; still clear client-side state.
    }
    dispatch(loggedOut());
    navigate('/login');
  }

  return (
    <header role="banner" className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="size-7" />
          <span className="text-lg font-semibold tracking-tight">
            ChargeSlot
          </span>
        </Link>
        {accessToken && (
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-slate-600 hover:text-slate-900">
              Stations
            </Link>
            <Link
              to="/reservations"
              className="text-slate-600 hover:text-slate-900"
            >
              My reservations
            </Link>
            {user?.email && (
              <span className="text-slate-500">{user.email}</span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
