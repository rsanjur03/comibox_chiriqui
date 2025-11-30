import React from 'react';
import '../styles/licenses.css';

interface LicenseCardBackProps {
    numeroLicencia: string;
    anio: number;
}

export const LicenseCardBack: React.FC<LicenseCardBackProps> = ({ numeroLicencia, anio }) => {
    // ✅ URL robusta (local + producción)
    // En React usamos window.location si está disponible, o un default
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + '/' : 'http://localhost:4321/';

    const urlVerificacion = `${baseUrl}verificar-licencia?codigo=${encodeURIComponent(numeroLicencia)}`;

    // ✅ QR compatible con html2canvas (SIN CORS)
    const qrURL = `https://quickchart.io/qr?size=220&text=${encodeURIComponent(urlVerificacion)}`;

    return (
        <div className="license-card-back">
            {/* FRANJA SUPERIOR */}
            <div className="back-header">
                <span>COMISIÓN DE BOXEO PROFESIONAL DE CHIRIQUÍ</span>
            </div>

            {/* CUERPO */}
            <div className="back-body">
                {/* IZQUIERDA: QR GRANDE */}
                <div className="back-left">
                    <div className="back-qr-frame">
                        <img src={qrURL} alt="QR verificación licencia" className="back-qr" />
                    </div>
                    <p className="back-qr-text">
                        Escanee este código para verificar en línea la validez de esta licencia.
                    </p>
                </div>

                {/* DERECHA: DATOS Y TEXTO LEGAL */}
                <div className="back-right">
                    <div className="back-block">
                        <h3>Datos de la licencia</h3>
                        <p><strong>Número:</strong> {numeroLicencia}</p>
                        <p><strong>Año:</strong> {anio}</p>
                        <p><strong>Estado:</strong> VIGENTE si el sistema así lo indica.</p>
                    </div>

                    <div className="back-block">
                        <h3>Contacto oficial</h3>
                        <p>Para consultas o verificación adicional:</p>
                        <p>
                            <strong>COMIBOX Chiriquí</strong><br />
                            Correo: <span>info@comiboxchiriqui.com</span><br />
                            Teléfono: <span>+507 6671-4646</span>
                        </p>
                    </div>

                    <div className="back-block back-legal">
                        <h3>Uso del documento</h3>
                        <p className="uso-doc">
                            Esta licencia es personal e intransferible. Soportada por la base de datos
                            oficial de COMIBOX Chiriquí. Cualquier alteración, falsificación o uso indebido
                            puede ser sancionado según la normativa vigente.
                        </p>
                    </div>
                </div>
            </div>

            {/* PIE */}
            <div className="back-footer">
                Válida únicamente para eventos autorizados por COMIBOX Chiriquí.
            </div>
        </div>
    );
};
