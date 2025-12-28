import SettingsHeader from '@/components/settings/SettingsHeader';

type Props = {
    title: string;
    description?: string;
    learnMoreHref?: string;
    learnMoreLabel?: string;
    backHref?: string;
    backLabel?: string;
    children: React.ReactNode;
};

export default function SettingsPage({
    title,
    description,
    learnMoreHref,
    learnMoreLabel = 'Learn more',
    backHref,
    backLabel,
    children
}: Props) {
    return (
        <div className="settings-page-v2">
            <SettingsHeader
                title={title}
                description={description}
                learnMoreHref={learnMoreHref}
                learnMoreLabel={learnMoreLabel}
                backHref={backHref}
                backLabel={backLabel}
            />
            <div className="settings-page-content">
                {children}
            </div>
        </div>
    );
}
