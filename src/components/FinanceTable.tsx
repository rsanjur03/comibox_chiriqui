import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FinanceData } from './FinanceForm';

interface FinanceTableProps {
    refreshTrigger: number;
    onEdit: (finance: FinanceData) => void;
}

export default function FinanceTable({ refreshTrigger, onEdit }: FinanceTableProps) {
    const [finanzas, setFinanzas] = useState<FinanceData[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarFinanzas = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'finanzas'), orderBy('eventoNombre', 'desc'));
            const snapshot = await getDocs(q);
            
            const finanzasData: FinanceData[] = [];
            snapshot.forEach((doc) => {
                finanzasData.push({ id: doc.id, ...doc.data() } as FinanceData);
            });
            
            setFinanzas(finanzasData);
        } catch (error) {
            console.error('Error al cargar finanzas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarFinanzas();
    }, [refreshTrigger]);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Está seguro de que desea eliminar este registro financiero?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'finanzas', id));
            cargarFinanzas();
        } catch (error) {
            console.error('Error al eliminar finanza:', error);
            alert('Error al eliminar el registro');
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-white">Lista de Registros Financieros</h3>
                <div className="text-center py-8 text-gray-400">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">Lista de Registros Financieros</h3>
            
            {finanzas.length === 0 ? (
                <p className="text-gray-400">No hay registros financieros.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="py-3 px-6">Evento</th>
                                <th scope="col" className="py-3 px-6">Cobro ($)</th>
                                <th scope="col" className="py-3 px-6">Pagos ($)</th>
                                <th scope="col" className="py-3 px-6">Ganancia ($)</th>
                                <th scope="col" className="py-3 px-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {finanzas.map((fin) => {
                                const eventoNombreCorto = fin.eventoNombre.split(' - ')[1] || fin.eventoNombre;
                                const totalPagos = fin.montoArbitros + fin.montoDoctores;
                                
                                return (
                                    <tr 
                                        key={fin.id} 
                                        className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700"
                                    >
                                        <td className="py-4 px-6 font-medium text-gray-200">
                                            {eventoNombreCorto}
                                        </td>
                                        <td className="py-4 px-6 text-green-400">
                                            ${fin.montoOrganizador.toFixed(2)}
                                        </td>
                                        <td className="py-4 px-6 text-red-400">
                                            ${totalPagos.toFixed(2)}
                                        </td>
                                        <td className={`py-4 px-6 font-medium ${fin.gananciaComision >= 0 ? 'text-white' : 'text-red-500'}`}>
                                            ${fin.gananciaComision.toFixed(2)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => onEdit(fin)}
                                                className="font-medium text-blue-400 hover:underline mr-4"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(fin.id!)}
                                                className="font-medium text-red-400 hover:underline"
                                            >
                                                Borrar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-900">
                            <tr>
                                <td className="py-4 px-6 font-bold text-white">TOTALES</td>
                                <td className="py-4 px-6 font-bold text-green-400">
                                    ${finanzas.reduce((sum, f) => sum + f.montoOrganizador, 0).toFixed(2)}
                                </td>
                                <td className="py-4 px-6 font-bold text-red-400">
                                    ${finanzas.reduce((sum, f) => sum + f.montoArbitros + f.montoDoctores, 0).toFixed(2)}
                                </td>
                                <td className="py-4 px-6 font-bold text-white">
                                    ${finanzas.reduce((sum, f) => sum + f.gananciaComision, 0).toFixed(2)}
                                </td>
                                <td className="py-4 px-6"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
