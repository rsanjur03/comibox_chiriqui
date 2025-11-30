/**
 * Reglas de pesaje por categoría
 */
const PESAJE_REGLAS: Record<string, number> = {
    'Peso Mínimo': 105, 'Exceso Mínimo': 1,
    'Peso Ligero Mosca': 108, 'Exceso Ligero Mosca': 1,
    'Peso Mosca': 112, 'Exceso Mosca': 1,
    'Peso Súper Mosca': 115, 'Exceso Súper Mosca': 1,
    'Peso Gallo': 118, 'Exceso Gallo': 2,
    'Peso Súper Gallo': 122, 'Exceso Súper Gallo': 2,
    'Peso Pluma': 126, 'Exceso Pluma': 2,
    'Peso Súper Pluma': 130, 'Exceso Súper Pluma': 2,
    'Peso Ligero': 135, 'Exceso Ligero': 2,
    'Peso Súper Ligero': 140, 'Exceso Súper Ligero': 3,
    'Peso Welter': 147, 'Exceso Welter': 3,
    'Peso Súper Welter': 154, 'Exceso Súper Welter': 3,
    'Peso Mediano': 160, 'Exceso Mediano': 4,
    'Peso Súper Mediano': 168, 'Exceso Súper Mediano': 4,
    'Peso Semi Pesado': 175, 'Exceso Semi Pesado': 4,
    'Peso Crucero': 200, 'Exceso Crucero': 5,
    'Peso Pesado': 9999, 'Exceso Pesado': 9999
};

export interface WeighInRules {
    max: number;
    tolerancia: number;
    nombre: string;
}

export interface WeighInValidation {
    status: 'PENDIENTE' | 'OK' | 'ADVERTENCIA' | 'FALLO';
    message: string;
    color: string;
}

/**
 * Obtiene las reglas de pesaje según el peso pactado
 */
export function getReglasPorPesoPactado(pesoPactadoStr: string): WeighInRules {
    // Extraer solo el número de libras del string
    const match = pesoPactadoStr.match(/(\d+(\.\d+)?)/);
    const pesoPactado = match ? parseFloat(match[1]) : null;
    
    if (!pesoPactado) return { max: 0, tolerancia: 0, nombre: 'N/A' };

    // Buscar la categoría y tolerancia correspondiente
    let categoriaNombre = 'N/A';
    let pesoMaximo = 0;
    let tolerancia = 0;

    for (const [key, maxLbs] of Object.entries(PESAJE_REGLAS)) {
        if (key.startsWith('Peso') && key !== 'Peso Pesado') {
            if (pesoPactado <= maxLbs) {
                categoriaNombre = key;
                pesoMaximo = maxLbs;
                tolerancia = PESAJE_REGLAS[`Exceso ${key.replace('Peso ', '')}`];
                break;
            }
        }
    }
    
    if (categoriaNombre === 'N/A' && pesoPactado > 200) {
        categoriaNombre = 'Peso Pesado';
        pesoMaximo = 9999;
        tolerancia = 9999;
    }

    return {
        max: pesoPactado,
        tolerancia: tolerancia,
        nombre: categoriaNombre
    };
}

/**
 * Valida el peso oficial contra el peso pactado
 */
export function validarPeso(pesoOficial: number, pesoPactadoStr: string): WeighInValidation {
    const reglas = getReglasPorPesoPactado(pesoPactadoStr);
    const { max, tolerancia } = reglas;

    if (pesoOficial <= 0) {
        return { status: 'PENDIENTE', message: 'Ingresar peso', color: 'text-gray-400' };
    }

    // Si es peso pesado, siempre es OK si hay un peso registrado
    if (max === 9999) {
        return { status: 'OK', message: 'OK (Peso Pesado)', color: 'text-green-500' };
    }

    const limiteOficial = max;
    const limiteTolerancia = max + tolerancia;

    // Validación: Debe ser igual o menor al peso pactado
    if (pesoOficial <= limiteOficial) {
        return { status: 'OK', message: '¡En peso!', color: 'text-green-500' };
    }
    // Validación: Debe estar dentro del límite de tolerancia
    else if (pesoOficial <= limiteTolerancia) {
        const exceso = (pesoOficial - limiteOficial).toFixed(1);
        return { status: 'ADVERTENCIA', message: `Exceso: +${exceso} lbs (dentro de tolerancia)`, color: 'text-yellow-500' };
    }
    // Exceso de tolerancia
    else {
        const exceso = (pesoOficial - limiteOficial).toFixed(1);
        return { status: 'FALLO', message: `Exceso: +${exceso} lbs (¡FUERA DE TOLERANCIA!)`, color: 'text-red-600' };
    }
}
