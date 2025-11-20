import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, orderBy as firestoreOrderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import FightSummaryCard from './FightSummaryCard';

interface Evento {
    id: string;
    nombre: string;
    fecha: string;
}

interface EventoData {
    nombre: string;
    fecha: string;
    lugar: string;
    ciudad: string;
    promotor: string;
    comisionadoTurno?: string;
    medicoTurno?: string;
}

interface BoxeadorData {
    nombre: string;
    fotoURL: string;
}

interface PeleaData {
    id: string;
    orden: number;
    categoria: string;
    roundsPactados: number;
    boxeadorA_Id: string;
    boxeadorB_Id: string;
    resultado_ganador: string;
    resultado_metodo: string;
    resultado_round: number;
    juez1_scoreA?: number;
    juez1_scoreB?: number;
    juez2_scoreA?: number;
    juez2_scoreB?: number;
    juez3_scoreA?: number;
    juez3_scoreB?: number;
}

const PLACEHOLDER_FOTO = 'https://via.placeholder.com/150';

// Caché de boxeadores
const boxeadoresCache = new Map<string, BoxeadorData>();

async function getDatosBoxeador(id: string): Promise<BoxeadorData> {
    const dataDefault = { nombre: "N/A", fotoURL: PLACEHOLDER_FOTO };
    if (!id) return dataDefault;
    if (boxeadoresCache.has(id)) return boxeadoresCache.get(id)!;
    
    try {
        const docRef = doc(db, 'boxeadores', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const boxerData = {
                nombre: data.nombre || "N/A",
                fotoURL: data.fotoURL || PLACEHOLDER_FOTO
            };
            boxeadoresCache.set(id, boxerData);
            return boxerData;
        }
        return dataDefault;
    } catch (error) {
        console.error('Error al obtener boxeador:', error);
        return dataDefault;
    }
}

