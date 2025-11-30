import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Evento {
    id: string;
    nombre: string;
    fecha: string;
}

interface FinanceFormProps {
    onFinanceSaved: () => void;
    editingFinance: FinanceData | null;
    onCancelEdit: () => void;
}

export interface FinanceData {
    id?: string;
    eventoId: string;
    eventoNombre: string;
    montoOrganizador: number;
    montoArbitros: number;
    montoDoctores: number;
    gananciaComision: number;
    notas: string;
}

export default function FinanceForm({ onFinanceSaved, editingFinance, onCancelEdit }: FinanceFormProps) {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        eventoId: '',
        montoOrganizador: 0,
        montoArbitros: 0,
        montoDoctores: 0,
        notas: ''
    });

    useEffect(() => {
        cargarEventos();
    }, []);

    useEffect(() => {
        if (editingFinance) {
            setFormData({
                eventoId: editingFinance.eventoId,
                montoOrganizador: editingFinance.montoOrganizador,
                montoArbitros: editingFinance.montoArbitros,
                montoDoctores: editingFinance.montoDoctores,
                notas: editingFinance.notas
            });
        }
    }, [editingFinance]);

    const cargarEventos = async () => {
        try {
            const q = query(collection(db, 'eventos'), orderBy('fecha', 'desc'));
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!formData.eventoId) {
            alert('Por favor, seleccione un evento.');
            return;
        }

        setLoading(true);

        try {
            const eventoSeleccionado = eventos.find(ev => ev.id === formData.eventoId);
            const eventoTexto = eventoSeleccionado 
                ? `${eventoSeleccionado.fecha} - ${eventoSeleccionado.nombre}`
                : '';

            const finanzasData = {
                eventoId: formData.eventoId,
                eventoNombre: eventoTexto,
                montoOrganizador: formData.montoOrganizador,
                montoArbitros: formData.montoArbitros,
                montoDoctores: formData.montoDoctores,
                gananciaComision: formData.montoOrganizador - (formData.montoArbitros + formData.montoDoctores),
                notas: formData.notas
            };

            if (editingFinance?.id) {
                // Actualizar
                const docRef = doc(db, 'finanzas', editingFinance.id);
                await updateDoc(docRef, finanzasData);
                alert('Finanzas actualizadas exitosamente');
            } else {
                // Crear nuevo
                await addDoc(collection(db, 'finanzas'), {
                    ...finanzasData,
                    fechaRegistro: new Date()
                });
                alert('Finanzas registradas exitosamente');
            }

            // Reset form
            setFormData({
                eventoId: '',
                montoOrganizador: 0,
                montoArbitros: 0,
                montoDoctores: 0,
                notas: ''
            });
            onCancelEdit();
            onFinanceSaved();
        } catch (error) {
            console.error('Error al guardar finanzas:', error);
            alert('Error al guardar las finanzas');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            eventoId: '',
            montoOrganizador: 0,
            montoArbitros: 0,
            montoDoctores: 0,
            notas: ''
        });
        onCancelEdit();
    };

    const gananciaCalculada = formData.montoOrganizador - (formData.montoArbitros + formData.montoDoctores);

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">
                {editingFinance ? 'Editar Finanzas' : 'Registrar Finanzas'}
            </h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="evento-finanzas">
                        Seleccionar Evento
                    </label>
                    <select
                        id="evento-finanzas"
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                        value={formData.eventoId}
                        onChange={(e) => setFormData({ ...formData, eventoId: e.target.value })}
                        required
                    >
                        <option value="">-- Seleccione evento --</option>
                        {eventos.map((evento) => (
                            <option key={evento.id} value={evento.id}>
                                {evento.fecha} - {evento.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="monto-organizador">
                            Cobro del Organizador ($)
                        </label>
                        <input
                            type="number"
                            id="monto-organizador"
                            step="0.01"
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            value={formData.montoOrganizador}
                            onChange={(e) => setFormData({ ...formData, montoOrganizador: parseFloat(e.target.value) || 0 })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="monto-arbitros">
                            Pago a Árbitros ($)
                        </label>
                        <input
                            type="number"
                            id="monto-arbitros"
                            step="0.01"
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            value={formData.montoArbitros}
                            onChange={(e) => setFormData({ ...formData, montoArbitros: parseFloat(e.target.value) || 0 })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="monto-doctores">
                            Pago a Doctores ($)
                        </label>
                        <input
                            type="number"
                            id="monto-doctores"
                            step="0.01"
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            value={formData.montoDoctores}
                            onChange={(e) => setFormData({ ...formData, montoDoctores: parseFloat(e.target.value) || 0 })}
                            required
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                        Ganancia de la Comisión (Calculado)
                    </label>
                    <div className={`shadow border border-gray-600 bg-gray-900 rounded w-full py-2 px-3 text-xl font-bold ${gananciaCalculada >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${gananciaCalculada.toFixed(2)}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="notas-finanzas">
                        Notas (Opcional)
                    </label>
                    <textarea
                        id="notas-finanzas"
                        rows={3}
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                        value={formData.notas}
                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                        placeholder="Observaciones adicionales..."
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : editingFinance ? 'Actualizar Cambios' : 'Guardar Finanzas'}
                    </button>
                    {editingFinance && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
                        >
                            Cancelar Edición
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
