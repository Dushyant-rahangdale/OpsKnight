'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
    href: string;
    label: string;
    description: string;
    icon?: React.ReactNode;
    adminOnly?: boolean;
    disabled?: boolean;
};

type Props = {
    isAdmin?: boolean;
};

const AccountIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 9C11.4853 9 13.5 6.98528 13.5 4.5C13.5 2.01472 11.4853 0 9 0C6.51472 0 4.5 2.01472 4.5 4.5C4.5 6.98528 6.51472 9 9 9Z" fill="currentColor" fillOpacity="0.6"/>
        <path d="M0 15.75C0 12.6434 2.64338 10.125 5.625 10.125H12.375C15.3566 10.125 18 12.6434 18 15.75V18H0V15.75Z" fill="currentColor" fillOpacity="0.6"/>
    </svg>
);

const PreferencesIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 10.5C10.2426 10.5 11.25 9.49264 11.25 8.25C11.25 7.00736 10.2426 6 9 6C7.75736 6 6.75 7.00736 6.75 8.25C6.75 9.49264 7.75736 10.5 9 10.5Z" fill="currentColor" fillOpacity="0.6"/>
        <path d="M15.75 8.25C15.75 8.25 13.5 6.75 9 6.75C4.5 6.75 2.25 8.25 2.25 8.25C2.25 8.25 4.5 9.75 9 9.75C13.5 9.75 15.75 8.25 15.75 8.25Z" fill="currentColor" fillOpacity="0.6"/>
        <path d="M9 12C9 12 6.75 13.5 2.25 13.5V15.75C2.25 15.75 4.5 14.25 9 14.25C13.5 14.25 15.75 15.75 15.75 15.75V13.5C11.25 13.5 9 12 9 12Z" fill="currentColor" fillOpacity="0.6"/>
    </svg>
);

const SecurityIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 0L2 4.5V9C2 13.5 5.25 17.25 9 18C12.75 17.25 16 13.5 16 9V4.5L9 0Z" fill="currentColor" fillOpacity="0.6"/>
    </svg>
);

const ApiKeyIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M13.5 6C13.5 8.48528 11.4853 10.5 9 10.5C6.51472 10.5 4.5 8.48528 4.5 6C4.5 3.51472 6.51472 1.5 9 1.5C11.4853 1.5 13.5 3.51472 13.5 6Z" fill="currentColor" fillOpacity="0.6"/>
        <path d="M9 13.5C12.3137 13.5 15 10.8137 15 7.5H3C3 10.8137 5.68629 13.5 9 13.5Z" fill="currentColor" fillOpacity="0.6"/>
    </svg>
);

const SystemIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 0L0 4.5V9C0 13.5 4.5 18 9 18C13.5 18 18 13.5 18 9V4.5L9 0Z" fill="currentColor" fillOpacity="0.6"/>
        <path d="M9 6C10.6569 6 12 7.34315 12 9C12 10.6569 10.6569 12 9 12C7.34315 12 6 10.6569 6 9C6 7.34315 7.34315 6 9 6Z" fill="currentColor"/>
    </svg>
);

export default function SettingsNav({ isAdmin = false }: Props) {
    const pathname = usePathname();

    const accountSettings: NavItem[] = [
        { 
            href: '/settings/profile', 
            label: 'Profile', 
            description: 'Personal information',
            icon: <AccountIcon />
        },
        { 
            href: '/settings/preferences', 
            label: 'Preferences', 
            description: 'Notifications & timezone',
            icon: <PreferencesIcon />
        },
        { 
            href: '/settings/security', 
            label: 'Security', 
            description: 'Password & sessions',
            icon: <SecurityIcon />
        },
        { 
            href: '/settings/api-keys', 
            label: 'API Keys', 
            description: 'Access tokens',
            icon: <ApiKeyIcon />
        }
    ];

    const systemSettings: NavItem[] = [
        { 
            href: '/settings/system', 
            label: 'Notification Providers', 
            description: 'Twilio, Email, Push',
            icon: <SystemIcon />,
            adminOnly: true,
            disabled: !isAdmin
        }
    ];

    const renderNavItem = (item: NavItem) => {
        const active = pathname === item.href;
        const isDisabled = item.disabled;

        if (isDisabled) {
            return (
                <div
                    key={item.href}
                    className="settings-nav-item settings-nav-item-disabled"
                    title="Admin role required"
                >
                    <div className="settings-nav-item-icon" style={{ opacity: 0.4 }}>
                        {item.icon}
                    </div>
                    <div className="settings-nav-item-content">
                        <div className="settings-nav-item-label">{item.label}</div>
                        <div className="settings-nav-item-desc">{item.description}</div>
                    </div>
                    <span className="settings-nav-item-badge">Admin</span>
                </div>
            );
        }

        return (
            <Link
                key={item.href}
                href={item.href}
                className={`settings-nav-item ${active ? 'settings-nav-item-active' : ''}`}
            >
                <div className="settings-nav-item-icon">
                    {item.icon}
                </div>
                <div className="settings-nav-item-content">
                    <div className="settings-nav-item-label">{item.label}</div>
                    <div className="settings-nav-item-desc">{item.description}</div>
                </div>
            </Link>
        );
    };

    return (
        <nav className="settings-nav-new">
            <div className="settings-nav-group">
                <div className="settings-nav-group-header">Account</div>
                <div className="settings-nav-group-items">
                    {accountSettings.map(renderNavItem)}
                </div>
            </div>

            <div className="settings-nav-group">
                <div className="settings-nav-group-header">
                    <span>System</span>
                    {!isAdmin && (
                        <span className="settings-nav-group-badge">Admin Only</span>
                    )}
                </div>
                <div className="settings-nav-group-items">
                    {systemSettings.map(renderNavItem)}
                </div>
            </div>
        </nav>
    );
}
