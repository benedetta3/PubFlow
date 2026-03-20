export interface Prenotazione {
  id?: number;
  numeroPrenotazione: number;
  nomeCliente: string;
  telefonoCliente?: string;
  numeroPersone: number;
  data: string;
  ora: string;
  stato: string;
}
