import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { validarPeso } from '../utils/weighInRules';

export interface WeighInData {
    id: string;
    boxeadorA_Nombre: string;
    boxeadorB_Nombre: string;
    pesoPactado: string;
    categoria: string;
    boxeadorA_Peso: number;
    boxeadorB_Peso: number;
    notasPesaje: string;
    fotoCaraACaraURL?: string;
}

interface WeighInFormProps {
    fightId: string | null;
    onWeighInSaved: () => void;
    onCancel: () => void;
}

export default function WeighInForm({ fightId, onWeighInSaved, onCancel }: WeighInFormProps) {
    const [loading, setLoading] = useState(false);
    const [fightData, setFightData] = useState<WeighInData | null>(null);
    const [pesoA, setPesoA] = useState<number>(0);
    const [pesoB, setPesoB] = useState<number>(0);
    const [notas, setNotas] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (fightId) {
            cargarPelea();
        }
    }, [fightId]);

    const cargarPelea = async () => {
        if (!fightId) return;
        
        try {
            const docRef = doc(db, 'peleas', fightId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data() as WeighInData;
                setFightData({ ...data, id: fightId });
                setPesoA(data.boxeadorA_Peso || 0);
                setPesoB(data.boxeadorB_Peso || 0);
                setNotas(data.notasPesaje || '');
                setPreviewUrl(data.fotoCaraACaraURL || '');
            }
        } catch (error) {
            console.error('Error al cargar pelea:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreviewUrl(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeletePhoto = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) return;
        if (!fightId) return;

        try {
            const docRef = doc(db, 'peleas', fightId);
            const docSnap = await getDoc(docRef);
            const data = docSnap.data();
            
            if (data?.fotoCaraACaraURL) {
                const imageRef = ref(storage, data.fotoCaraACaraURL);
                await deleteObject(imageRef);
            }
            
            await updateDoc(docRef, { fotoCaraACaraURL: null });
            setPreviewUrl('');
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            alert('Foto eliminada correctamente.');
            onWeighInSaved();
        } catch (error) {
            console.error('Error al eliminar la foto:', error);
            alert('Hubo un error al eliminar la foto.');
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!fightId || !fightData) return;

        // Validación final
        const validacionA = validarPeso(pesoA, fightData.pesoPactado);
        const validacionB = validarPeso(pesoB, fightData.pesoPactado);
        
        if (validacionA.status === 'FALLO' || validacionB.status === 'FALLO') {
            if (!confirm('ADVERTENCIA: Uno o ambos boxeadores están fuera del límite de tolerancia. ¿Desea guardar el registro de todas formas?')) {
                return;
            }
        }

        setLoading(true);

        try {
            let fotoCaraACaraURL = previewUrl;

            // Subir nueva foto si se seleccionó
            if (selectedFile) {
                const storageRef = ref(storage, `cara_a_cara/${fightId}_${selectedFile.name}`);
                const uploadTask = await uploadBytes(storageRef, selectedFile);
                fotoCaraACaraURL = await getDownloadURL(uploadTask.ref);
            }

            const dataToUpdate = {
                boxeadorA_Peso: pesoA,
                boxeadorB_Peso: pesoB,
                notasPesaje: notas,
                fotoCaraACaraURL: fotoCaraACaraURL || null
            };

            const docRef = doc(db, 'peleas', fightId);
            await updateDoc(docRef, dataToUpdate);

            alert('Pesaje guardado exitosamente');
            onWeighInSaved();
            handleCancel();
        } catch (error) {
            console.error('Error al guardar pesaje:', error);
            alert('Error al guardar el pesaje');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setPesoA(0);
        setPesoB(0);
        setNotas('');
        setPreviewUrl('');
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onCancel();
    };

    if (!fightId || !fightData) {
        return null;
    }

    const validacionA = validarPeso(pesoA, fightData.pesoPactado);
    const validacionB = validarPeso(pesoB, fightData.pesoPactado);
    const nombreA = fightData.boxeadorA_Nombre.split(' (')[0];
    const nombreB = fightData.boxeadorB_Nombre.split(' (')[0];

    return (
        <form onSubmit={handleSubmit} className="bg-gray-700 p-4 rounded-lg space-y-3">
            <h4 className="text-lg font-bold text-white">
                Editando: {nombreA} vs {nombreB}
            </h4>
            
            {/* Datos de referencia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Peso Pactado (Referencia)
                    </label>
                    <input
                        type="text"
                        value={fightData.pesoPactado || 'N/A'}
                        className="shadow appearance-none border border-gray-600 bg-gray-600 rounded w-full py-2 px-3 text-white cursor-not-allowed opacity-70"
                        readOnly
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Categoría (Referencia)
                    </label>
                    <input
                        type="text"
                        value={fightData.categoria || 'N/A'}
                        className="shadow appearance-none border border-gray-600 bg-gray-600 rounded w-full py-2 px-3 text-white cursor-not-allowed opacity-70"
                        readOnly
                    />
                </div>
            </div>
            
            {/* Pesos oficiales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-red-400 mb-1">
                        Peso Oficial ({nombreA})
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        value={pesoA || ''}
                        onChange={(e) => setPesoA(parseFloat(e.target.value) || 0)}
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                        placeholder="Ej: 146.8"
                    />
                    <p className={`text-xs mt-1 font-semibold ${validacionA.color}`}>
                        {validacionA.message}
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-blue-400 mb-1">
                        Peso Oficial ({nombreB})
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        value={pesoB || ''}
                        onChange={(e) => setPesoB(parseFloat(e.target.value) || 0)}
                        className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                        placeholder="Ej: 147.0"
                    />
                    <p className={`text-xs mt-1 font-semibold ${validacionB.color}`}>
                        {validacionB.message}
                    </p>
                </div>
            </div>
            
            {/* Notas */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Notas de Pesaje (Acuerdos, etc.)
                </label>
                <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                    rows={2}
                    placeholder="Ej: Boxeador A no dio el peso, se acordó multa del 20%."
                />
            </div>
            
            {/* Foto Cara a Cara */}
            <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">
                    Foto "Cara a Cara" (Opcional)
                </label>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                />
                {previewUrl && (
                    <div className="mt-2">
                        <p className="text-gray-400 text-sm mb-1">Imagen actual:</p>
                        <img
                            src={previewUrl}
                            alt="Cara a Cara"
                            className="max-w-xs h-auto rounded-lg border border-gray-600"
                        />
                        <button
                            type="button"
                            onClick={handleDeletePhoto}
                            className="mt-2 bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
                        >
                            Eliminar Foto
                        </button>
                    </div>
                )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Guardando...' : 'Guardar Pesaje'}
                </button>
            </div>
        </form>
    );
}
