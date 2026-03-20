import { OrdineItem } from './ordine-item';

export interface Ordine {
  id?: number;
  numeroOrdine: number;
  dataOra?: string;
  tipoOrdine: string;
  stato: string;
  totale: number;
  telefonoCliente?: string;
  numeroTavolo?: number | null;
  indirizzoConsegna?: string | null;
  items?: OrdineItem[];
}
