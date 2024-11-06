import { Navigate, Outlet } from "react-router-dom";

interface Types {
  isAllowed: boolean;
  redirectPath: string;
  children?: any;
}

const ProtectedRoute = ({ isAllowed, redirectPath, children }: Types) => {
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