export default function EventSummaryReport() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [selectedEventoId, setSelectedEventoId] = useState<string>('');
    const [eventoData, setEventoData] = useState<EventoData | null>(null);
    const [peleas, setPeleas] = useState<Array<PeleaData & { boxeadorA: BoxeadorData; boxeadorB: BoxeadorData }>>([]);
    const [loading, setLoading] = useState(false);
    const [fechaReporte] = useState(new Date().toLocaleString('es-PA'));

    useEffect(() => {
        cargarEventos();
    }, []);

    useEffect(() => {
        if (selectedEventoId) {
            cargarReporte(selectedEventoId);
        } else {
            setEventoData(null);
            setPeleas([]);
        }
    }, [selectedEventoId]);

    const cargarEventos = async () => {
        try {
            const q = query(collection(db, 'eventos'), firestoreOrderBy('fecha', 'desc'));
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

    const cargarReporte = async (eventoId: string) => {
        setLoading(true);
        try {
            // Obtener datos del evento
            const eventoSnap = await getDoc(doc(db, 'eventos', eventoId));
            if (!eventoSnap.exists()) {
                alert('No se encontraron los datos del evento.');
                return;
            }
            const evento = eventoSnap.data() as EventoData;
            setEventoData(evento);

            // Obtener peleas del evento
            const q = query(
                collection(db, 'peleas'),
                where('eventoId', '==', eventoId),
                firestoreOrderBy('orden', 'asc')
            );
            const peleasSnapshot = await getDocs(q);

            if (peleasSnapshot.empty) {
                setPeleas([]);
                return;
            }

            // Cargar datos de boxeadores para cada pelea
            const peleasConBoxeadores = await Promise.all(
                peleasSnapshot.docs.map(async (peleaDoc) => {
                    const pelea = peleaDoc.data() as PeleaData;
                    const [boxeadorA, boxeadorB] = await Promise.all([
                        getDatosBoxeador(pelea.boxeadorA_Id),
                        getDatosBoxeador(pelea.boxeadorB_Id)
                    ]);
                    return {
                        ...pelea,
                        id: peleaDoc.id,
                        boxeadorA,
                        boxeadorB
                    };
                })
            );

            setPeleas(peleasConBoxeadores);
            
            // Actualizar título del documento
            if (evento.nombre) {
                document.title = `Resumen: ${evento.nombre}`;
            }
        } catch (error) {
            console.error('Error al cargar reporte:', error);
            alert('Error al generar el reporte');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            {/* Selector de Evento */}
            <div id="selector-container" className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8 print:hidden">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="flex-grow">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="select-evento-reporte">
                            1. Seleccione un Evento
                        </label>
                        <select
                            id="select-evento-reporte"
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            value={selectedEventoId}
                            onChange={(e) => setSelectedEventoId(e.target.value)}
                        >
                            <option value="">-- Seleccione un evento --</option>
                            {eventos.map((evento) => (
                                <option key={evento.id} value={evento.id}>
                                    {evento.fecha} - {evento.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div id="print-controls" className="flex-shrink-0">
                        <button
                            onClick={handlePrint}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            disabled={!selectedEventoId}
                        >
                            Imprimir o Guardar como PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Reporte */}
            {selectedEventoId && eventoData && (
                <div id="report-page">
                    {/* Header */}
                    <header className="flex justify-between items-start border-b-2 border-gray-400 pb-4 mb-6">
                        <div>
                            <img 
                                src="https://admin.comiboxchiriqui.com/imagenes/comiboxch_logo.jpg" 
                                alt="Logo COMIBOX Chiriquí" 
                                className="h-24"
                            />
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-bold">COMISIÓN DE BOXEO PROFESIONAL DE CHIRIQUÍ</h1>
                            <p className="text-xl font-semibold">INFORME OFICIAL DE RESULTADOS DE LA FUNCIÓN</p>
                        </div>
                    </header>

                    {/* Detalles del Evento */}
                    <section className="mb-6">
                        <table className="w-full text-left border-collapse border border-gray-500">
                            <tbody>
                                <tr>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">FECHA:</strong> {eventoData.fecha || 'N/D'}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">EVENTO:</strong> {eventoData.nombre || 'N/D'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">LUGAR:</strong> {eventoData.lugar || 'N/D'}, {eventoData.ciudad || 'N/D'}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">PROMOTOR:</strong> {eventoData.promotor || 'N/D'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">COMISIONADO:</strong> {eventoData.comisionadoTurno || 'N/A'}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">MÉDICO:</strong> {eventoData.medicoTurno || 'N/A'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* Peleas */}
                    <section className="mt-8">
                        {loading ? (
                            <p className="text-center text-lg">Cargando peleas...</p>
                        ) : peleas.length === 0 ? (
                            <p className="text-center text-lg">No hay peleas registradas para este evento.</p>
                        ) : (
                            peleas.map((pelea) => (
                                <FightSummaryCard
                                    key={pelea.id}
                                    orden={pelea.orden}
                                    categoria={pelea.categoria}
                                    roundsPactados={pelea.roundsPactados}
                                    boxeadorA={pelea.boxeadorA}
                                    boxeadorB={pelea.boxeadorB}
                                    resultado_ganador={pelea.resultado_ganador}
                                    resultado_metodo={pelea.resultado_metodo}
                                    resultado_round={pelea.resultado_round}
                                    juez1_scoreA={pelea.juez1_scoreA}
                                    juez1_scoreB={pelea.juez1_scoreB}
                                    juez2_scoreA={pelea.juez2_scoreA}
                                    juez2_scoreB={pelea.juez2_scoreB}
                                    juez3_scoreA={pelea.juez3_scoreA}
                                    juez3_scoreB={pelea.juez3_scoreB}
                                />
                            ))
                        )}
                    </section>

                    {/* Footer */}
                    <footer className="mt-12 pt-4 text-sm">
                        <section className="mt-16 grid grid-cols-2 gap-x-12 gap-y-12">
                            <div className="text-center">
                                <div className="signature-line w-3/4 mx-auto border-t border-gray-500 pt-2">
                                    {eventoData.comisionadoTurno || '...'}<br />Comisionado de Turno
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="signature-line w-3/4 mx-auto border-t border-gray-500 pt-2">
                                    {eventoData.medicoTurno || '...'}<br />Médico de Turno
                                </div>
                            </div>
                        </section>
                        
                        <div className="mt-12 pt-4 border-t border-gray-500 text-center text-xs">
                            <p>Informe generado el: {fechaReporte}</p>
                            <p>COMISIÓN DE BOXEO PROFESIONAL DE CHIRIQUÍ</p>
                        </div>
                    </footer>
                </div>
            )}
        </>
    );
}
