import React from 'react';
import '../styles/licenses.css';

interface BoxerLicenseProps {
    id: string;
    nombreLegal: string;
    cedula: string;
    paisProcedencia: string;
    fechaNacimiento: string;
    peso: string;
    fotoURL?: string;
    numeroLicencia: string;
}

export const LicenseCardBoxer: React.FC<BoxerLicenseProps> = ({
    id,
    nombreLegal,
    cedula,
    paisProcedencia,
    fechaNacimiento,
    peso,
    fotoURL,
    numeroLicencia
}) => {
    const anioActual = new Date().getFullYear();
    const expiraTexto = `Diciembre ${anioActual}`;

    return (
        <div className="license-card" id={`license-${id}`}>
            {/* ========== HEADER ========== */}
            <div className="license-header">
                <div className="license-header-boxing">BOXING</div>
                <div className="license-header-sub">LICENCIA DE BOXEADOR</div>
            </div>

            {/* ========== BODY ========== */}
            <div className="license-body">
                {/* IZQUIERDA */}
                <div className="license-left">
                    <img src="/img/logo-comiboxch.jpg" className="license-logo" alt="Logo" />
                    <img src="/img/guantes.png" className="license-gloves" alt="Guantes" />

                    <div className="license-num">
                        No. Licencia<br />
                        <strong>{numeroLicencia}</strong>
                    </div>
                </div>

                {/* CENTRO (FOTO FIJA SIEMPRE IGUAL) */}
                <div className="license-center">
                    <div className="license-photo-frame">
                        {fotoURL ? (
                            <img src={fotoURL} className="license-photo" alt="Foto" />
                        ) : (
                            <div className="license-photo-placeholder">FOTO</div>
                        )}
                    </div>
                </div>

                {/* DERECHA */}
                <div className="license-right">
                    <table className="license-data-table">
                        <tbody>
                            <tr><th>Nombre</th><td>{nombreLegal}</td></tr>
                            <tr><th>Cédula</th><td>{cedula}</td></tr>
                            <tr><th>País</th><td>{paisProcedencia}</td></tr>
                            <tr><th>Nac.</th><td>{fechaNacimiento}</td></tr>
                            <tr><th>Peso</th><td>{peso}</td></tr>
                            <tr><th>Exp.</th><td>{expiraTexto}</td></tr>
                        </tbody>
                    </table>

                    <img src="/img/firma-sola.png" className="license-signature" alt="Firma" />
                </div>
            </div>

            {/* ========== FOOTER ========== */}
            <div className="license-footer">
                COMISIÓN DE BOXEO PROFESIONAL DE CHIRIQUÍ
            </div>
        </div>
    );
};
