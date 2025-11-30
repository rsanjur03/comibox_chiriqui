import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, orderBy as firestoreOrderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import logo from '../../assets/comiboxch_logo.jpg';

interface Evento {
    id: string;
    nombre: string;
    fecha: string;
}

interface Pelea {
    id: string;
    orden: number;
    boxeadorA_Nombre: string;
    boxeadorB_Nombre: string;
}

interface EventoData {
    nombre: string;
    fecha: string;
    medicoTurno?: string;
    comisionadoTurno?: string;
}

interface PeleaData {
    orden: number;
    roundsPactados: number;
    pesoPactado: string;
    boxeadorA_Id: string;
    boxeadorB_Id: string;
    arbitro_id: string;
    tiempo_id: string;
    juez1_id: string;
    juez2_id: string;
    juez3_id: string;
    juez1_scoreA: number;
    juez1_scoreB: number;
    juez2_scoreA: number;
    juez2_scoreB: number;
    juez3_scoreA: number;
    juez3_scoreB: number;
    resultado_ganador: string;
    resultado_metodo: string;
    resultado_round: number;
}

interface BoxeadorData {
    nombre: string;
    fotoURL: string;
}

const PLACEHOLDER_FOTO = 'https://via.placeholder.com/150';

// Cachés
const oficialesCache = new Map<string, string>();
const boxeadoresCache = new Map<string, BoxeadorData>();

async function getNombreOficial(id: string): Promise<string> {
    if (!id) return "N/A";
    if (oficialesCache.has(id)) return oficialesCache.get(id)!;
    
    try {
        const docRef = doc(db, 'oficiales', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const nombre = docSnap.data().nombre;
            oficialesCache.set(id, nombre);
            return nombre;
        }
        return "N/A";
    } catch (error) {
        console.error('Error al obtener oficial:', error);
        return "Error";
    }
}

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

