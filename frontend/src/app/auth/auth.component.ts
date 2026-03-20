import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  @Output() loginChange = new EventEmitter<boolean>();
  username = '';
  password = '';
  saved = false;
  errore = '';

  constructor(private authService: AuthService) {
    // Start fresh on every login screen visit
    this.authService.clearCredentials();
    this.username = '';
    this.password = '';
    this.saved = false;
  }

  save(): void {
    this.errore = '';
    if (!this.username || !this.password) {
      this.saved = false;
      this.loginChange.emit(false);
      return;
    }

    this.authService.verifyCredentials({ username: this.username, password: this.password })
      .subscribe({
        next: (isValid) => {
          if (isValid) {
            this.authService.setCredentials({ username: this.username, password: this.password });
            this.saved = true;
            this.loginChange.emit(true);
          } else {
            this.errore = 'Credenziali non valide.';
            this.loginChange.emit(false);
          }
        },
        error: () => {
          this.errore = 'Credenziali non valide (Non autorizzato).';
          this.loginChange.emit(false);
        }
      });
  }

  clear(): void {
    this.authService.clearCredentials();
    this.username = '';
    this.password = '';
    this.saved = false;
    this.loginChange.emit(false);
  }
}
