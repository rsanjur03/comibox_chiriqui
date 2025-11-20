import { useState } from 'react';
import EventForm from './EventForm';
import EventsTable from './EventsTable';
import EventEditModal from './EventEditModal';

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
}

export default function EventsManager() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEventCreated = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleEventUpdated = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleEdit = (evento: Evento) => {
        setSelectedEvento(evento);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEvento(null);
    };

    return (
        <>
            <EventForm onEventCreated={handleEventCreated} />
            <EventsTable 
                refreshTrigger={refreshTrigger} 
                onEdit={handleEdit}
            />
            <EventEditModal
                evento={selectedEvento}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onEventUpdated={handleEventUpdated}
            />
        </>
    );
}
