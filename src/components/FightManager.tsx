import { useState } from 'react';
import FightForm from './FightForm';
import FightTable from './FightTable';
import type { FightData } from './FightForm';

export default function FightManager() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [editingFight, setEditingFight] = useState<FightData | null>(null);

    const handleFightSaved = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleEdit = (fight: FightData) => {
        setEditingFight(fight);
        // Scroll al formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingFight(null);
    };

    return (
        <>
            <FightForm 
                onFightSaved={handleFightSaved}
                editingFight={editingFight}
                onCancelEdit={handleCancelEdit}
            />
            <FightTable 
                refreshTrigger={refreshTrigger}
                onEdit={handleEdit}
            />
        </>
    );
}
