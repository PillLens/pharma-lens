import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Pill, 
  Bell, 
  LayoutDashboard, 
  Users, 
  History, 
  Settings, 
  Shield,
  LogOut,
  User,
  FileText
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { TranslatedText } from '@/components/TranslatedText';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    icon: Home,
    labelKey: 'navigation.home',
    href: '/',
    category: 'main'
  },
  {
    icon: LayoutDashboard,
    labelKey: 'navigation.dashboard',
    href: '/dashboard',
    category: 'main'
  },
  {
    icon: Pill,
    labelKey: 'navigation.medications',
    href: '/medications',
    category: 'medical'
  },
  {
    icon: Bell,
    labelKey: 'navigation.reminders',
    href: '/reminders',
    category: 'medical'
  },
  {
    icon: Users,
    labelKey: 'navigation.family',
    href: '/family',
    category: 'medical'
  },
  {
    icon: History,
    labelKey: 'navigation.history',
    href: '/history',
    category: 'other'
  },
  {
    icon: Shield,
    labelKey: 'navigation.security',
    href: '/security',
    category: 'other'
  },
  {
    icon: Settings,
    labelKey: 'navigation.settings',
    href: '/settings',
    category: 'other'
  },
];

const legalItems = [
  {
    icon: Shield,
    labelKey: 'Privacy Policy',
    href: '/privacy-policy',
    category: 'legal'
  },
  {
    icon: FileText,
    labelKey: 'Terms of Service',
    href: '/terms-of-service',
    category: 'legal'
  },
];

export function DesktopSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavClasses = (path: string) => cn(
    "w-full justify-start",
    isActive(path) 
      ? "bg-primary text-primary-foreground shadow-sm" 
      : "hover:bg-accent hover:text-accent-foreground"
  );

  const mainItems = navigationItems.filter(item => item.category === 'main');
  const medicalItems = navigationItems.filter(item => item.category === 'medical');
  const otherItems = navigationItems.filter(item => item.category === 'other');

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className={isCollapsed ? "w-14" : "w-64"}>
      <SidebarHeader className="p-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/17a150fa-03fc-4034-b5d2-287f4b29588f.png" 
                alt="PillLens Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-foreground text-lg">PillLens</h2>
              <p className="text-xs text-muted-foreground">Smart Medication Assistant</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/8df43217-1e50-414e-ac87-3543963dc9ab.png" 
              alt="PillLens Logo" 
              className="w-10 h-10 object-contain"
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{!isCollapsed ? 'Main' : ''}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.href} className={getNavClasses(item.href)}>
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <TranslatedText translationKey={item.labelKey} />}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{!isCollapsed ? 'Medical' : ''}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {medicalItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.href} className={getNavClasses(item.href)}>
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <TranslatedText translationKey={item.labelKey} />}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{!isCollapsed ? 'Other' : ''}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.href} className={getNavClasses(item.href)}>
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <TranslatedText translationKey={item.labelKey} />}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{!isCollapsed ? 'Legal' : ''}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {legalItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.href} className={getNavClasses(item.href)}>
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span className="text-sm">{item.labelKey}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!isCollapsed && user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.user_metadata?.display_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
        {isCollapsed && user && (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={signOut}
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}