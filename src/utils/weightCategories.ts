/**
 * Determina la categoría de peso según las libras
 */
export function getCategoriaPorPeso(pesoLbs: number): string {
    if (!pesoLbs || pesoLbs <= 0) return "";
    if (pesoLbs <= 105) return "Peso Mínimo";
    if (pesoLbs <= 108) return "Peso Minimosca";
    if (pesoLbs <= 111) return "Peso Mosca";
    if (pesoLbs <= 115) return "Peso Supermosca";
    if (pesoLbs <= 118) return "Peso Gallo";
    if (pesoLbs <= 122) return "Peso Supergallo";
    if (pesoLbs <= 126) return "Peso Pluma";
    if (pesoLbs <= 130) return "Peso Superpluma";
    if (pesoLbs <= 135) return "Peso Ligero";
    if (pesoLbs <= 140) return "Peso Superligero";
    if (pesoLbs <= 147) return "Peso Wélter";
    if (pesoLbs <= 154) return "Peso Superwélter";
    if (pesoLbs <= 160) return "Peso Mediano";
    if (pesoLbs <= 168) return "Peso Supermediano";
    if (pesoLbs <= 175) return "Peso Semipesado";
    if (pesoLbs <= 200) return "Peso Crucero";
    if (pesoLbs > 200) return "Peso Pesado";
    return "";
}

/**
 * Extrae el número de peso de un string (ej: "147 lbs" -> 147)
 */
export function extractPesoFromString(pesoStr: string): number | null {
    const match = pesoStr.match(/(\d+(\.\d+)?)/);
    if (match) {
        return parseFloat(match[1]);
    }
    return null;
}
