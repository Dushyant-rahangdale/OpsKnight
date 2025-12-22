'use client';

import { useSearchParams } from 'next/navigation';
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
    const searchParams = useSearchParams();
    const paramTemplateId = searchParams.get('template');
    const activeTemplateId = paramTemplateId || selectedTemplateId;
    const currentTemplate = activeTemplateId ? templates.find(t => t.id === activeTemplateId) || null : null;

    return (
        <>
            <TemplateSelector
                templates={templates}
                selectedTemplateId={activeTemplateId}
                selectedTemplate={currentTemplate}
            />
            <CreateIncidentForm
                services={services}
                users={users}
                templates={templates}
                selectedTemplateId={activeTemplateId}
                selectedTemplate={currentTemplate}
            />
        </>
    );
}
