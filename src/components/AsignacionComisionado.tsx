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
  eventoId: string;
}

export default function AsignacionComisionado({ oficiales, eventoId }: AsignacionComisionadoProps) {
  const [comisionados, setComisionados] = useState<Oficial[]>([]);
  const [asignado, setAsignado] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtrar comisionados
  useEffect(() => {
    const comisionadosFiltrados = oficiales.filter(oficial => {
      const tipos = Array.isArray(oficial.tipo) ? oficial.tipo : [oficial.tipo];

      // Normalizar
      const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      return tipos.some(t => {
        if (!t) return false;
        return normalize(t).includes('comisionado');
      });
    });
    setComisionados(comisionadosFiltrados);
    setCargando(false);
  }, [oficiales]);

  const handleGuardar = async () => {
    if (!asignado) {
      alert('Seleccione un comisionado primero');
      return;
    }

    try {
      const comisionadoSeleccionado = comisionados.find(c => c.id === asignado);
      if (!comisionadoSeleccionado) return;

      const docRef = doc(db, 'eventos', eventoId);
      await updateDoc(docRef, {
        comisionado_id: asignado,
        comisionadoTurno: comisionadoSeleccionado.nombre
      });
      alert('Comisionado asignado correctamente');
    } catch (error) {
      console.error('Error al asignar comisionado:', error);
      alert('Error al guardar la asignación');
    }
  };

  if (cargando) {
    return <p className="text-gray-400">Cargando comisionados...</p>;
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-4 text-white">Asignar Comisionado</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Seleccionar Comisionado
          </label>
          <select
            value={asignado}
            onChange={(e) => setAsignado(e.target.value)}
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