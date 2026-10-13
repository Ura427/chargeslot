import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { loggedOut } from '../features/auth/authSlice';
import { useLogoutMutation } from '../api/auth.api';
import { Button } from './Button';

const navLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 transition ${
    isActive
      ? 'bg-brand-50 text-brand-800'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

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
    <header
      role="banner"
      className="sticky top-0 z-20 border-b border-slate-200/80 bg-surface/90 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" className="size-8" />
          <span className="text-lg font-bold tracking-tight">
            Charge<span className="text-brand-700">Slot</span>
          </span>
        </Link>
        {accessToken && (
          <nav className="flex items-center gap-1 text-sm font-medium">
            <NavLink to="/" end className={navLink}>
              Stations
            </NavLink>
            <NavLink to="/reservations" className={navLink}>
              <span className="sm:hidden">Bookings</span>
              <span className="hidden sm:inline">My reservations</span>
            </NavLink>
            {user?.email && (
              <span className="ml-2 hidden text-slate-500 md:inline">
                {user.email}
              </span>
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
