'use client';

import TemplateSelector from './TemplateSelector';
import CreateIncidentForm from './CreateIncidentForm';

type Service = {
    id: string;
    name: string;
};

type User = {
    id: string;
    name: string;
    email: string;
};

type Template = {
    id: string;
    name: string;
    title: string;
    descriptionText?: string | null;
    defaultUrgency: 'HIGH' | 'LOW';
    defaultPriority?: string | null;
    defaultService?: { id: string; name: string } | null;
};

type TemplateFormWrapperProps = {
    templates: Template[];
    services: Service[];
    users: User[];
    selectedTemplateId: string | null;
};

export default function TemplateFormWrapper({
    templates,
    services,
    users,
    selectedTemplateId
}: TemplateFormWrapperProps) {
    // Get the current template from URL params (managed by TemplateSelector)
    const currentTemplate = selectedTemplateId ? templates.find(t => t.id === selectedTemplateId) || null : null;

    return (
        <>
            <TemplateSelector templates={templates} />
            <CreateIncidentForm
                services={services}
                users={users}
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                selectedTemplate={currentTemplate}
            />
        </>
    );
}
