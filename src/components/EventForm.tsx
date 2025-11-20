import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface EventFormProps {
    onEventCreated: () => void;
}

export default function EventForm({ onEventCreated }: EventFormProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const eventoData = {
                nombre: formData.get('nombre') as string,
                fecha: formData.get('fecha') as string,
                hora: formData.get('hora') as string,
                lugar: formData.get('lugar') as string,
                ciudad: formData.get('ciudad') as string,
                provincia: formData.get('provincia') as string,
                promotor: formData.get('promotor') as string,
                fechaPesaje: formData.get('fechaPesaje') as string || '',
                horaPesaje: formData.get('horaPesaje') as string || '',
                lugarPesaje: formData.get('lugarPesaje') as string || '',
                timestamp: new Date()
            };

            await addDoc(collection(db, 'eventos'), eventoData);
            form.reset();
            onEventCreated();
            alert('Evento creado exitosamente');
        } catch (error) {
            console.error('Error al guardar evento:', error);
            alert('Error al guardar el evento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Crear Nuevo Evento</h2>
            <form onSubmit={handleSubmit} className="flex flex-wrap -mx-3">
                <div className="w-full px-3 mb-6">
                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="evento-nombre">
                        Nombre del Evento (Función)
                    </label>
                    <input 
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                        id="evento-nombre" 
                        name="nombre"
                        type="text" 
                        placeholder="Ej: Guerra en la Frontera" 
                        required 
                    />
                </div>

                <div className="w-full md:w-1/3 px-3 mb-6">
                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="evento-fecha">
                        Fecha del Evento
                    </label>
                    <input 
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                        id="evento-fecha" 
                        name="fecha"
                        type="date" 
                        required 
                    />
                </div>

                <div className="w-full md:w-1/3 px-3 mb-6">
                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="evento-hora">
                        Hora del Evento
                    </label>
                    <input 
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                        id="evento-hora" 
                        name="hora"
                        type="time" 
                        required 
                    />
                </div>

                <div className="w-full md:w-1/3 px-3 mb-6">
                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="evento-promotor">
                        Promotor
                    </label>
                    <input 
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                        id="evento-promotor" 
                        name="promotor"
                        type="text" 
                        placeholder="Ej: Sanjur Promotions" 
                        required 
                    />
                </div>

                <div className="w-full md:w-1/3 px-3 mb-6">
                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="evento-lugar">
                        Lugar/Arena del Evento
                    </label>
                    <input 
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                        id="evento-lugar" 
                        name="lugar"
                        type="text" 
                        placeholder="Ej: Gimnasio Municipal" 
                        required 
                    />
                </div>

                <div className="w-full md:w-1/3 px-3 mb-6">
                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="evento-ciudad">
                        Ciudad
                    </label>
                    <input 
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                        id="evento-ciudad" 
                        name="ciudad"
                        type="text" 
                        placeholder="Ej: David" 
                        required 
                    />
                </div>

                <div className="w-full md:w-1/3 px-3 mb-6">
                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="evento-provincia">
                        Provincia
                    </label>
                    <input 
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                        id="evento-provincia" 
                        name="provincia"
                        type="text" 
                        defaultValue="Chiriquí" 
                        required 
                    />
                </div>

                <div className="w-full border-t border-gray-700 my-4"></div>
                <h3 className="w-full text-lg font-semibold text-blue-300 px-3 mb-4">Datos del Pesaje (Opcional)</h3>

                <div className="w-full md:w-1/3 px-3 mb-6">
                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="evento-fecha-pesaje">
                        Fecha del Pesaje
                    </label>
                    <input 
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                        id="evento-fecha-pesaje" 
                        name="fechaPesaje"
                        type="date" 
                    />
                </div>

                <div className="w-full md:w-1/3 px-3 mb-6">
                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="evento-hora-pesaje">
                        Hora del Pesaje
                    </label>
                    <input 
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                        id="evento-hora-pesaje" 
                        name="horaPesaje"
                        type="time" 
                    />
                </div>

                <div className="w-full md:w-1/3 px-3 mb-6">
                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="evento-lugar-pesaje">
                        Lugar del Pesaje
                    </label>
                    <input 
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white" 
                        id="evento-lugar-pesaje" 
                        name="lugarPesaje"
                        type="text" 
                        placeholder="Ej: Restaurante El Fogón" 
                    />
                </div>

                <div className="w-full px-3 mt-2">
                    <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50" 
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar Evento'}
                    </button>
                </div>
            </form>
        </div>
    );
}
