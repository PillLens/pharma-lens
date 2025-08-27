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
  User
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
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Pill className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">PharmaLens</h2>
              <p className="text-xs text-muted-foreground">Medical Assistant</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
            <Pill className="w-4 h-4 text-primary-foreground" />
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