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
}

export default function AsignacionMedico({ oficiales }: AsignacionMedicoProps) {
  const [medicos, setMedicos] = useState<Oficial[]>([]);
  const [asignado, setAsignado] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtrar médicos
  useEffect(() => {
    const medicosFiltrados = oficiales.filter(oficial => {
      if (Array.isArray(oficial.tipo)) {
        return oficial.tipo.includes('Médico');
      }
      return oficial.tipo === 'Médico';
    });
    setMedicos(medicosFiltrados);
    setCargando(false);
  }, [oficiales]);

  const handleAsignar = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const medicoId = e.target.value;
    setAsignado(medicoId);
    
    try {
      // Aquí iría la lógica para guardar la asignación en Firestore
      // Por ejemplo:
      // await updateDoc(doc(db, 'eventos', eventoId), {
      //   medico_id: medicoId
      // });
      console.log('Médico asignado:', medicoId);
    } catch (error) {
      console.error('Error al asignar médico:', error);
    }
  };

  if (cargando) {
    return <p className="text-gray-400">Cargando médicos...</p>;
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-4 text-white">Asignar Médico</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Seleccionar Médico
          </label>
          <select
            value={asignado}
            onChange={handleAsignar}
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
      </div>
    </div>
  );
}