import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy as firestoreOrderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import WeighInForm from './WeighInForm';
import WeighInTable from './WeighInTable';

interface Evento {
    id: string;
    nombre: string;
    fecha: string;
}

interface Fight {
    id: string;
    boxeadorA_Nombre: string;
    boxeadorB_Nombre: string;
    orden: number;
}

export default function WeighInManager() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [selectedEventoId, setSelectedEventoId] = useState<string>('');
    const [fights, setFights] = useState<Fight[]>([]);
    const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        cargarEventos();
    }, []);

    useEffect(() => {
        if (selectedEventoId) {
            cargarPeleasDropdown(selectedEventoId);
        } else {
            setFights([]);
            setSelectedFightId(null);
        }
    }, [selectedEventoId]);

    const cargarEventos = async () => {
        try {
            const q = query(collection(db, 'eventos'), firestoreOrderBy('fecha', 'desc'));
            const snapshot = await getDocs(q);
            const eventosData: Evento[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                eventosData.push({
                    id: doc.id,
                    nombre: data.nombre,
                    fecha: data.fecha
                });
            });
            setEventos(eventosData);
        } catch (error) {
            console.error('Error al cargar eventos:', error);
        }
    };

    const cargarPeleasDropdown = async (eventoId: string) => {
        try {
            const q = query(
                collection(db, 'peleas'),
                where('eventoId', '==', eventoId),
                firestoreOrderBy('orden', 'asc')
            );
            const snapshot = await getDocs(q);
            
            const fightsData: Fight[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                fightsData.push({
                    id: doc.id,
                    boxeadorA_Nombre: data.boxeadorA_Nombre,
                    boxeadorB_Nombre: data.boxeadorB_Nombre,
                    orden: data.orden
                });
            });
            
            setFights(fightsData);
        } catch (error) {
            console.error('Error al cargar peleas:', error);
        }
    };

    const handleWeighInSaved = () => {
        setRefreshTrigger(prev => prev + 1);
        setSelectedFightId(null);
    };

    const handleCancel = () => {
        setSelectedFightId(null);
    };

    const handleEditFight = (fightId: string) => {
        setSelectedFightId(fightId);
        // Scroll al formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">Registro de Pesaje Oficial</h2>
            
            {/* Selector de Evento */}
            <div className="bg-gray-800 mb-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="flex-grow">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="select-evento-pesaje">
                            1. Seleccione un Evento
                        </label>
                        <select
                            id="select-evento-pesaje"
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            value={selectedEventoId}
                            onChange={(e) => setSelectedEventoId(e.target.value)}
                        >
                            <option value="">-- Seleccione evento --</option>
                            {eventos.map((evento) => (
                                <option key={evento.id} value={evento.id}>
                                    {evento.fecha} - {evento.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-shrink-0">
                        <a
                            href={`/admin/reportes/pesaje?id=${selectedEventoId}`}
                            rel="noopener noreferrer"
                            className={`w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${!selectedEventoId ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={(e) => {
                                if (!selectedEventoId) e.preventDefault();
                            }}
                        >
                            Generar Reporte (PDF)
                        </a>
                    </div>
                </div>
            </div>

            <hr className="my-6 border-gray-700" />

            {/* Selector de Pelea */}
            <h3 className="text-xl font-semibold mb-4 text-white">2. Registrar Pesaje para una Pelea</h3>
            <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="select-pelea-pesaje">
                    Seleccione la Pelea a Registrar/Editar
                </label>
                <select
                    id="select-pelea-pesaje"
                    className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                    value={selectedFightId || ''}
                    onChange={(e) => setSelectedFightId(e.target.value || null)}
                    disabled={!selectedEventoId}
                >
                    <option value="">
                        {selectedEventoId ? '-- Seleccione una pelea --' : '-- Primero seleccione un evento --'}
                    </option>
                    {fights.map((fight) => (
                        <option key={fight.id} value={fight.id}>
                            Pelea #{fight.orden}: {fight.boxeadorA_Nombre.split(' (')[0]} vs {fight.boxeadorB_Nombre.split(' (')[0]}
                        </option>
                    ))}
                </select>
            </div>

            {/* Formulario de Pesaje */}
            {selectedFightId && (
                <WeighInForm
                    fightId={selectedFightId}
                    onWeighInSaved={handleWeighInSaved}
                    onCancel={handleCancel}
                />
            )}

            <hr className="my-6 border-gray-700" />

            {/* Tabla de Pesajes */}
            <WeighInTable
                eventoId={selectedEventoId}
                refreshTrigger={refreshTrigger}
                onEditFight={handleEditFight}
            />
        </div>
    );
}
