import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isLoggedIn = localStorage.getItem("admin_logged_in");

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
