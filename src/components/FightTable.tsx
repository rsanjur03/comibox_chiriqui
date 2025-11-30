import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FightData } from './FightForm';

interface FightTableProps {
    refreshTrigger: number;
    onEdit: (fight: FightData) => void;
}

export default function FightTable({ refreshTrigger, onEdit }: FightTableProps) {
    const [peleas, setPeleas] = useState<FightData[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarPeleas = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'peleas'), 
                firestoreOrderBy('eventoNombre', 'desc'), 
                firestoreOrderBy('orden', 'asc')
            );
            const snapshot = await getDocs(q);
            
            const peleasData: FightData[] = [];
            snapshot.forEach((doc) => {
                peleasData.push({ id: doc.id, ...doc.data() } as FightData);
            });
            
            setPeleas(peleasData);
        } catch (error) {
            console.error('Error al cargar peleas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarPeleas();
    }, [refreshTrigger]);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Está seguro de que desea eliminar esta pelea?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'peleas', id));
            cargarPeleas();
        } catch (error) {
            console.error('Error al eliminar pelea:', error);
            alert('Error al eliminar la pelea');
        }
    };

    const formatResultado = (pelea: FightData): React.ReactElement => {
        let resultado = pelea.resultado_ganador;
        
        if (resultado === 'PENDIENTE') {
            return <span className="text-yellow-400">PENDIENTE</span>;
        }
        
        if (resultado === 'EMPATE') {
            return <span className="text-gray-400">EMPATE (Draw)</span>;
        }
        
        if (resultado === 'NC') {
            return <span className="text-gray-400">No Contest (NC)</span>;
        }
        
        // Ganador A o B
        const ganador = resultado === 'A' ? 'Boxeador A' : 'Boxeador B';
        const metodo = pelea.resultado_metodo ? pelea.resultado_metodo.toUpperCase() : '';
        const round = pelea.resultado_round || '?';
        
        let resultadoTexto = `Gana ${ganador} (${pelea.resultado_metodo} R${round})`;
        
        // Mostrar scores si es decisión
        if ((metodo === 'UD' || metodo === 'MD' || metodo === 'SD') && 
            (pelea.juez1_scoreA || pelea.juez1_scoreB)) {
            const score1 = `${pelea.juez1_scoreA || '?'}-${pelea.juez1_scoreB || '?'}`;
            const score2 = `${pelea.juez2_scoreA || '?'}-${pelea.juez2_scoreB || '?'}`;
            const score3 = `${pelea.juez3_scoreA || '?'}-${pelea.juez3_scoreB || '?'}`;
            
            return (
                <div>
                    <div className="text-green-400">{resultadoTexto}</div>
                    <div className="text-xs text-gray-400 mt-1">[{score1}, {score2}, {score3}]</div>
                </div>
            );
        }
        
        return <span className="text-green-400">{resultadoTexto}</span>;
    };

    if (loading) {
        return (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-white">Lista de Peleas Registradas</h3>
                <div className="text-center py-8 text-gray-400">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">Lista de Peleas Registradas</h3>
            
            {peleas.length === 0 ? (
                <p className="text-gray-400">No hay peleas registradas.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="py-3 px-6">Evento</th>
                                <th scope="col" className="py-3 px-6">Pelea</th>
                                <th scope="col" className="py-3 px-6">Resultado</th>
                                <th scope="col" className="py-3 px-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {peleas.map((pelea) => {
                                const eventoNombreCorto = pelea.eventoNombre.split(' - ')[1] || pelea.eventoNombre;
                                const boxeadorANombre = pelea.boxeadorA_Nombre.split(' (')[0];
                                const boxeadorBNombre = pelea.boxeadorB_Nombre.split(' (')[0];
                                
                                return (
                                    <tr 
                                        key={pelea.id} 
                                        className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700"
                                    >
                                        <td className="py-4 px-6 font-medium text-gray-200">
                                            {eventoNombreCorto}
                                        </td>
                                        <td className="py-4 px-6 font-medium text-white">
                                            {boxeadorANombre} vs {boxeadorBNombre}
                                        </td>
                                        <td className="py-4 px-6">
                                            {formatResultado(pelea)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => onEdit(pelea)}
                                                className="font-medium text-blue-400 hover:underline mr-4"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(pelea.id!)}
                                                className="font-medium text-red-400 hover:underline"
                                            >
                                                Borrar
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
