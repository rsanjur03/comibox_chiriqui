import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, getDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getCategoriaPorPeso, extractPesoFromString } from '../utils/weightCategories';

export interface FightData {
    id?: string;
    eventoId: string;
    eventoNombre: string;
    orden: number;
    boxeadorA_Id: string;
    boxeadorA_Nombre: string;
    boxeadorB_Id: string;
    boxeadorB_Nombre: string;
    roundsPactados: number;
    categoria: string;
    pesoPactado: string;
    resultado_ganador: string;
    resultado_metodo: string;
    resultado_round: number;
    juez1_scoreA: number;
    juez1_scoreB: number;
    juez2_scoreA: number;
    juez2_scoreB: number;
    juez3_scoreA: number;
    juez3_scoreB: number;
    juez1_id?: string;
    juez2_id?: string;
    juez3_id?: string;
    arbitro_id?: string;
    tiempo_id?: string;
}

interface FightFormProps {
    onFightSaved: () => void;
    editingFight: FightData | null;
    onCancelEdit: () => void;
}

interface Evento {
    id: string;
    nombre: string;
    fecha: string;
}

interface Boxeador {
    id: string;
    cedula?: string;
    nombreLegal?: string;
    nombreBoxistico?: string;
    nombre: string;
    victorias: number;
    derrotas: number;
    empates: number;
}

// Caché de oficiales
const oficialesCache = new Map<string, string>();

async function getNombreOficial(id: string): Promise<string | null> {
    if (!id) return null;
    if (oficialesCache.has(id)) {
        return oficialesCache.get(id)!;
    }

    try {
        const docRef = doc(db, 'oficiales', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const nombre = docSnap.data().nombre;
            oficialesCache.set(id, nombre);
            return nombre;
        }
        return null;
    } catch (error) {
        console.error('Error al obtener nombre de oficial:', error);
        return null;
    }
}

