// src/components/AsignacionMedico.tsx
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Oficial {
  id: string;
  nombre: string;
  tipo: string | string[];
  [key: string]: any;
}

interface AsignacionMedicoProps {
  oficiales: Oficial[];
  eventoId: string;
}

export default function AsignacionMedico({ oficiales, eventoId }: AsignacionMedicoProps) {
  const [medicos, setMedicos] = useState<Oficial[]>([]);
  const [asignado, setAsignado] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtrar médicos
  useEffect(() => {
    const medicosFiltrados = oficiales.filter(oficial => {
      const tipos = Array.isArray(oficial.tipo) ? oficial.tipo : [oficial.tipo];

      // Normalizar
      const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      return tipos.some(t => {
        if (!t) return false;
        // Busca 'medico' (sin tilde) para que coincida con 'Médico' o 'Medico'
        return normalize(t).includes('medico');
      });
    });
    setMedicos(medicosFiltrados);
    setCargando(false);
  }, [oficiales]);

  const handleGuardar = async () => {
    if (!asignado) {
      alert('Seleccione un médico primero');
      return;
    }

    try {
      const medicoSeleccionado = medicos.find(m => m.id === asignado);
      if (!medicoSeleccionado) return;

      const docRef = doc(db, 'eventos', eventoId);
      await updateDoc(docRef, {
        medico_id: asignado,
        medicoTurno: medicoSeleccionado.nombre
      });
      alert('Médico asignado correctamente');
    } catch (error) {
      console.error('Error al asignar médico:', error);
      alert('Error al guardar la asignación');
    }
  };

  if (cargando) {
    return <p className="text-gray-400">Cargando médicos...</p>;
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-4 text-white">Asignar Médico</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Seleccionar Médico
          </label>
          <select
            value={asignado}
            onChange={(e) => setAsignado(e.target.value)}
            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
          >
            <option value="">-- Seleccione un médico --</option>
            {medicos.map(medico => (
              <option key={medico.id} value={medico.id}>
                {medico.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={handleGuardar}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full md:w-auto"
          >
            Guardar Asignación
          </button>
        </div>
      </div>
    </div>
  );
}