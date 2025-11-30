import { useState } from 'react';

interface Oficial {
  id: string;
  nombre: string;
  tipo: string;
}

interface Pelea {
  id: string;
  boxeadorA_Nombre: string;
  boxeadorB_Nombre: string;
  juez1_id?: string;
  juez2_id?: string;
  juez3_id?: string;
  arbitro_id?: string;
  tiempo_id?: string;
}

interface AsignacionPeleaProps {
  pelea: Pelea;
  oficiales: {
    jueces: Oficial[];
    arbitros: Oficial[];
    juecesTiempo: Oficial[];
  };
  onSave: (data: {
    peleaId: string;
    juez1_id: string;
    juez2_id: string;
    juez3_id: string;
    arbitro_id: string;
    tiempo_id: string;
  }) => Promise<void>;
}

export default function AsignacionPelea({ pelea, oficiales, onSave }: AsignacionPeleaProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      await onSave({
        peleaId: pelea.id,
        juez1_id: formData.get('juez1') as string,
        juez2_id: formData.get('juez2') as string,
        juez3_id: formData.get('juez3') as string,
        arbitro_id: formData.get('arbitro') as string,
        tiempo_id: formData.get('tiempo') as string,
      });
      setStatus({ message: '¡Guardado exitosamente!', type: 'success' });
    } catch (error) {
      console.error('Error al guardar:', error);
      setStatus({ message: 'Error al guardar. Intente nuevamente.', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const nombreA = pelea.boxeadorA_Nombre?.split(' (')[0] || 'Boxeador A';
  const nombreB = pelea.boxeadorB_Nombre?.split(' (')[0] || 'Boxeador B';

  return (
    <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
      <h4 className="text-lg font-bold text-white mb-3">
        <span className="text-red-400">{nombreA}</span> vs <span className="text-blue-400">{nombreB}</span>
      </h4>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-gray-300 text-sm font-bold">Jueces</label>
          <select 
            name="juez1"
            defaultValue={pelea.juez1_id || ''}
            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
          >
            <option value="">-- Juez 1 --</option>
            {oficiales.jueces.map(juez => (
              <option key={`juez1-${juez.id}`} value={juez.id}>
                {juez.nombre}
              </option>
            ))}
          </select>
          <select 
            name="juez2"
            defaultValue={pelea.juez2_id || ''}
            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
          >
            <option value="">-- Juez 2 --</option>
            {oficiales.jueces.map(juez => (
              <option key={`juez2-${juez.id}`} value={juez.id}>
                {juez.nombre}
              </option>
            ))}
          </select>
          <select 
            name="juez3"
            defaultValue={pelea.juez3_id || ''}
            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
          >
            <option value="">-- Juez 3 --</option>
            {oficiales.jueces.map(juez => (
              <option key={`juez3-${juez.id}`} value={juez.id}>
                {juez.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="block text-gray-300 text-sm font-bold">Árbitro</label>
          <select 
            name="arbitro"
            defaultValue={pelea.arbitro_id || ''}
            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
          >
            <option value="">-- Seleccione un árbitro --</option>
            {oficiales.arbitros.map(arbitro => (
              <option key={`arbitro-${arbitro.id}`} value={arbitro.id}>
                {arbitro.nombre}
              </option>
            ))}
          </select>
          
          <label className="block text-gray-300 text-sm font-bold mt-4">Juez de Tiempo</label>
          <select 
            name="tiempo"
            defaultValue={pelea.tiempo_id || ''}
            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
          >
            <option value="">-- Seleccione juez de tiempo --</option>
            {oficiales.juecesTiempo.map(juez => (
              <option key={`tiempo-${juez.id}`} value={juez.id}>
                {juez.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="md:mt-6">
          <button 
            type="submit" 
            disabled={isSaving}
            className={`w-full ${
              isSaving ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-bold py-2 px-4 rounded`}
          >
            {isSaving ? 'Guardando...' : 'Guardar Asignación'}
          </button>
          {status && (
            <p 
              className={`text-sm mt-2 text-center ${
                status.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {status.message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}