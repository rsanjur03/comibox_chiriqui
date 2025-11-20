import { useState } from 'react';
import FinanceForm from './FinanceForm';
import FinanceTable from './FinanceTable';
import type { FinanceData } from './FinanceForm';

export default function FinanceManager() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [editingFinance, setEditingFinance] = useState<FinanceData | null>(null);

    const handleFinanceSaved = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleEdit = (finance: FinanceData) => {
        setEditingFinance(finance);
        // Scroll al formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingFinance(null);
    };

    return (
        <>
            <FinanceForm 
                onFinanceSaved={handleFinanceSaved}
                editingFinance={editingFinance}
                onCancelEdit={handleCancelEdit}
            />
            <FinanceTable 
                refreshTrigger={refreshTrigger}
                onEdit={handleEdit}
            />
        </>
    );
}
