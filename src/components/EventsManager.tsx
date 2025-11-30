import { useState } from 'react';
import EventForm from './EventForm';
import EventsTable from './EventsTable';

interface Evento {
    id: string;
    nombre: string;
    fecha: string;
    hora: string;
    lugar: string;
    ciudad: string;
    provincia: string;
    promotor: string;
    fechaPesaje?: string;
    horaPesaje?: string;
    lugarPesaje?: string;
    flyerUrl?: string;
}

export default function EventsManager() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);

    const handleEventSubmitted = () => {
        setRefreshTrigger(prev => prev + 1);
        setSelectedEvento(null); // Clear selected event after submission
    };

    const handleEdit = (evento: Evento) => {
        setSelectedEvento(evento);
        // Scroll to top to see the form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setSelectedEvento(null);
    };

    return (
        <>
            <EventForm
                onEventCreated={handleEventSubmitted}
                initialData={selectedEvento}
                onCancel={handleCancelEdit}
            />
            <EventsTable
                refreshTrigger={refreshTrigger}
                onEdit={handleEdit}
            />
        </>
    );
}
