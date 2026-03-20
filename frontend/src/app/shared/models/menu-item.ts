export interface MenuItem {
  id?: number;
  nome: string;
  descrizione?: string;
  prezzo: number;
  categoria: string;
  disponibile: boolean;
  quantitaDisponibile: number;
  custom?: boolean;
}
