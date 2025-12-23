import { getUserPermissions } from '@/lib/rbac';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsIcon from '@/components/settings/SettingsIcon';
import Link from 'next/link';

export default async function SettingsOverviewPage() {
    const permissions = await getUserPermissions();
    
    return (
        <div className="settings-overview">
            <SettingsSection
                title="Account Settings"
                description="Personalize your account, preferences, and security settings."
            >
                <div className="settings-cards-grid">
                    <Link href="/settings/profile" className="settings-card-modern">
                        <div className="settings-card-icon">
                            <SettingsIcon name="profile" />
                        </div>
                        <div className="settings-card-content">
                            <h3>Profile</h3>
                            <p>Review identity details and workspace role</p>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="settings-card-arrow">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </Link>
                    
                    <Link href="/settings/preferences" className="settings-card-modern">
                        <div className="settings-card-icon">
                            <SettingsIcon name="preferences" />
                        </div>
                        <div className="settings-card-content">
                            <h3>Preferences</h3>
                            <p>Timezone, notification defaults, and display options</p>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="settings-card-arrow">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </Link>
                    
                    <Link href="/settings/security" className="settings-card-modern">
                        <div className="settings-card-icon">
                            <SettingsIcon name="security" />
                        </div>
                        <div className="settings-card-content">
                            <h3>Security</h3>
                            <p>Password, active sessions, and SSO status</p>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="settings-card-arrow">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </Link>
                    
                    <Link href="/settings/api-keys" className="settings-card-modern">
                        <div className="settings-card-icon">
                            <SettingsIcon name="api-keys" />
                        </div>
                        <div className="settings-card-content">
                            <h3>API Keys</h3>
                            <p>Create and rotate integration credentials</p>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="settings-card-arrow">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </Link>
                </div>
            </SettingsSection>

            <SettingsSection
                title="System Settings"
                description="Configure system-wide settings and notification providers. Admin access required."
            >
                <div className="settings-cards-grid">
                    {permissions.isAdmin ? (
                        <>
                            <Link href="/settings/system" className="settings-card-modern">
                                <div className="settings-card-icon">
                                    <SettingsIcon name="system" />
                                </div>
                                <div className="settings-card-content">
                                    <h3>Notification Providers</h3>
                                    <p>Configure Twilio, Email, and Push notification providers</p>
                                </div>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="settings-card-arrow">
                                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </Link>
                            <Link href="/settings/status-page" className="settings-card-modern">
                                <div className="settings-card-icon">
                                    <SettingsIcon name="status-page" />
                                </div>
                                <div className="settings-card-content">
                                    <h3>Status Page</h3>
                                    <p>Customize your public status page</p>
                                </div>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="settings-card-arrow">
                                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="settings-card-modern settings-card-disabled">
                                <div className="settings-card-icon" style={{ opacity: 0.5 }}>
                                    <SettingsIcon name="system" />
                                </div>
                                <div className="settings-card-content">
                                    <h3>Notification Providers</h3>
                                    <p>Configure Twilio, Email, and Push notification providers</p>
                                    <div className="settings-card-warning">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM8 12C7.44772 12 7 11.5523 7 11C7 10.4477 7.44772 10 8 10C8.55228 10 9 10.4477 9 11C9 11.5523 8.55228 12 8 12ZM9 8C9 8.55228 8.55228 9 8 9C7.44772 9 7 8.55228 7 8C7 6.34315 8.65685 5 8 5C7.34315 5 6 6.34315 6 8H7C7 7.44772 7.44772 7 8 7C8.55228 7 9 7.44772 9 8V8Z" fill="currentColor"/>
                                        </svg>
                                        <span>Admin role required</span>
                                    </div>
                                </div>
                            </div>
                            <div className="settings-card-modern settings-card-disabled">
                                <div className="settings-card-icon" style={{ opacity: 0.5 }}>
                                    <SettingsIcon name="status-page" />
                                </div>
                                <div className="settings-card-content">
                                    <h3>Status Page</h3>
                                    <p>Customize your public status page</p>
                                    <div className="settings-card-warning">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM8 12C7.44772 12 7 11.5523 7 11C7 10.4477 7.44772 10 8 10C8.55228 10 9 10.4477 9 11C9 11.5523 8.55228 12 8 12ZM9 8C9 8.55228 8.55228 9 8 9C7.44772 9 7 8.55228 7 8C7 6.34315 8.65685 5 8 5C7.34315 5 6 6.34315 6 8H7C7 7.44772 7.44772 7 8 7C8.55228 7 9 7.44772 9 8V8Z" fill="currentColor"/>
                                        </svg>
                                        <span>Admin role required</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </SettingsSection>
        </div>
    );
}
