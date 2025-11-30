import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export interface OfficialData {
    id?: string;
    nombre: string;
    tipo: string;
    cedula: string;
    celular: string;
    fechaNacimiento: string;
    sexo: string;
    tipoSangre: string;
    direccion: string;
    inicioEn: string;
    carnet: boolean;
    fotoUrl: string;
}

interface OfficialFormProps {
    onOfficialSaved: () => void;
    editingOfficial: OfficialData | null;
    onCancelEdit: () => void;
}

const PLACEHOLDER_FOTO = 'https://via.placeholder.com/150';

export default function OfficialForm({ onOfficialSaved, editingOfficial, onCancelEdit }: OfficialFormProps) {
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(PLACEHOLDER_FOTO);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Omit<OfficialData, 'id'>>({
        nombre: '',
        tipo: '',
        cedula: '',
        celular: '',
        fechaNacimiento: '',
        sexo: 'Masculino',
        tipoSangre: '',
        direccion: '',
        inicioEn: '',
        carnet: false,
        fotoUrl: ''
    });

    useEffect(() => {
        if (editingOfficial) {
            setFormData({
                nombre: editingOfficial.nombre,
                tipo: editingOfficial.tipo,
                cedula: editingOfficial.cedula,
                celular: editingOfficial.celular,
                fechaNacimiento: editingOfficial.fechaNacimiento,
                sexo: editingOfficial.sexo,
                tipoSangre: editingOfficial.tipoSangre,
                direccion: editingOfficial.direccion,
                inicioEn: editingOfficial.inicioEn,
                carnet: editingOfficial.carnet,
                fotoUrl: editingOfficial.fotoUrl
            });
            setPreviewUrl(editingOfficial.fotoUrl || PLACEHOLDER_FOTO);
        }
    }, [editingOfficial]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreviewUrl(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.nombre || !formData.tipo) {
            alert('Nombre y Tipo son obligatorios.');
            return;
        }

        setLoading(true);

        try {
            let fotoUrl = formData.fotoUrl;
            const file = fileInputRef.current?.files?.[0];

            // Si se seleccionó un archivo nuevo, subirlo
            if (file) {
                const storageRef = ref(storage, `fotos_oficiales/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                fotoUrl = await getDownloadURL(snapshot.ref);
            }

            const oficialData = {
                ...formData,
                fotoUrl
            };

            if (editingOfficial?.id) {
                // Actualizar
                const docRef = doc(db, 'oficiales', editingOfficial.id);
                await updateDoc(docRef, oficialData);
                alert('Oficial actualizado exitosamente');
            } else {
                // Crear nuevo
                await addDoc(collection(db, 'oficiales'), oficialData);
                alert('Oficial registrado exitosamente');
            }

            handleCancel();
            onOfficialSaved();
        } catch (error) {
            console.error('Error al guardar oficial:', error);
            alert('Error al guardar el oficial');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            nombre: '',
            tipo: '',
            cedula: '',
            celular: '',
            fechaNacimiento: '',
            sexo: 'Masculino',
            tipoSangre: '',
            direccion: '',
            inicioEn: '',
            carnet: false,
            fotoUrl: ''
        });
        setPreviewUrl(PLACEHOLDER_FOTO);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onCancelEdit();
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">
                {editingOfficial ? 'Editar Oficial' : 'Registrar Oficial'} (Juez/Árbitro)
            </h2>

            <form onSubmit={handleSubmit}>
                {/* Foto */}
                <div className="mb-4 text-center">
                    <img
                        src={previewUrl}
                        alt="Vista previa de la foto"
                        className="w-32 h-32 rounded-full mx-auto mb-2 object-cover"
                    />
                    <label htmlFor="foto-oficial" className="text-blue-400 hover:text-blue-300 cursor-pointer">
                        Seleccionar Foto
                    </label>
                    <input
                        ref={fileInputRef}
                        className="hidden"
                        id="foto-oficial"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Nombre, Cédula, Celular */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="nombre-oficial">
                            Nombre Completo
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="nombre-oficial"
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="cedula-oficial">
                            Cédula
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="cedula-oficial"
                            type="text"
                            value={formData.cedula}
                            onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="celular-oficial">
                            Celular
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="celular-oficial"
                            type="tel"
                            value={formData.celular}
                            onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                        />
                    </div>
                </div>

                {/* Tipo, Fecha Nacimiento, Sexo, Tipo Sangre */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="tipo-oficial">
                            Tipo / Rol
                        </label>
                        <select
                            id="tipo-oficial"
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            required
                        >
                            <option value="">-- Seleccione Rol --</option>
                            <option value="Comisionado">Comisionado</option>
                            <option value="Médico">Médico</option>
                            <option value="Juez">Juez (Solamente)</option>
                            <option value="Arbitro">Árbitro (Solamente)</option>
                            <option value="Tiempo">Juez de Tiempo (Solamente)</option>
                            <option value="Juez y Arbitro">Juez y Árbitro</option>
                            <option value="Juez y Tiempo">Juez y Juez de Tiempo</option>
                            <option value="Arbitro y Tiempo">Árbitro y Juez de Tiempo</option>
                            <option value="Juez, Arbitro y Tiempo">Juez, Árbitro y Juez de Tiempo</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="fecha-nacimiento">
                            Fecha de Nacimiento
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="fecha-nacimiento"
                            type="date"
                            value={formData.fechaNacimiento}
                            onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="sexo-oficial">
                            Sexo
                        </label>
                        <select
                            id="sexo-oficial"
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            value={formData.sexo}
                            onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                        >
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="tipo-sangre">
                            Tipo de Sangre
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="tipo-sangre"
                            type="text"
                            placeholder="Ej: A+"
                            value={formData.tipoSangre}
                            onChange={(e) => setFormData({ ...formData, tipoSangre: e.target.value })}
                        />
                    </div>
                </div>

                {/* Dirección, Inicio, Carnet */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="direccion-oficial">
                            Dirección
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="direccion-oficial"
                            type="text"
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="inicio-oficial">
                            Año de Inicio
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="inicio-oficial"
                            type="number"
                            placeholder="Ej: 2008"
                            value={formData.inicioEn}
                            onChange={(e) => setFormData({ ...formData, inicioEn: e.target.value })}
                        />
                    </div>
                    <div className="flex items-end pb-2">
                        <label className="flex items-center text-gray-300">
                            <input
                                className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-blue-600"
                                type="checkbox"
                                id="carnet-oficial"
                                checked={formData.carnet}
                                onChange={(e) => setFormData({ ...formData, carnet: e.target.checked })}
                            />
                            <span className="ml-2">Tiene Carnet Vigente</span>
                        </label>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : editingOfficial ? 'Actualizar Cambios' : 'Guardar Oficial'}
                    </button>
                    {editingOfficial && (
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
