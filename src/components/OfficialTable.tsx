import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { OfficialData } from './OfficialForm';

interface OfficialTableProps {
    refreshTrigger: number;
    onEdit: (official: OfficialData) => void;
}

const PLACEHOLDER_FOTO = 'https://via.placeholder.com/150';

export default function OfficialTable({ refreshTrigger, onEdit }: OfficialTableProps) {
    const [oficiales, setOficiales] = useState<OfficialData[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarOficiales = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'oficiales'), orderBy('nombre', 'asc'));
            const snapshot = await getDocs(q);
            
            const oficialesData: OfficialData[] = [];
            snapshot.forEach((doc) => {
                oficialesData.push({ id: doc.id, ...doc.data() } as OfficialData);
            });
            
            setOficiales(oficialesData);
        } catch (error) {
            console.error('Error al cargar oficiales:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarOficiales();
    }, [refreshTrigger]);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Está seguro de que desea borrar este oficial?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'oficiales', id));
            cargarOficiales();
        } catch (error) {
            console.error('Error al eliminar oficial:', error);
            alert('Error al eliminar el oficial');
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-white">Lista de Oficiales Registrados</h3>
                <div className="text-center py-8 text-gray-400">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">Lista de Oficiales Registrados</h3>
            
            {oficiales.length === 0 ? (
                <p className="text-gray-400">No hay oficiales registrados.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="py-3 px-6">Foto</th>
                                <th scope="col" className="py-3 px-6">Nombre</th>
                                <th scope="col" className="py-3 px-6">Tipo</th>
                                <th scope="col" className="py-3 px-6">Cédula</th>
                                <th scope="col" className="py-3 px-6">Celular</th>
                                <th scope="col" className="py-3 px-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {oficiales.map((oficial) => (
                                <tr 
                                    key={oficial.id} 
                                    className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700"
                                >
                                    <td className="py-4 px-6">
                                        <img 
                                            src={oficial.fotoUrl || PLACEHOLDER_FOTO} 
                                            alt={oficial.nombre}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    </td>
                                    <td className="py-4 px-6 font-medium text-white">
                                        {oficial.nombre}
                                    </td>
                                    <td className="py-4 px-6">{oficial.tipo}</td>
                                    <td className="py-4 px-6">{oficial.cedula}</td>
                                    <td className="py-4 px-6">{oficial.celular}</td>
                                    <td className="py-4 px-6">
                                        <button
                                            onClick={() => onEdit(oficial)}
                                            className="font-medium text-blue-400 hover:underline mr-4"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(oficial.id!)}
                                            className="font-medium text-red-400 hover:underline"
                                        >
                                            Borrar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
