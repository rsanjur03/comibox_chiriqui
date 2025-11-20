// src/components/AsignacionOficiales.tsx
import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import AsignacionComisionado from './AsignacionComisionado';
import AsignacionMedico from './AsignacionMedico';

interface Evento {
  id: string;
  nombre: string;
  fecha: { seconds: number };
  [key: string]: any;
}

interface Oficial {
  id: string;
  nombre: string;
  tipo: string | string[];
  [key: string]: any;
}

interface Pelea {
  id: string;
  boxeadorA_Nombre?: string;
  boxeadorB_Nombre?: string;
  juez1_id?: string;
  juez2_id?: string;
  juez3_id?: string;
  arbitro_id?: string;
  tiempo_id?: string;
  [key: string]: any;
}

export default function AsignacionOficiales() {
  // Estados
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [oficiales, setOficiales] = useState<Oficial[]>([]);
  const [peleas, setPeleas] = useState<Pelea[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);

  // Efecto para cargar eventos y oficiales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        // Cargar eventos
        const eventosSnapshot = await getDocs(
          query(collection(db, 'eventos'), orderBy('fecha', 'desc'))
        );
        setEventos(
          eventosSnapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            } as Evento)
          )
        );

        // Cargar oficiales
        const oficialesSnapshot = await getDocs(
          query(collection(db, 'oficiales'), orderBy('nombre'))
        );
        setOficiales(
          oficialesSnapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            } as Oficial)
          )
        );
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      }
    };

    cargarDatosIniciales();
  }, []);

  // Efecto para cargar peleas cuando se selecciona un evento
  useEffect(() => {
    if (!eventoSeleccionado) {
      setPeleas([]);
      return;
    }

    const cargarPeleas = async () => {
      setCargando(true);
      try {
        const q = query(
          collection(db, 'peleas'),
          where('eventoId', '==', eventoSeleccionado),
          orderBy('orden', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const peleasData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Pelea[];

        setPeleas(peleasData);
      } catch (error) {
        console.error('Error cargando peleas:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarPeleas();
  }, [eventoSeleccionado]);

  // Funciones auxiliares
  const filtrarOficiales = (tipo: string): Oficial[] => {
    return oficiales.filter((o) => {
      if (Array.isArray(o.tipo)) {
        return o.tipo.some((t: string) => t.includes(tipo));
      }
      return o.tipo && o.tipo.includes(tipo);
    });
  };

  const actualizarPelea = (peleaId: string, campo: string, valor: string) => {
    setPeleas((prevPeleas) =>
      prevPeleas.map((pelea) =>
        pelea.id === peleaId ? { ...pelea, [campo]: valor } : pelea
      )
    );
  };

  const guardarAsignacion = async (peleaId: string) => {
    try {
      const pelea = peleas.find((p) => p.id === peleaId);
      if (!pelea) return;

      const docRef = doc(db, 'peleas', peleaId);
      await updateDoc(docRef, {
        juez1_id: pelea.juez1_id || null,
        juez2_id: pelea.juez2_id || null,
        juez3_id: pelea.juez3_id || null,
        arbitro_id: pelea.arbitro_id || null,
        tiempo_id: pelea.tiempo_id || null,
      });

      console.log('Asignación guardada correctamente');
    } catch (error) {
      console.error('Error al guardar la asignación:', error);
    }
  };

  const renderSelectOficial = (
    label: string,
    value: string | undefined,
    onChange: (value: string) => void,
    tipo: string,
    placeholder: string
  ) => (
    <div className="space-y-2">
      <label className="block text-gray-300 text-sm font-bold">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
      >
        <option value="">{placeholder}</option>
        {filtrarOficiales(tipo).map((oficial) => (
          <option key={oficial.id} value={oficial.id}>
            {oficial.nombre}
          </option>
        ))}
      </select>
    </div>
  );

  // Renderizado condicional
  if (!eventos.length) {
    return <div className="text-gray-400 p-4">Cargando eventos...</div>;
  }

  // Renderizado principal
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
      <h2 className="text-2xl font-semibold mb-6 text-white">
        Asignar Oficiales a Evento
      </h2>

      <div className="mb-6">
        <label className="block text-gray-300 text-sm font-bold mb-2">
          Seleccionar Evento
        </label>
        <select
          value={eventoSeleccionado}
          onChange={(e) => setEventoSeleccionado(e.target.value)}
          className="shadow appearance-none border border-gray-600 bg-gray-800 rounded w-full py-2 px-3 text-white"
        >
          <option value="">-- Seleccione un evento --</option>
          {eventos.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.nombre} -{' '}
              {new Date(evento.fecha.seconds * 1000).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {eventoSeleccionado && (
        <div className="space-y-6">
          <AsignacionComisionado oficiales={oficiales} />
          <AsignacionMedico oficiales={oficiales} />

          <hr className="my-6 border-gray-700" />

          <h3 className="text-xl font-semibold mb-4 text-white">
            Asignar Oficiales (Por Pelea)
          </h3>

          {cargando ? (
            <p className="text-gray-400">Cargando peleas...</p>
          ) : peleas.length > 0 ? (
            <div className="space-y-6">
              {peleas.map((pelea) => (
                <div
                  key={pelea.id}
                  className="bg-gray-700 p-4 rounded-lg border border-gray-600"
                >
                  <h4 className="text-lg font-bold text-white mb-3">
                    <span className="text-red-400">
                      {pelea.boxeadorA_Nombre?.split(' (')[0] || 'Boxeador A'}
                    </span>{' '}
                    vs{' '}
                    <span className="text-blue-400">
                      {pelea.boxeadorB_Nombre?.split(' (')[0] || 'Boxeador B'}
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-bold">
                        Jueces
                      </label>
                      {renderSelectOficial(
                        'Juez 1',
                        pelea.juez1_id,
                        (value) => actualizarPelea(pelea.id, 'juez1_id', value),
                        'Juez',
                        '-- Juez 1 --'
                      )}
                      {renderSelectOficial(
                        'Juez 2',
                        pelea.juez2_id,
                        (value) => actualizarPelea(pelea.id, 'juez2_id', value),
                        'Juez',
                        '-- Juez 2 --'
                      )}
                      {renderSelectOficial(
                        'Juez 3',
                        pelea.juez3_id,
                        (value) => actualizarPelea(pelea.id, 'juez3_id', value),
                        'Juez',
                        '-- Juez 3 --'
                      )}
                    </div>
                    <div className="space-y-2">
                      {renderSelectOficial(
                        'Árbitro',
                        pelea.arbitro_id,
                        (value) =>
                          actualizarPelea(pelea.id, 'arbitro_id', value),
                        'Árbitro',
                        '-- Seleccione árbitro --'
                      )}
                      {renderSelectOficial(
                        'Juez de Tiempo',
                        pelea.tiempo_id,
                        (value) =>
                          actualizarPelea(pelea.id, 'tiempo_id', value),
                        'Tiempo',
                        '-- Seleccione juez de tiempo --'
                      )}
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => guardarAsignacion(pelea.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Guardar Asignación
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">
              No hay peleas registradas para este evento.
            </p>
          )}
        </div>
      )}
    </div>
  );
}