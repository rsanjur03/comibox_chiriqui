interface Boxeador {
    nombre: string;
    fotoURL: string;
}

interface FightSummaryCardProps {
    orden: number;
    categoria: string;
    roundsPactados: number;
    boxeadorA: Boxeador;
    boxeadorB: Boxeador;
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

export default function FightSummaryCard({
    orden,
    categoria,
    roundsPactados,
    boxeadorA,
    boxeadorB,
    resultado_ganador,
    resultado_metodo,
    resultado_round,
    juez1_scoreA,
    juez1_scoreB,
    juez2_scoreA,
    juez2_scoreB,
    juez3_scoreA,
    juez3_scoreB
}: FightSummaryCardProps) {
    // Formatear el método
    let metodo = resultado_metodo || 'N/D';
    const metodoUpper = metodo.toUpperCase();
    if ((metodoUpper === 'KO' || metodoUpper === 'TKO') && resultado_round > 0) {
        metodo = `${metodo} en el Round ${resultado_round}`;
    }

    // Determinar ganador
    let ganador = "PENDIENTE";
    if (resultado_ganador === 'A') {
        ganador = `GANA: ${boxeadorA.nombre}`;
    } else if (resultado_ganador === 'B') {
        ganador = `GANA: ${boxeadorB.nombre}`;
    } else if (resultado_ganador === 'EMPATE') {
        ganador = "EMPATE";
    } else if (resultado_ganador === 'NC') {
        ganador = "NO CONTEST (NC)";
    }

    // Mostrar scores si es decisión
    let scores = "";
    if ((metodoUpper === 'UD' || metodoUpper === 'MD' || metodoUpper === 'SD') && 
        (juez1_scoreA || juez1_scoreB)) {
        const score1 = `${juez1_scoreA || '?'}-${juez1_scoreB || '?'}`;
        const score2 = `${juez2_scoreA || '?'}-${juez2_scoreB || '?'}`;
        const score3 = `${juez3_scoreA || '?'}-${juez3_scoreB || '?'}`;
        scores = `[${score1}] [${score2}] [${score3}]`;
    }

    return (
        <div className="pelea-resumen-card">
            <h3 className="text-xl font-bold mb-3">
                Pelea N° {orden}: {categoria || ''} ({roundsPactados} Rounds)
            </h3>
            <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-center">
                    <img 
                        src={boxeadorA.fotoURL} 
                        alt={boxeadorA.nombre} 
                        className="report-boxer-photo mx-auto mb-2"
                    />
                    <h4 className="text-lg font-semibold text-red-500">{boxeadorA.nombre}</h4>
                    <p className="text-sm">Esquina Roja</p>
                </div>
                <div className="text-center">
                    <span className="text-3xl font-black">VS</span>
                </div>
                <div className="text-center">
                    <img 
                        src={boxeadorB.fotoURL} 
                        alt={boxeadorB.nombre} 
                        className="report-boxer-photo mx-auto mb-2"
                    />
                    <h4 className="text-lg font-semibold text-blue-500">{boxeadorB.nombre}</h4>
                    <p className="text-sm">Esquina Azul</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-500 text-center">
                <p className="text-xl font-bold uppercase">{ganador}</p>
                <p className="text-lg">{metodo}</p>
                {scores && <p className="text-sm font-mono">{scores}</p>}
            </div>
        </div>
    );
}
