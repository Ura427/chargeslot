import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

export function ProtectedRoute() {
  const { accessToken, sessionChecked } = useSelector(
    (state: RootState) => state.auth,
  );
  if (!accessToken && !sessionChecked) {
    return (
      <p role="status" className="py-20 text-center text-sm text-slate-500">
        Signing you in…
      </p>
    );
  }
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
