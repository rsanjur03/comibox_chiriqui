import { useState } from 'react';
import OfficialForm from './OfficialForm';
import OfficialTable from './OfficialTable';
import type { OfficialData } from './OfficialForm';

export default function OfficialManager() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [editingOfficial, setEditingOfficial] = useState<OfficialData | null>(null);

    const handleOfficialSaved = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleEdit = (official: OfficialData) => {
        setEditingOfficial(official);
        // Scroll al formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingOfficial(null);
    };

    return (
        <>
            <OfficialForm 
                onOfficialSaved={handleOfficialSaved}
                editingOfficial={editingOfficial}
                onCancelEdit={handleCancelEdit}
            />
            <OfficialTable 
                refreshTrigger={refreshTrigger}
                onEdit={handleEdit}
            />
        </>
    );
}
