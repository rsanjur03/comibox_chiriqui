import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
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
}

interface EventEditModalProps {
    evento: Evento | null;
    isOpen: boolean;
    onClose: () => void;
    onEventUpdated: () => void;
}

export default function EventEditModal({ evento, isOpen, onClose, onEventUpdated }: EventEditModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Evento | null>(null);

    useEffect(() => {
        if (evento) {
            setFormData(evento);
        }
    }, [evento]);

    if (!isOpen || !formData) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const eventoRef = doc(db, 'eventos', formData.id);
            const { id, ...datosActualizados } = formData;
            
            await updateDoc(eventoRef, datosActualizados);
            onEventUpdated();
            onClose();
            alert('Evento actualizado exitosamente');
        } catch (error) {
            console.error('Error al actualizar evento:', error);
            alert('Error al actualizar el evento');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: value } : null);
    };

    return (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div 
                    className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity" 
                    aria-hidden="true"
                    onClick={onClose}
                ></div>
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-bottom bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-gray-700">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <h3 className="text-xl leading-6 font-medium text-white mb-4" id="modal-title">
                                Editar Evento
                            </h3>
                            
                            <div className="flex flex-wrap -mx-3">
                                <div className="w-full px-3 mb-6">
                                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="edit-nombre">
                                        Nombre del Evento
                                    </label>
                                    <input 
                                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                                        id="edit-nombre" 
                                        name="nombre"
                                        type="text" 
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>

                                <div className="w-full md:w-1/3 px-3 mb-6">
                                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="edit-fecha">
                                        Fecha del Evento
                                    </label>
                                    <input 
                                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                                        id="edit-fecha" 
                                        name="fecha"
                                        type="date" 
                                        value={formData.fecha}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>

                                <div className="w-full md:w-1/3 px-3 mb-6">
                                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="edit-hora">
                                        Hora del Evento
                                    </label>
                                    <input 
                                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                                        id="edit-hora" 
                                        name="hora"
                                        type="time" 
                                        value={formData.hora}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>

                                <div className="w-full md:w-1/3 px-3 mb-6">
                                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="edit-promotor">
                                        Promotor
                                    </label>
                                    <input 
                                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                                        id="edit-promotor" 
                                        name="promotor"
                                        type="text" 
                                        value={formData.promotor}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>

                                <div className="w-full md:w-1/3 px-3 mb-6">
                                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="edit-lugar">
                                        Lugar/Arena
                                    </label>
                                    <input 
                                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                                        id="edit-lugar" 
                                        name="lugar"
                                        type="text" 
                                        value={formData.lugar}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>

                                <div className="w-full md:w-1/3 px-3 mb-6">
                                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="edit-ciudad">
                                        Ciudad
                                    </label>
                                    <input 
                                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                                        id="edit-ciudad" 
                                        name="ciudad"
                                        type="text" 
                                        value={formData.ciudad}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>

                                <div className="w-full md:w-1/3 px-3 mb-6">
                                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="edit-provincia">
                                        Provincia
                                    </label>
                                    <input 
                                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                                        id="edit-provincia" 
                                        name="provincia"
                                        type="text" 
                                        value={formData.provincia}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>

                                <div className="w-full border-t border-gray-700 my-4"></div>
                                <h3 className="w-full text-lg font-semibold text-blue-300 px-3 mb-4">
                                    Datos del Pesaje (Opcional)
                                </h3>

                                <div className="w-full md:w-1/3 px-3 mb-6">
                                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="edit-fechaPesaje">
                                        Fecha del Pesaje
                                    </label>
                                    <input 
                                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                                        id="edit-fechaPesaje" 
                                        name="fechaPesaje"
                                        type="date" 
                                        value={formData.fechaPesaje || ''}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="w-full md:w-1/3 px-3 mb-6">
                                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="edit-horaPesaje">
                                        Hora del Pesaje
                                    </label>
                                    <input 
                                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                                        id="edit-horaPesaje" 
                                        name="horaPesaje"
                                        type="time" 
                                        value={formData.horaPesaje || ''}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="w-full md:w-1/3 px-3 mb-6">
                                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="edit-lugarPesaje">
                                        Lugar del Pesaje
                                    </label>
                                    <input 
                                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                                        id="edit-lugarPesaje" 
                                        name="lugarPesaje"
                                        type="text" 
                                        value={formData.lugarPesaje || ''}
                                        onChange={handleChange}
                                        placeholder="Ej: Restaurante El Fogón"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button 
                                type="submit" 
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Actualizando...' : 'Actualizar Evento'}
                            </button>
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
