import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

interface EventsTableProps {
    refreshTrigger: number;
    onEdit: (evento: Evento) => void;
}

export default function EventsTable({ refreshTrigger, onEdit }: EventsTableProps) {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarEventos = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'eventos'), orderBy('fecha', 'desc'));
            const snapshot = await getDocs(q);

            const eventosData: Evento[] = [];
            snapshot.forEach((doc) => {
                eventosData.push({ id: doc.id, ...doc.data() } as Evento);
            });

            setEventos(eventosData);
        } catch (error) {
            console.error('Error al cargar eventos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarEventos();
    }, [refreshTrigger]);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Está seguro de que desea eliminar este evento? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'eventos', id));
            cargarEventos();
        } catch (error) {
            console.error('Error al eliminar evento:', error);
            alert('Error al eliminar el evento');
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Eventos Existentes</h2>
                <div className="text-center py-8 text-gray-400">Cargando eventos...</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Eventos Existentes</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-100 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="py-3 px-6">Flyer</th>
                            <th scope="col" className="py-3 px-6">Fecha</th>
                            <th scope="col" className="py-3 px-6">Nombre</th>
                            <th scope="col" className="py-3 px-6">Lugar</th>
                            <th scope="col" className="py-3 px-6">Promotor</th>
                            <th scope="col" className="py-3 px-6">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {eventos.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-4 px-6 text-center">
                                    No hay eventos registrados.
                                </td>
                            </tr>
                        ) : (
                            eventos.map((evento) => (
                                <tr
                                    key={evento.id}
                                    className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700"
                                >
                                    <td className="py-4 px-6">
                                        {evento.flyerUrl ? (
                                            <img src={evento.flyerUrl} alt={evento.nombre} className="w-16 h-16 object-cover rounded" />
                                        ) : (
                                            <span className="text-gray-500 text-xs">Sin foto</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 font-medium">{evento.fecha}</td>
                                    <td className="py-4 px-6">{evento.nombre}</td>
                                    <td className="py-4 px-6">{evento.lugar}, {evento.ciudad}</td>
                                    <td className="py-4 px-6">{evento.promotor}</td>
                                    <td className="py-4 px-6">
                                        <button
                                            onClick={() => onEdit(evento)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(evento.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs ml-2"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
