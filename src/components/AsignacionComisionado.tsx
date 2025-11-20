// src/components/AsignacionComisionado.tsx
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Oficial {
  id: string;
  nombre: string;
  tipo: string | string[];
  [key: string]: any;
}

interface AsignacionComisionadoProps {
  oficiales: Oficial[];
}

export default function AsignacionComisionado({ oficiales }: AsignacionComisionadoProps) {
  const [comisionados, setComisionados] = useState<Oficial[]>([]);
  const [asignado, setAsignado] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtrar comisionados
  useEffect(() => {
    const comisionadosFiltrados = oficiales.filter(oficial => {
      if (Array.isArray(oficial.tipo)) {
        return oficial.tipo.includes('Comisionado');
      }
      return oficial.tipo === 'Comisionado';
    });
    setComisionados(comisionadosFiltrados);
    setCargando(false);
  }, [oficiales]);

  const handleAsignar = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const comisionadoId = e.target.value;
    setAsignado(comisionadoId);
    
    try {
      // Aquí iría la lógica para guardar la asignación en Firestore
      // Por ejemplo:
      // await updateDoc(doc(db, 'eventos', eventoId), {
      //   comisionado_id: comisionadoId
      // });
      console.log('Comisionado asignado:', comisionadoId);
    } catch (error) {
      console.error('Error al asignar comisionado:', error);
    }
  };

  if (cargando) {
    return <p className="text-gray-400">Cargando comisionados...</p>;
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-4 text-white">Asignar Comisionado</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Seleccionar Comisionado
          </label>
          <select
            value={asignado}
            onChange={handleAsignar}
            className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
          >
            <option value="">-- Seleccione un comisionado --</option>
            {comisionados.map(comisionado => (
              <option key={comisionado.id} value={comisionado.id}>
                {comisionado.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}