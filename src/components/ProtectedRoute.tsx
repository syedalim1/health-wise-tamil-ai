import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast as showToast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  useEffect(() => {
    if (!currentUser) {
      showToast.error("Access Denied", {
        description: "Please login to access this page",
      });
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
