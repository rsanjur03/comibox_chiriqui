import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase.js';
import { collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import { LicenseCardBoxer } from './LicenseCardBoxer';
import { LicenseCardBack } from './LicenseCardBack';

interface LicenseGeneratorProps {
    eventoId: string;
}

interface BoxerData {
    id: string;
    nombreLegal: string;
    cedula: string;
    paisProcedencia: string;
    fechaNacimiento: string;
    peso: string;
    fotoURL?: string;
}

export const LicenseGenerator: React.FC<LicenseGeneratorProps> = ({ eventoId }) => {
    const [loading, setLoading] = useState(true);
    const [boxeadores, setBoxeadores] = useState<BoxerData[]>([]);
    const [licenciasExistentesCount, setLicenciasExistentesCount] = useState(0);
    const [boxeadoresTotalCount, setBoxeadoresTotalCount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [startNumber, setStartNumber] = useState(1);

    const anioActual = new Date().getFullYear();

    useEffect(() => {
        const fetchData = async () => {
            if (!eventoId) return;
            setLoading(true);
            try {
                // 1. Obtener peleas del evento
                const peleasRef = query(collection(db, "peleas"), where("eventoId", "==", eventoId));
                const peleasSnap = await getDocs(peleasRef);
                const peleasEvento = peleasSnap.docs.map((d) => d.data());

                // 2. Boxeadores únicos
                const idsBoxeadores = new Set<string>();
                peleasEvento.forEach((p) => {
                    if (p.boxeadorA_Id) idsBoxeadores.add(p.boxeadorA_Id);
                    if (p.boxeadorB_Id) idsBoxeadores.add(p.boxeadorB_Id);
                });
                const idsFinales = Array.from(idsBoxeadores);
                setBoxeadoresTotalCount(idsFinales.length);

                // 3. Datos de boxeadores
                const boxeadoresData: BoxerData[] = [];
                for (const id of idsFinales) {
                    const ref = doc(db, "boxeadores", id);
                    const snap = await getDoc(ref);
                    if (snap.exists()) {
                        const data = snap.data();
                        boxeadoresData.push({
                            id,
                            nombreLegal: data.nombreLegal || data.nombre,
                            cedula: data.cedula || 'N/D',
                            paisProcedencia: data.paisProcedencia || 'N/D',
                            fechaNacimiento: data.fechaNacimiento || 'N/D',
                            peso: data.peso || "--",
                            fotoURL: data.fotoURL || "",
                        });
                    }
                }

                // 4. Licencias ya existentes (año actual)
                const licenciasRef = query(collection(db, "licencias"), where("anio", "==", anioActual));
                const licenciasSnap = await getDocs(licenciasRef);
                const licenciasExistentes = licenciasSnap.docs.map((d) => d.data());
                const idsConLicencia = licenciasExistentes.map((l: any) => l.boxeadorId);

                setLicenciasExistentesCount(idsConLicencia.length);
                setStartNumber(licenciasExistentes.length + 1);

                // 5. Filtrar
                const boxeadoresAGenerar = boxeadoresData.filter(b => !idsConLicencia.includes(b.id));
                setBoxeadores(boxeadoresAGenerar);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventoId, anioActual]);

    const handleExport = async () => {
        setProcessing(true);
        const wrappers = document.querySelectorAll(".license-wrapper");

        if (!wrappers.length) {
            alert("No hay carnets para exportar.");
            setProcessing(false);
            return;
        }

        let count = 0;
        for (const wrap of Array.from(wrappers)) {
            try {
                const element = wrap as HTMLElement;
                const cardFront = element.querySelector(".license-card") as HTMLElement;
                const cardBack = element.querySelector(".license-card-back") as HTMLElement;

                const boxeadorId = element.dataset.boxeadorId;
                const numeroLicencia = element.dataset.numero;

                // FRENTE
                const canvasFront = await html2canvas(cardFront, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
                const linkFront = document.createElement("a");
                linkFront.download = `licencia-${numeroLicencia}-frente.png`;
                linkFront.href = canvasFront.toDataURL("image/png");
                linkFront.click();

                // REVERSO
                const canvasBack = await html2canvas(cardBack, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
                const linkBack = document.createElement("a");
                linkBack.download = `licencia-${numeroLicencia}-reverso.png`;
                linkBack.href = canvasBack.toDataURL("image/png");
                linkBack.click();

                // GUARDAR EN FIRESTORE
                await addDoc(collection(db, "licencias"), {
                    boxeadorId,
                    anio: anioActual,
                    numeroLicencia,
                    eventoId,
                    fechaGeneracion: serverTimestamp()
                });

                count++;
            } catch (err) {
                console.error("Error exportando licencia:", err);
            }
        }

        alert(`✅ ${count} licencias exportadas y guardadas correctamente.`);
        setProcessing(false);
        // Recargar para actualizar lista
        window.location.reload();
    };

    if (loading) return <div className="text-white p-6">Cargando datos del evento...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Generación de Licencias</h1>
                <button
                    onClick={handleExport}
                    disabled={processing || boxeadores.length === 0}
                    className={`font-bold px-5 py-2 rounded shadow ${processing || boxeadores.length === 0 ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                    {processing ? "Procesando..." : "Exportar Frente + Reverso y Guardar"}
                </button>
            </div>

            <div className="bg-gray-800 p-4 rounded text-gray-200 mb-6">
                <p>✅ Boxeadores en esta función: <b>{boxeadoresTotalCount}</b></p>
                <p>✅ Licencias ya emitidas este año: <b>{licenciasExistentesCount}</b></p>
                <p>🟡 Carnets a generar ahora: <b>{boxeadores.length}</b></p>
            </div>

            {boxeadores.length === 0 ? (
                <div className="bg-green-700 text-white p-6 rounded text-center font-bold">
                    ✅ Todos los boxeadores ya tienen licencia vigente este año.
                </div>
            ) : (
                <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(10cm, 1fr))' }}>
                    {boxeadores.map((b, index) => {
                        const num = String(startNumber + index).padStart(4, "0");
                        const numeroLicencia = `CH-${anioActual}-${num}`;

                        return (
                            <div
                                key={b.id}
                                className="license-wrapper"
                                data-boxeador-id={b.id}
                                data-numero={numeroLicencia}
                                data-evento-id={eventoId}
                            >
                                <div className="flex gap-4 flex-wrap">
                                    <LicenseCardBoxer
                                        id={b.id}
                                        nombreLegal={b.nombreLegal}
                                        cedula={b.cedula}
                                        paisProcedencia={b.paisProcedencia}
                                        fechaNacimiento={b.fechaNacimiento}
                                        peso={b.peso}
                                        fotoURL={b.fotoURL}
                                        numeroLicencia={numeroLicencia}
                                    />
                                    <LicenseCardBack
                                        numeroLicencia={numeroLicencia}
                                        anio={anioActual}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
