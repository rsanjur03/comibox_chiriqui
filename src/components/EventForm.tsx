import { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

interface Evento {
    id?: string;
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

interface EventFormProps {
    onEventCreated: () => void;
    initialData?: Evento | null;
    onCancel?: () => void;
}

export default function EventForm({ onEventCreated, initialData, onCancel }: EventFormProps) {
    const [loading, setLoading] = useState(false);
    const [key, setKey] = useState(0); // Para forzar re-render al cancelar/resetear

    // Si cambia initialData, reseteamos el formulario (esto se maneja mejor con el key en el padre, pero por si acaso)
    useEffect(() => {
        setKey(prev => prev + 1);
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const eventoData: any = {
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

            const flyerFile = formData.get('flyer') as File;
            if (flyerFile && flyerFile.size > 0) {
                const storageRef = ref(storage, `event-flyers/${Date.now()}_${flyerFile.name}`);
                const snapshot = await uploadBytes(storageRef, flyerFile);
                const downloadURL = await getDownloadURL(snapshot.ref);
                eventoData.flyerUrl = downloadURL;
            } else if (initialData?.flyerUrl) {
                // Mantener la URL existente si no se sube una nueva
                eventoData.flyerUrl = initialData.flyerUrl;
            } else {
                eventoData.flyerUrl = '';
            }

            if (initialData && initialData.id) {
                // Modo Edición
                const eventoRef = doc(db, 'eventos', initialData.id);
                await updateDoc(eventoRef, eventoData);
                alert('Evento actualizado exitosamente');
            } else {
                // Modo Creación
                await addDoc(collection(db, 'eventos'), eventoData);
                alert('Evento creado exitosamente');
            }

            form.reset();
            onEventCreated();
        } catch (error: any) {
            console.error('Error al guardar evento:', error);
            alert(`Error al guardar el evento: ${error.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
                {initialData ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </h2>
            <form key={key} onSubmit={handleSubmit} className="flex flex-wrap -mx-3">
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
                        defaultValue={initialData?.nombre}
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
                        defaultValue={initialData?.fecha}
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
                        defaultValue={initialData?.hora}
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
                        defaultValue={initialData?.promotor}
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
                        defaultValue={initialData?.lugar}
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
                        defaultValue={initialData?.ciudad}
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
                        defaultValue={initialData?.provincia || "Chiriquí"}
                        required
                    />
                </div>

                <div className="w-full md:w-1/3 px-3 mb-6">
                    <label className="block uppercase tracking-wide text-gray-400 text-xs font-bold mb-2" htmlFor="evento-flyer">
                        Flyer/Foto del Evento
                    </label>
                    {initialData?.flyerUrl && (
                        <div className="mb-2">
                            <img src={initialData.flyerUrl} alt="Flyer actual" className="h-20 w-auto rounded" />
                            <p className="text-xs text-gray-400 mt-1">Flyer actual</p>
                        </div>
                    )}
                    <input
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                        id="evento-flyer"
                        name="flyer"
                        type="file"
                        accept="image/*"
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
                        defaultValue={initialData?.fechaPesaje}
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
                        defaultValue={initialData?.horaPesaje}
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
                        defaultValue={initialData?.lugarPesaje}
                    />
                </div>

                <div className="w-full px-3 mt-2 flex gap-2">
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : (initialData ? 'Actualizar Evento' : 'Guardar Evento')}
                    </button>

                    {initialData && onCancel && (
                        <button
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancelar Edición
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
