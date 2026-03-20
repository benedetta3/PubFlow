import { Component } from '@angular/core';
import { MenuService } from '../shared/services/menu.service';
import { MenuItem } from '../shared/models/menu-item';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {
  items: MenuItem[] = [];
  loading = false;
  errorMessage = '';

  get menuRaggruppato(): Array<{ categoria: string; items: MenuItem[] }> {
  const ordine = ['BEVANDE', 'BIRRE', 'FRITTI', 'PANINI', 'DOLCI'];
    const mappa = new Map<string, MenuItem[]>();
    this.items.forEach((item) => {
      const categoria = item.categoria?.toUpperCase() || 'ALTRO';
      const list = mappa.get(categoria) ?? [];
      list.push(item);
      mappa.set(categoria, list);
    });
    const ordinati: Array<{ categoria: string; items: MenuItem[] }> = [];
    ordine.forEach((categoria) => {
      const items = mappa.get(categoria);
      if (items && items.length > 0) {
        ordinati.push({ categoria, items });
        mappa.delete(categoria);
      }
    });
    [...mappa.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([categoria, items]) => {
        ordinati.push({ categoria, items });
      });
    return ordinati;
  }

  constructor(private menuService: MenuService) {}

  loadMenu(): void {
    this.loading = true;
    this.errorMessage = '';

    this.menuService.getAll().subscribe({
      next: (items) => {
        this.items = items ?? [];
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.errorMessage = 'Errore nel caricamento del menu.';
        this.loading = false;
      }
    });
  }

  addAvailability(item: MenuItem): void {
    if (item.quantitaDisponibile === undefined) {
      item.quantitaDisponibile = 0;
    }
    item.quantitaDisponibile++;
    item.disponibile = true;
    
    this.menuService.update(item.id, item).subscribe({
      next: (updatedItem) => {
        item.quantitaDisponibile = updatedItem.quantitaDisponibile;
        item.disponibile = updatedItem.disponibile;
      },
      error: () => {
        this.errorMessage = "Errore durante l'aggiornamento della disponibilità.";
        // Revert
        item.quantitaDisponibile!--;
        if (item.quantitaDisponibile === 0) item.disponibile = false;
      }
    });
  }

  reduceAvailability(item: MenuItem): void {
    if (!item.quantitaDisponibile || item.quantitaDisponibile <= 0) {
      return;
    }
    item.quantitaDisponibile--;
    if (item.quantitaDisponibile === 0) {
      item.disponibile = false;
    }

    this.menuService.update(item.id, item).subscribe({
      next: (updatedItem) => {
        item.quantitaDisponibile = updatedItem.quantitaDisponibile;
        item.disponibile = updatedItem.disponibile;
      },
      error: () => {
        this.errorMessage = "Errore durante l'aggiornamento della disponibilità.";
        // Revert
        item.quantitaDisponibile!++;
        item.disponibile = true;
      }
    });
  }
}
