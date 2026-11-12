import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, UserRound, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import oarLogo from "@/assets/oar-logo.png";
import { useQueryClient } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/useAdmin";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const isAdmin = useAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function logOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <header className="border-b-2 border-foreground bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <img src={oarLogo} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
          <span className="font-display text-base font-bold uppercase sm:text-xl">
            OarExchange <span className="text-primary">Ireland</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/" activeOptions={{ exact: true }}>Browse oars</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/listings/new">
                  <Plus className="h-4 w-4 shrink-0" /><span className="hidden sm:inline">List an oar</span><span className="sm:hidden">List</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/my-listings">My listings</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Account menu">
                    <UserRound className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="max-w-56 truncate font-normal text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="sm:hidden">
                    <Link to="/">Browse oars</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="sm:hidden">
                    <Link to="/my-listings">My listings</Link>
                  </DropdownMenuItem>
                  {isAdmin && <DropdownMenuItem asChild><Link to="/moderation">Reported listings</Link></DropdownMenuItem>}
                  {isAdmin && <DropdownMenuItem asChild><Link to="/messages">Messages</Link></DropdownMenuItem>}
                  <DropdownMenuItem onSelect={logOut}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/about">About</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-4 py-6 text-sm text-muted-foreground">
        <span>OarExchange Ireland is free to use.</span>
        <Link to="/" className="hover:text-foreground">Browse oars</Link>
        <Link to="/about" className="hover:text-foreground">About</Link>
        <Link to="/contact" className="hover:text-foreground">Contact</Link>
        <Link to="/privacy" className="hover:text-foreground">Privacy policy</Link>
        <Button asChild variant="ghost" size="icon" className="ml-auto" title="Instagram">
          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
        </Button>
      </div>
    </footer>
  );
}
