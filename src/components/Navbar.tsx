import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Upload, LogOut, User, Shield, Settings, Sun, Moon, Monitor, Menu, X, Download, Mail, Calendar, Heart, Users } from 'lucide-react';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="h-4 w-4" />;
    if (theme === 'dark') return <Moon className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const NavLinks = ({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) => (
    <>
      <Link 
        to="/" 
        onClick={onClose}
        className={`text-sm font-medium text-muted-foreground transition-colors hover:text-foreground ${mobile ? 'block py-2' : ''}`}
      >
        Home
      </Link>
      <Link 
        to={user ? "/browse" : "/auth?redirect=/browse"} 
        onClick={onClose}
        className={`text-sm font-medium text-muted-foreground transition-colors hover:text-foreground ${mobile ? 'block py-2' : ''}`}
      >
        Browse Papers
      </Link>
      {isAdmin && (
        <Link 
          to="/admin" 
          onClick={onClose}
          className={`flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 ${mobile ? 'py-2' : ''}`}
        >
          <Shield className="h-4 w-4" />
          Admin
        </Link>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">QP Hub</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          <NavLinks />
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {getThemeIcon()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              <NotificationsDropdown />
              <Link to="/profile?tab=downloads" className="hidden md:block">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  My Downloads
                </Button>
              </Link>
              <Link to="/upload" className="hidden md:block">
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile Information
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-48">
                      <DropdownMenuLabel>Theme</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setTheme('light')}>
                        <Sun className="mr-2 h-4 w-4" />
                        Light Theme
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('dark')}>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark Theme
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('system')}>
                        <Monitor className="mr-2 h-4 w-4" />
                        System Default
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Account Settings</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate('/profile?tab=settings')}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/profile?tab=settings')}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Age
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem onClick={() => navigate('/profile?tab=bookmarks')}>
                    <Heart className="mr-2 h-4 w-4" />
                    Bookmarks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile?tab=downloads')}>
                    <Download className="mr-2 h-4 w-4" />
                    Downloads
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile?tab=following')}>
                    <Users className="mr-2 h-4 w-4" />
                    Following
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile?tab=followers')}>
                    <Users className="mr-2 h-4 w-4" />
                    Followers
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/auth" className="hidden md:block">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth?mode=signup" className="hidden md:block">
                <Button size="sm" className="gradient-primary">
                  Get Started
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 pt-6">
                <div className="flex items-center gap-2 pb-4 border-b border-border">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                    <FileText className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold text-foreground">QP Hub</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <NavLinks mobile onClose={() => setMobileMenuOpen(false)} />
                </div>

                <div className="border-t border-border pt-4">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <SheetClose asChild>
                        <Link to="/profile">
                          <Button variant="ghost" className="w-full justify-start">
                            <User className="mr-2 h-4 w-4" />
                            Profile
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/profile?tab=bookmarks">
                          <Button variant="ghost" className="w-full justify-start">
                            <Heart className="mr-2 h-4 w-4" />
                            Bookmarks
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/profile?tab=downloads">
                          <Button variant="ghost" className="w-full justify-start">
                            <Download className="mr-2 h-4 w-4" />
                            Downloads
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/profile?tab=following">
                          <Button variant="ghost" className="w-full justify-start">
                            <Users className="mr-2 h-4 w-4" />
                            Following
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/upload">
                          <Button variant="outline" className="w-full justify-start">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Paper
                          </Button>
                        </Link>
                      </SheetClose>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-destructive"
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <SheetClose asChild>
                        <Link to="/auth">
                          <Button variant="ghost" className="w-full">
                            Sign In
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/auth?mode=signup">
                          <Button className="w-full gradient-primary">
                            Get Started
                          </Button>
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