export default function FightForm({ onFightSaved, editingFight, onCancelEdit }: FightFormProps) {
    const [loading, setLoading] = useState(false);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [boxeadores, setBoxeadores] = useState<Boxeador[]>([]);
    const [juezNombres, setJuezNombres] = useState({ juez1: 'Juez 1', juez2: 'Juez 2', juez3: 'Juez 3' });

    const [formData, setFormData] = useState<Omit<FightData, 'id'>>({
        eventoId: '',
        eventoNombre: '',
        orden: 1,
        boxeadorA_Id: '',
        boxeadorA_Nombre: '',
        boxeadorB_Id: '',
        boxeadorB_Nombre: '',
        roundsPactados: 6,
        categoria: '',
        pesoPactado: '',
        resultado_ganador: 'PENDIENTE',
        resultado_metodo: '',
        resultado_round: 0,
        juez1_scoreA: 0,
        juez1_scoreB: 0,
        juez2_scoreA: 0,
        juez2_scoreB: 0,
        juez3_scoreA: 0,
        juez3_scoreB: 0
    });

    useEffect(() => {
        cargarEventos();
        cargarBoxeadores();
    }, []);

    useEffect(() => {
        if (editingFight) {
            setFormData({
                eventoId: editingFight.eventoId,
                eventoNombre: editingFight.eventoNombre,
                orden: editingFight.orden,
                boxeadorA_Id: editingFight.boxeadorA_Id,
                boxeadorA_Nombre: editingFight.boxeadorA_Nombre,
                boxeadorB_Id: editingFight.boxeadorB_Id,
                boxeadorB_Nombre: editingFight.boxeadorB_Nombre,
                roundsPactados: editingFight.roundsPactados,
                categoria: editingFight.categoria,
                pesoPactado: editingFight.pesoPactado,
                resultado_ganador: editingFight.resultado_ganador,
                resultado_metodo: editingFight.resultado_metodo,
                resultado_round: editingFight.resultado_round,
                juez1_scoreA: editingFight.juez1_scoreA,
                juez1_scoreB: editingFight.juez1_scoreB,
                juez2_scoreA: editingFight.juez2_scoreA,
                juez2_scoreB: editingFight.juez2_scoreB,
                juez3_scoreA: editingFight.juez3_scoreA,
                juez3_scoreB: editingFight.juez3_scoreB
            });

            // Cargar nombres de jueces
            if (editingFight.juez1_id) {
                getNombreOficial(editingFight.juez1_id).then(nombre => {
                    if (nombre) setJuezNombres(prev => ({ ...prev, juez1: nombre }));
                });
            }
            if (editingFight.juez2_id) {
                getNombreOficial(editingFight.juez2_id).then(nombre => {
                    if (nombre) setJuezNombres(prev => ({ ...prev, juez2: nombre }));
                });
            }
            if (editingFight.juez3_id) {
                getNombreOficial(editingFight.juez3_id).then(nombre => {
                    if (nombre) setJuezNombres(prev => ({ ...prev, juez3: nombre }));
                });
            }
        }
    }, [editingFight]);

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

    const cargarBoxeadores = async () => {
        try {
            const q = query(collection(db, 'boxeadores'), orderBy('nombreBoxistico', 'asc'));
            const snapshot = await getDocs(q);
            const boxeadoresData: Boxeador[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                boxeadoresData.push({
                    id: doc.id,
                    cedula: data.cedula,
                    nombreLegal: data.nombreLegal,
                    nombreBoxistico: data.nombreBoxistico,
                    nombre: data.nombreBoxistico || data.nombre,
                    victorias: data.victorias || 0,
                    derrotas: data.derrotas || 0,
                    empates: data.empates || 0
                });
            });
            setBoxeadores(boxeadoresData);
        } catch (error) {
            console.error('Error al cargar boxeadores:', error);
        }
    };

    const handlePesoChange = (value: string) => {
        setFormData({ ...formData, pesoPactado: value });
        const peso = extractPesoFromString(value);
        if (peso) {
            setFormData(prev => ({ ...prev, pesoPactado: value, categoria: getCategoriaPorPeso(peso) }));
        }
    };

    const getNombreBoxeador = (boxeadorId: string, tipo: 'A' | 'B'): string => {
        const boxeador = boxeadores.find(b => b.id === boxeadorId);
        if (!boxeador) return tipo === 'A' ? 'Boxeador A (Rojo)' : 'Boxeador B (Azul)';
        return (boxeador.nombreBoxistico || boxeador.nombre).split(' (')[0];
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.eventoId) {
            alert('Por favor, seleccione un evento.');
            return;
        }
        if (!formData.boxeadorA_Id) {
            alert('Por favor, seleccione al Boxeador A.');
            return;
        }
        if (!formData.boxeadorB_Id) {
            alert('Por favor, seleccione al Boxeador B.');
            return;
        }
        if (formData.boxeadorA_Id === formData.boxeadorB_Id) {
            alert('Un boxeador no puede pelear consigo mismo.');
            return;
        }

        setLoading(true);

        try {
            const eventoSeleccionado = eventos.find(ev => ev.id === formData.eventoId);
            const boxeadorA = boxeadores.find(b => b.id === formData.boxeadorA_Id);
            const boxeadorB = boxeadores.find(b => b.id === formData.boxeadorB_Id);

            const eventoTexto = eventoSeleccionado
                ? `${eventoSeleccionado.fecha} - ${eventoSeleccionado.nombre}`
                : '';
            const boxeadorATexto = boxeadorA
                ? `${boxeadorA.nombre} (${boxeadorA.victorias}-${boxeadorA.derrotas}-${boxeadorA.empates})`
                : '';
            const boxeadorBTexto = boxeadorB
                ? `${boxeadorB.nombre} (${boxeadorB.victorias}-${boxeadorB.derrotas}-${boxeadorB.empates})`
                : '';

            const fightData = {
                ...formData,
                eventoNombre: eventoTexto,
                boxeadorA_Nombre: boxeadorATexto,
                boxeadorB_Nombre: boxeadorBTexto
            };

            if (editingFight?.id) {
                // Actualizar
                const docRef = doc(db, 'peleas', editingFight.id);
                await updateDoc(docRef, fightData);
                alert('Pelea actualizada exitosamente');
            } else {
                // Crear nueva
                await addDoc(collection(db, 'peleas'), {
                    ...fightData,
                    fechaRegistro: new Date(),
                    boxeadorA_Peso: 0,
                    boxeadorB_Peso: 0,
                    notasPesaje: '',
                    juez1_id: '',
                    juez2_id: '',
                    juez3_id: '',
                    arbitro_id: '',
                    tiempo_id: ''
                });
                alert('Pelea registrada exitosamente');
            }

            handleCancel();
            onFightSaved();
        } catch (error) {
            console.error('Error al guardar pelea:', error);
            alert('Error al guardar la pelea');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            eventoId: '',
            eventoNombre: '',
            orden: 1,
            boxeadorA_Id: '',
            boxeadorA_Nombre: '',
            boxeadorB_Id: '',
            boxeadorB_Nombre: '',
            roundsPactados: 6,
            categoria: '',
            pesoPactado: '',
            resultado_ganador: 'PENDIENTE',
            resultado_metodo: '',
            resultado_round: 0,
            juez1_scoreA: 0,
            juez1_scoreB: 0,
            juez2_scoreA: 0,
            juez2_scoreB: 0,
            juez3_scoreA: 0,
            juez3_scoreB: 0
        });
        setJuezNombres({ juez1: 'Juez 1', juez2: 'Juez 2', juez3: 'Juez 3' });
        onCancelEdit();
    };

    const nombreBoxeadorA = getNombreBoxeador(formData.boxeadorA_Id, 'A');
    const nombreBoxeadorB = getNombreBoxeador(formData.boxeadorB_Id, 'B');

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">
                {editingFight ? 'Editar Pelea' : 'Registrar Pelea'} de Evento
            </h2>

            <form onSubmit={handleSubmit}>
                {/* Evento */}
                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="evento-pelea">
                        1. Seleccionar Evento
                    </label>
                    <select
                        id="evento-pelea"
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

                {/* Boxeadores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Esquina Roja</h3>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="boxeador-a">
                            2. Seleccionar Boxeador A
                        </label>
                        <select
                            id="boxeador-a"
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            value={formData.boxeadorA_Id}
                            onChange={(e) => setFormData({ ...formData, boxeadorA_Id: e.target.value })}
                            required
                        >
                            <option value="">-- Seleccione boxeador --</option>
                            {boxeadores.map((boxeador) => (
                                <option key={boxeador.id} value={boxeador.id}>
                                    {boxeador.nombre} ({boxeador.victorias}-{boxeador.derrotas}-{boxeador.empates})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-blue-400 mb-2">Esquina Azul</h3>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="boxeador-b">
                            3. Seleccionar Boxeador B
                        </label>
                        <select
                            id="boxeador-b"
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            value={formData.boxeadorB_Id}
                            onChange={(e) => setFormData({ ...formData, boxeadorB_Id: e.target.value })}
                            required
                        >
                            <option value="">-- Seleccione boxeador --</option>
                            {boxeadores.map((boxeador) => (
                                <option key={boxeador.id} value={boxeador.id}>
                                    {boxeador.nombre} ({boxeador.victorias}-{boxeador.derrotas}-{boxeador.empates})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Rounds, Peso, Categoría, Orden */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="rounds-pactados">
                            Rounds
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="rounds-pactados"
                            type="number"
                            value={formData.roundsPactados}
                            onChange={(e) => setFormData({ ...formData, roundsPactados: parseInt(e.target.value) || 6 })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="peso-pactado">
                            Peso Pactado
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="peso-pactado"
                            type="text"
                            placeholder="Ej: 147 lbs"
                            value={formData.pesoPactado}
                            onChange={(e) => handlePesoChange(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="categoria-pelea">
                            Categoría (Sugerida)
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="categoria-pelea"
                            type="text"
                            placeholder="Ej: Peso Welter"
                            value={formData.categoria}
                            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="orden-pelea">
                            Orden
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="orden-pelea"
                            type="number"
                            value={formData.orden}
                            onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 1 })}
                        />
                    </div>
                </div>

                {/* Resultado */}
                <h3 className="text-lg font-semibold text-white mt-6 mb-2">4. Resultado de la Pelea</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-700 rounded">
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="resultado-ganador">
                            Ganador
                        </label>
                        <select
                            id="resultado-ganador"
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            value={formData.resultado_ganador}
                            onChange={(e) => setFormData({ ...formData, resultado_ganador: e.target.value })}
                        >
                            <option value="PENDIENTE">-- Pendiente --</option>
                            <option value="A">Boxeador A</option>
                            <option value="B">Boxeador B</option>
                            <option value="EMPATE">Empate (Draw)</option>
                            <option value="NC">No Contest (NC)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="resultado-metodo">
                            Método
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="resultado-metodo"
                            type="text"
                            placeholder="Ej: KO, TKO, UD, MD, SD"
                            value={formData.resultado_metodo}
                            onChange={(e) => setFormData({ ...formData, resultado_metodo: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="resultado-round">
                            Round
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            id="resultado-round"
                            type="number"
                            placeholder="Ej: 5"
                            value={formData.resultado_round || ''}
                            onChange={(e) => setFormData({ ...formData, resultado_round: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    {/* Puntuación de Jueces */}
                    <div className="md:col-span-3 mt-4 pt-4 border-t border-gray-700">
                        <label className="block text-gray-300 text-sm font-bold mb-3">Puntuación de Jueces</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Juez 1 */}
                            <div>
                                <label className="block text-gray-400 text-sm font-bold mb-1 truncate" title={juezNombres.juez1}>
                                    {juezNombres.juez1}
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-red-400 text-xs font-medium mb-1 truncate" title={nombreBoxeadorA}>
                                            {nombreBoxeadorA}
                                        </label>
                                        <input
                                            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
                                            type="number"
                                            placeholder="Score"
                                            value={formData.juez1_scoreA || ''}
                                            onChange={(e) => setFormData({ ...formData, juez1_scoreA: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-blue-400 text-xs font-medium mb-1 truncate" title={nombreBoxeadorB}>
                                            {nombreBoxeadorB}
                                        </label>
                                        <input
                                            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
                                            type="number"
                                            placeholder="Score"
                                            value={formData.juez1_scoreB || ''}
                                            onChange={(e) => setFormData({ ...formData, juez1_scoreB: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Juez 2 */}
                            <div>
                                <label className="block text-gray-400 text-sm font-bold mb-1 truncate" title={juezNombres.juez2}>
                                    {juezNombres.juez2}
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-red-400 text-xs font-medium mb-1 truncate" title={nombreBoxeadorA}>
                                            {nombreBoxeadorA}
                                        </label>
                                        <input
                                            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
                                            type="number"
                                            placeholder="Score"
                                            value={formData.juez2_scoreA || ''}
                                            onChange={(e) => setFormData({ ...formData, juez2_scoreA: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-blue-400 text-xs font-medium mb-1 truncate" title={nombreBoxeadorB}>
                                            {nombreBoxeadorB}
                                        </label>
                                        <input
                                            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
                                            type="number"
                                            placeholder="Score"
                                            value={formData.juez2_scoreB || ''}
                                            onChange={(e) => setFormData({ ...formData, juez2_scoreB: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Juez 3 */}
                            <div>
                                <label className="block text-gray-400 text-sm font-bold mb-1 truncate" title={juezNombres.juez3}>
                                    {juezNombres.juez3}
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-red-400 text-xs font-medium mb-1 truncate" title={nombreBoxeadorA}>
                                            {nombreBoxeadorA}
                                        </label>
                                        <input
                                            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
                                            type="number"
                                            placeholder="Score"
                                            value={formData.juez3_scoreA || ''}
                                            onChange={(e) => setFormData({ ...formData, juez3_scoreA: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-blue-400 text-xs font-medium mb-1 truncate" title={nombreBoxeadorB}>
                                            {nombreBoxeadorB}
                                        </label>
                                        <input
                                            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
                                            type="number"
                                            placeholder="Score"
                                            value={formData.juez3_scoreB || ''}
                                            onChange={(e) => setFormData({ ...formData, juez3_scoreB: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : editingFight ? 'Actualizar Cambios' : 'Guardar Pelea'}
                    </button>
                    {editingFight && (
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