export default function FightResultReport() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [peleas, setPeleas] = useState<Pelea[]>([]);
    const [selectedEventoId, setSelectedEventoId] = useState<string>('');
    const [selectedPeleaId, setSelectedPeleaId] = useState<string>('');
    const [eventoData, setEventoData] = useState<EventoData | null>(null);
    const [peleaData, setPeleaData] = useState<PeleaData | null>(null);
    const [boxeadorA, setBoxeadorA] = useState<BoxeadorData | null>(null);
    const [boxeadorB, setBoxeadorB] = useState<BoxeadorData | null>(null);
    const [oficiales, setOficiales] = useState({
        arbitro: 'N/A',
        tiempo: 'N/A',
        juez1: 'N/A',
        juez2: 'N/A',
        juez3: 'N/A'
    });
    const [loading, setLoading] = useState(false);
    const [fechaReporte] = useState(new Date().toLocaleString('es-PA'));

    useEffect(() => {
        cargarEventos();
    }, []);

    useEffect(() => {
        if (selectedEventoId) {
            cargarPeleas(selectedEventoId);
        } else {
            setPeleas([]);
            setSelectedPeleaId('');
        }
    }, [selectedEventoId]);

    useEffect(() => {
        if (selectedEventoId && selectedPeleaId) {
            cargarReporte(selectedEventoId, selectedPeleaId);
        } else {
            limpiarReporte();
        }
    }, [selectedEventoId, selectedPeleaId]);

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

    const cargarPeleas = async (eventoId: string) => {
        try {
            const q = query(
                collection(db, 'peleas'),
                where('eventoId', '==', eventoId),
                firestoreOrderBy('orden', 'asc')
            );
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                setPeleas([]);
                return;
            }

            const peleasData: Pelea[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                peleasData.push({
                    id: doc.id,
                    orden: data.orden,
                    boxeadorA_Nombre: data.boxeadorA_Nombre,
                    boxeadorB_Nombre: data.boxeadorB_Nombre
                });
            });
            setPeleas(peleasData);
        } catch (error) {
            console.error('Error al cargar peleas:', error);
        }
    };

    const limpiarReporte = () => {
        setEventoData(null);
        setPeleaData(null);
        setBoxeadorA(null);
        setBoxeadorB(null);
        setOficiales({
            arbitro: 'N/A',
            tiempo: 'N/A',
            juez1: 'N/A',
            juez2: 'N/A',
            juez3: 'N/A'
        });
    };

    const cargarReporte = async (eventoId: string, peleaId: string) => {
        setLoading(true);
        try {
            // Obtener datos del evento y pelea
            const [eventoSnap, peleaSnap] = await Promise.all([
                getDoc(doc(db, 'eventos', eventoId)),
                getDoc(doc(db, 'peleas', peleaId))
            ]);

            if (!eventoSnap.exists() || !peleaSnap.exists()) {
                alert('No se encontraron los datos del evento o la pelea.');
                return;
            }

            const evento = eventoSnap.data() as EventoData;
            const pelea = peleaSnap.data() as PeleaData;

            setEventoData(evento);
            setPeleaData(pelea);

            // Obtener datos de boxeadores y oficiales
            const [
                boxeadorAData,
                boxeadorBData,
                nombreArbitro,
                nombreJuezTiempo,
                nombreJuez1,
                nombreJuez2,
                nombreJuez3
            ] = await Promise.all([
                getDatosBoxeador(pelea.boxeadorA_Id),
                getDatosBoxeador(pelea.boxeadorB_Id),
                getNombreOficial(pelea.arbitro_id),
                getNombreOficial(pelea.tiempo_id),
                getNombreOficial(pelea.juez1_id),
                getNombreOficial(pelea.juez2_id),
                getNombreOficial(pelea.juez3_id)
            ]);

            setBoxeadorA(boxeadorAData);
            setBoxeadorB(boxeadorBData);
            setOficiales({
                arbitro: nombreArbitro,
                tiempo: nombreJuezTiempo,
                juez1: nombreJuez1,
                juez2: nombreJuez2,
                juez3: nombreJuez3
            });

            // Actualizar título
            document.title = `Resultado: ${boxeadorAData.nombre} vs ${boxeadorBData.nombre}`;
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

    // Formatear resultado
    const getResultadoFormateado = () => {
        if (!peleaData || !boxeadorA || !boxeadorB) return { metodo: 'N/D', ganador: 'PENDIENTE' };

        let metodo = peleaData.resultado_metodo || 'N/D';
        const metodoUpper = metodo.toUpperCase();
        if ((metodoUpper === 'KO' || metodoUpper === 'TKO') && peleaData.resultado_round > 0) {
            metodo = `${metodo} en el Round ${peleaData.resultado_round}`;
        }

        let ganador = "PENDIENTE";
        if (peleaData.resultado_ganador === 'A') {
            ganador = `GANADOR: ${boxeadorA.nombre}`;
        } else if (peleaData.resultado_ganador === 'B') {
            ganador = `GANADOR: ${boxeadorB.nombre}`;
        } else if (peleaData.resultado_ganador === 'EMPATE') {
            ganador = "EMPATE";
        } else if (peleaData.resultado_ganador === 'NC') {
            ganador = "NO CONTEST (NC)";
        }

        return { metodo, ganador };
    };

    const resultado = getResultadoFormateado();
    const showReport = selectedEventoId && selectedPeleaId && eventoData && peleaData && boxeadorA && boxeadorB;

    return (
        <>
            {/* Selectores */}
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
                    <div className="flex-grow">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="select-pelea-reporte">
                            2. Seleccione la Pelea
                        </label>
                        <select
                            id="select-pelea-reporte"
                            className="shadow appearance-none border border-gray-600 bg-gray-700 rounded w-full py-2 px-3 text-white"
                            value={selectedPeleaId}
                            onChange={(e) => setSelectedPeleaId(e.target.value)}
                            disabled={!selectedEventoId || peleas.length === 0}
                        >
                            <option value="">
                                {!selectedEventoId ? '-- Primero seleccione un evento --' : peleas.length === 0 ? 'No hay peleas para este evento' : '-- Seleccione una pelea --'}
                            </option>
                            {peleas.map((pelea) => {
                                const nombreA = pelea.boxeadorA_Nombre.split(' (')[0];
                                const nombreB = pelea.boxeadorB_Nombre.split(' (')[0];
                                return (
                                    <option key={pelea.id} value={pelea.id}>
                                        Pelea #{pelea.orden}: {nombreA} vs {nombreB}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div id="print-controls" className="flex-shrink-0">
                        <button
                            onClick={handlePrint}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            disabled={!showReport}
                        >
                            Imprimir o Guardar como PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Reporte */}
            {showReport && (
                <div id="report-page">
                    {/* Header */}
                    <header className="flex justify-between items-start border-b-2 border-gray-400 pb-4 mb-6">
                        <div>
                            <img 
                                src={logo.src} 
                                alt="Logo COMIBOX Chiriquí" 
                                className="h-24"
                            />
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-bold">COMISIÓN DE BOXEO PROFESIONAL DE CHIRIQUÍ</h1>
                            <p className="text-xl font-semibold">INFORME OFICIAL DE RESULTADO</p>
                        </div>
                    </header>

                    {/* Detalles del Evento y Pelea */}
                    <section className="mb-6">
                        <table className="w-full text-left border-collapse border border-gray-500">
                            <tbody>
                                <tr>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">FECHA:</strong> {eventoData.fecha || 'N/D'}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-500" colSpan={2}>
                                        <strong className="font-semibold">EVENTO:</strong> {eventoData.nombre || 'N/D'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">PELEA N°:</strong> {peleaData.orden || 'N/D'}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">ASALTOS:</strong> {peleaData.roundsPactados || 'N/D'}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">PESO:</strong> {peleaData.pesoPactado || 'N/D'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* Boxeadores */}
                    <section className="mb-6">
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <div className="text-center p-4 border border-gray-500">
                                <img 
                                    src={boxeadorA.fotoURL} 
                                    alt={boxeadorA.nombre} 
                                    className="report-boxer-photo mx-auto mb-3"
                                />
                                <h2 className="text-2xl font-bold text-red-500">{boxeadorA.nombre}</h2>
                                <p className="text-lg font-semibold">Esquina Roja</p>
                            </div>
                            <div className="text-center p-4 border border-gray-500">
                                <img 
                                    src={boxeadorB.fotoURL} 
                                    alt={boxeadorB.nombre} 
                                    className="report-boxer-photo mx-auto mb-3"
                                />
                                <h2 className="text-2xl font-bold text-blue-500">{boxeadorB.nombre}</h2>
                                <p className="text-lg font-semibold">Esquina Azul</p>
                            </div>
                        </div>
                    </section>

                    {/* Oficiales */}
                    <section className="mb-6">
                        <table className="w-full text-left border-collapse border border-gray-500">
                            <tbody>
                                <tr>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">ÁRBITRO:</strong> {oficiales.arbitro}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">JUEZ DE TIEMPO:</strong> {oficiales.tiempo}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-500">
                                        <strong className="font-semibold">MÉDICO:</strong> {eventoData.medicoTurno || 'N/A'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* Puntuación */}
                    <section className="mb-6">
                        <h3 className="text-lg font-bold mb-2 text-center">PUNTUACIÓN DE JUECES</h3>
                        <table className="w-full text-sm text-left border-collapse border border-gray-600">
                            <thead className="text-xs uppercase bg-gray-600">
                                <tr>
                                    <th scope="col" className="py-3 px-4 border border-gray-500">JUEZ</th>
                                    <th scope="col" className="py-3 px-4 border border-gray-500 text-red-500">ESQUINA ROJA</th>
                                    <th scope="col" className="py-3 px-4 border border-gray-500 text-blue-500">ESQUINA AZUL</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-500 align-top">
                                    <td className="py-2 px-4 border border-gray-500 font-semibold">{oficiales.juez1}</td>
                                    <td className="py-2 px-4 border border-gray-500 text-center font-bold text-lg">{peleaData.juez1_scoreA || '--'}</td>
                                    <td className="py-2 px-4 border border-gray-500 text-center font-bold text-lg">{peleaData.juez1_scoreB || '--'}</td>
                                </tr>
                                <tr className="border-b border-gray-500 align-top">
                                    <td className="py-2 px-4 border border-gray-500 font-semibold">{oficiales.juez2}</td>
                                    <td className="py-2 px-4 border border-gray-500 text-center font-bold text-lg">{peleaData.juez2_scoreA || '--'}</td>
                                    <td className="py-2 px-4 border border-gray-500 text-center font-bold text-lg">{peleaData.juez2_scoreB || '--'}</td>
                                </tr>
                                <tr className="border-b border-gray-500 align-top">
                                    <td className="py-2 px-4 border border-gray-500 font-semibold">{oficiales.juez3}</td>
                                    <td className="py-2 px-4 border border-gray-500 text-center font-bold text-lg">{peleaData.juez3_scoreA || '--'}</td>
                                    <td className="py-2 px-4 border border-gray-500 text-center font-bold text-lg">{peleaData.juez3_scoreB || '--'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* Decisión */}
                    <section className="mb-6 text-center p-4 border border-gray-500">
                        <h3 className="text-lg font-bold mb-1">DECISIÓN OFICIAL</h3>
                        <p className="text-2xl font-bold uppercase">{resultado.metodo}</p>
                        <p className="text-3xl font-bold uppercase text-green-500">{resultado.ganador}</p>
                    </section>

                    {/* Footer */}
                    <footer className="mt-12 pt-4 text-sm">
                        <section className="mt-16">
                            <div className="text-center w-2/4 mx-auto">
                                <div className="signature-line w-full mx-auto border-t border-gray-500 pt-2">
                                    {eventoData.comisionadoTurno || 'N/A'}<br />Comisionado de Turno
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
