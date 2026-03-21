import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

interface Props {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: Props) => {
  const user = useSelector((state: any) => state.auth?.user);
  const token = useSelector((state: any) => state.auth?.token);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
