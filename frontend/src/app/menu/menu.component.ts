import { Component } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
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
  saving = false;
  errorMessage = '';
  private pendingUpdates = new Map<number, MenuItem>();
  private readonly categorieBase = ['BEVANDE', 'BIRRE', 'FRITTI', 'PANINI', 'DOLCI'];
  private creatingCategorie = new Set<string>();
  private newItemDrafts = new Map<string, MenuItem>();

  get menuRaggruppato(): Array<{ categoria: string; items: MenuItem[] }> {
    const ordine = [...this.categorieBase];
    const mappa = new Map<string, MenuItem[]>();
    this.items.forEach((item) => {
      const categoria = item.categoria?.toUpperCase() || 'ALTRO';
      const list = mappa.get(categoria) ?? [];
      list.push(item);
      mappa.set(categoria, list);
    });
    const ordinati: Array<{ categoria: string; items: MenuItem[] }> = [];
    ordine.forEach((categoria) => {
      const items = mappa.get(categoria) ?? [];
      ordinati.push({ categoria, items });
      mappa.delete(categoria);
    });
    [...mappa.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([categoria, items]) => {
        ordinati.push({ categoria, items });
      });
    return ordinati;
  }

  constructor(private menuService: MenuService) {}

  get hasPendingChanges(): boolean {
    return this.pendingUpdates.size > 0;
  }

  loadMenu(): void {
    this.loading = true;
    this.errorMessage = '';

    this.menuService.getAll().subscribe({
      next: (items) => {
        this.items = items ?? [];
        this.pendingUpdates.clear();
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
    if (item.id === undefined) {
      return;
    }
    if (item.quantitaDisponibile === undefined) {
      item.quantitaDisponibile = 0;
    }
    item.quantitaDisponibile++;
    item.disponibile = true;
    this.pendingUpdates.set(item.id, { ...item });
  }

  reduceAvailability(item: MenuItem): void {
    if (item.id === undefined) {
      return;
    }
    if (!item.quantitaDisponibile || item.quantitaDisponibile <= 0) {
      return;
    }
    item.quantitaDisponibile--;
    if (item.quantitaDisponibile === 0) {
      item.disponibile = false;
    }
    this.pendingUpdates.set(item.id, { ...item });
  }

  saveChanges(): void {
    if (this.saving || this.pendingUpdates.size === 0) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const updates = Array.from(this.pendingUpdates.values());
  const updateIds = updates.map((item) => item.id as number);

    forkJoin(
      updates.map((item) =>
        this.menuService.update(item.id, item).pipe(
          catchError(() => of({ error: true, id: item.id }))
        )
      )
    ).subscribe({
      next: (results) => {
        const failedIds: number[] = [];

        results.forEach((result, index) => {
          if ((result as { error?: boolean }).error) {
            failedIds.push(updateIds[index]);
            return;
          }

          const updatedItem = result as MenuItem;
          const existing = this.items.find((i) => i.id === updatedItem.id);
          if (existing) {
            existing.quantitaDisponibile = updatedItem.quantitaDisponibile;
            existing.disponibile = updatedItem.disponibile;
          }
          if (updatedItem.id !== undefined) {
            this.pendingUpdates.delete(updatedItem.id);
          }
        });

        if (failedIds.length > 0) {
          this.errorMessage = 'Alcune modifiche non sono state salvate.';
        }

        this.saving = false;
      },
      error: () => {
        this.errorMessage = 'Errore durante il salvataggio delle modifiche.';
        this.saving = false;
      }
    });
  }

  getDraft(categoria: string): MenuItem {
    const key = categoria.toUpperCase();
    const existing = this.newItemDrafts.get(key);
    if (existing) {
      return existing;
    }
    const draft: MenuItem = {
      nome: '',
      descrizione: '',
      prezzo: 0,
      categoria: key,
      disponibile: false,
      quantitaDisponibile: 0
    };
    this.newItemDrafts.set(key, draft);
    return draft;
  }

  isCreating(categoria: string): boolean {
    return this.creatingCategorie.has(categoria.toUpperCase());
  }

  createItem(categoria: string): void {
    const key = categoria.toUpperCase();
    if (this.isCreating(key)) {
      return;
    }
    const draft = this.getDraft(key);
    if (!draft.nome.trim()) {
      this.errorMessage = 'Inserisci il nome del prodotto.';
      return;
    }
    if (!draft.prezzo || draft.prezzo <= 0) {
      this.errorMessage = 'Inserisci un prezzo valido.';
      return;
    }
    if (draft.quantitaDisponibile < 0) {
      this.errorMessage = 'La quantità non può essere negativa.';
      return;
    }

    this.errorMessage = '';
    this.creatingCategorie.add(key);
    const payload: MenuItem = {
      nome: draft.nome.trim(),
      descrizione: draft.descrizione?.trim() || '',
      prezzo: draft.prezzo,
      categoria: key,
      quantitaDisponibile: draft.quantitaDisponibile ?? 0,
      disponibile: (draft.quantitaDisponibile ?? 0) > 0,
      custom: true
    };

    this.menuService.create(payload).subscribe({
      next: (created) => {
        this.items.push(created);
        this.newItemDrafts.set(key, {
          nome: '',
          descrizione: '',
          prezzo: 0,
          categoria: key,
          disponibile: false,
          quantitaDisponibile: 0
        });
        this.creatingCategorie.delete(key);
      },
      error: () => {
        this.errorMessage = 'Errore durante la creazione del prodotto.';
        this.creatingCategorie.delete(key);
      }
    });
  }

  canDelete(item: MenuItem): boolean {
    return item.custom === true && item.id !== undefined;
  }

  deleteItem(item: MenuItem): void {
    if (!this.canDelete(item)) {
      return;
    }
    this.menuService.delete(item.id).subscribe({
      next: () => {
        this.items = this.items.filter((i) => i.id !== item.id);
        this.pendingUpdates.delete(item.id as number);
      },
      error: () => {
        this.errorMessage = 'Errore durante l\'eliminazione del prodotto.';
      }
    });
  }

  trackByCategoria(_: number, gruppo: { categoria: string }): string {
    return gruppo.categoria;
  }

  trackByItem(_: number, item: MenuItem): number | string {
    return item.id ?? item.nome;
  }
}
