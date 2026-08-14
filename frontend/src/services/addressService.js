import api from "./api";


/* ===========================
   DIRECCIONES DEL CLIENTE
=========================== */

export const getMisDirecciones = () =>
    api.get(`/users/direcciones/`);

export const crearDireccion = (payload) =>
    api.post(`/users/direcciones/`, payload);

export const eliminarDireccion = (id) =>
    api.delete(`/users/direcciones/${id}/`);

export const marcarPredeterminada = (id) =>
    api.put(`/users/direcciones/${id}/`, { predeterminada: true });
