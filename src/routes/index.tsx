import { useNavigate } from "@/lib/routerCompat";
import { useEffect } from "react";
import { useAuth, roleHome } from "@/lib/auth";
import logo from "@/assets/hometown_logo.png";


function IndexGate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: user ? roleHome[user.role] : "/login", replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <img src={logo} alt="HomeTown" className="h-10 w-10 rounded-full ring-2 ring-primary/40 animate-pulse" />
        <span className="text-sm">Loading HomeTown POS…</span>
      </div>
    </div>
  );
}

export default IndexGate;
