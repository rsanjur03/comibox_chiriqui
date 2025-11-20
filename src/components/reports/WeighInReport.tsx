import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, orderBy as firestoreOrderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

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
    fechaPesaje?: string;
    horaPesaje?: string;
    lugarPesaje?: string;
    hora?: string;
    comisionadoTurno?: string;
}

interface PeleaData {
    boxeadorA_Nombre: string;
    boxeadorB_Nombre: string;
    boxeadorA_Peso: number;
    boxeadorB_Peso: number;
    categoria: string;
    pesoPactado: string;
    roundsPactados: number;
    notasPesaje: string;
}

export default function WeighInReport() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [selectedEventoId, setSelectedEventoId] = useState<string>('');
    const [eventoData, setEventoData] = useState<EventoData | null>(null);
    const [peleas, setPeleas] = useState<PeleaData[]>([]);
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

            const peleasData: PeleaData[] = [];
            peleasSnapshot.forEach((doc) => {
                peleasData.push(doc.data() as PeleaData);
            });

            setPeleas(peleasData);
            
            // Actualizar título del documento
            if (evento.nombre) {
                document.title = `Informe Pesaje: ${evento.nombre}`;
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
                            1. Seleccione un Evento para generar el informe
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
                            <p className="text-xl font-semibold">INFORME OFICIAL DE PESAJE</p>
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
                                        <strong className="font-semibold">FUNCIÓN:</strong> {eventoData.nombre || 'N/D'}
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
                            </tbody>
                        </table>
                    </section>

                    {/* Tabla de Pesajes */}
                    <section>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse border border-gray-600">
                                <thead className="text-xs uppercase bg-gray-600">
                                    <tr>
                                        <th scope="col" className="py-3 px-4 border border-gray-500">ESQUINA ROJA (A)</th>
                                        <th scope="col" className="py-3 px-4 border border-gray-500">ESQUINA AZUL (B)</th>
                                        <th scope="col" className="py-3 px-4 border border-gray-500">CATEGORÍA</th>
                                        <th scope="col" className="py-3 px-4 border border-gray-500">PESO PACTADO</th>
                                        <th scope="col" className="py-3 px-4 border border-gray-500">ASALTOS</th>
                                        <th scope="col" className="py-3 px-4 border border-gray-500">NOTAS / ACUERDOS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-4 px-6 text-center">Cargando peleas...</td>
                                        </tr>
                                    ) : peleas.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-4 px-6 text-center">No hay peleas registradas para este evento.</td>
                                        </tr>
                                    ) : (
                                        peleas.map((pelea, index) => {
                                            const nombreA = pelea.boxeadorA_Nombre.split(' (')[0];
                                            const nombreB = pelea.boxeadorB_Nombre.split(' (')[0];
                                            const pesoA = pelea.boxeadorA_Peso > 0 ? `${pelea.boxeadorA_Peso} lbs` : '--';
                                            const pesoB = pelea.boxeadorB_Peso > 0 ? `${pelea.boxeadorB_Peso} lbs` : '--';
                                            const rounds = pelea.roundsPactados || 'N/A';

                                            return (
                                                <tr key={index} className="border-b border-gray-500 align-top">
                                                    <td className="py-2 px-4 border border-gray-500">
                                                        <strong className="font-semibold text-red-500">Nombre:</strong> {nombreA}<br />
                                                        <strong className="font-semibold text-red-500">Peso:</strong> {pesoA}
                                                    </td>
                                                    <td className="py-2 px-4 border border-gray-500">
                                                        <strong className="font-semibold text-blue-500">Nombre:</strong> {nombreB}<br />
                                                        <strong className="font-semibold text-blue-500">Peso:</strong> {pesoB}
                                                    </td>
                                                    <td className="py-2 px-4 border border-gray-500">{pelea.categoria || 'N/A'}</td>
                                                    <td className="py-2 px-4 border border-gray-500">{pelea.pesoPactado || 'N/A'}</td>
                                                    <td className="py-2 px-4 border border-gray-500">{rounds}</td>
                                                    <td className="py-2 px-4 border border-gray-500">{pelea.notasPesaje || ''}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="mt-12 pt-4 text-sm">
                        {/* Detalles del Pesaje */}
                        <section className="mb-8">
                            <table className="w-full text-left">
                                <tbody>
                                    <tr>
                                        <td className="py-1 pr-4">
                                            <strong className="font-semibold">FECHA DEL PESAJE:</strong> {eventoData.fechaPesaje || eventoData.fecha || 'N/D'}
                                        </td>
                                        <td className="py-1 pr-4">
                                            <strong className="font-semibold">HORA:</strong> {eventoData.horaPesaje || eventoData.hora || 'N/D'}
                                        </td>
                                        <td className="py-1 pr-4">
                                            <strong className="font-semibold">LUGAR:</strong> {eventoData.lugarPesaje || 'N/D'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* Firmas */}
                        <section className="mt-16 grid grid-cols-2 gap-x-12 gap-y-12">
                            <div className="text-center">
                                <div className="signature-line w-3/4 mx-auto border-t border-gray-500 pt-2">
                                    Ing. Pedro Pablo Aparicio<br />Presidente
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="signature-line w-3/4 mx-auto border-t border-gray-500 pt-2">
                                    Prof. Ricardo Sanjur<br />Tesorero
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="signature-line w-3/4 mx-auto border-t border-gray-500 pt-2">
                                    {eventoData.comisionadoTurno || 'Comisionado de Turno'}<br />
                                    {eventoData.comisionadoTurno && 'Comisionado de Turno'}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="signature-line w-3/4 mx-auto border-t border-gray-500 pt-2">
                                    Eysbel Gomez de Sanjur<br />Secretaria
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
