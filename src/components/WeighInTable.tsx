import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Fight {
    id: string;
    boxeadorA_Nombre: string;
    boxeadorB_Nombre: string;
    pesoPactado: string;
    boxeadorA_Peso: number;
    boxeadorB_Peso: number;
    orden: number;
}

interface WeighInTableProps {
    eventoId: string | null;
    refreshTrigger: number;
    onEditFight: (fightId: string) => void;
}

export default function WeighInTable({ eventoId, refreshTrigger, onEditFight }: WeighInTableProps) {
    const [fights, setFights] = useState<Fight[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (eventoId) {
            cargarPeleas();
        } else {
            setFights([]);
        }
    }, [eventoId, refreshTrigger]);

    const cargarPeleas = async () => {
        if (!eventoId) return;
        
        setLoading(true);
        try {
            const q = query(
                collection(db, 'peleas'),
                where('eventoId', '==', eventoId),
                firestoreOrderBy('orden', 'asc')
            );
            const snapshot = await getDocs(q);
            
            const fightsData: Fight[] = [];
            snapshot.forEach((doc) => {
                fightsData.push({ id: doc.id, ...doc.data() } as Fight);
            });
            
            setFights(fightsData);
        } catch (error) {
            console.error('Error al cargar peleas:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!eventoId) {
        return (
            <div>
                <h3 className="text-xl font-semibold mb-4 text-white">3. Pesajes Registrados para este Evento</h3>
                <p className="text-gray-400">Seleccione un evento para ver la lista de peleas.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div>
                <h3 className="text-xl font-semibold mb-4 text-white">3. Pesajes Registrados para este Evento</h3>
                <p className="text-gray-400">Cargando...</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-white">3. Pesajes Registrados para este Evento</h3>
            
            {fights.length === 0 ? (
                <p className="text-gray-400">No hay peleas registradas para este evento.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="py-3 px-6">Pelea</th>
                                <th scope="col" className="py-3 px-6">Pactado</th>
                                <th scope="col" className="py-3 px-6">Peso A</th>
                                <th scope="col" className="py-3 px-6">Peso B</th>
                                <th scope="col" className="py-3 px-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fights.map((fight) => {
                                const nombreA = fight.boxeadorA_Nombre.split(' (')[0];
                                const nombreB = fight.boxeadorB_Nombre.split(' (')[0];
                                const pesoA = fight.boxeadorA_Peso ? `${fight.boxeadorA_Peso} lbs` : '--';
                                const pesoB = fight.boxeadorB_Peso ? `${fight.boxeadorB_Peso} lbs` : '--';
                                
                                return (
                                    <tr 
                                        key={fight.id} 
                                        className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700"
                                    >
                                        <td className="py-4 px-6 font-medium text-white">
                                            {nombreA} vs {nombreB}
                                        </td>
                                        <td className="py-4 px-6">{fight.pesoPactado || 'N/A'}</td>
                                        <td className="py-4 px-6 text-red-400">{pesoA}</td>
                                        <td className="py-4 px-6 text-blue-400">{pesoB}</td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => onEditFight(fight.id)}
                                                className="font-medium text-blue-400 hover:underline"
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
