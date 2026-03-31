import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { MenuComponent } from './menu/menu.component';
import { OrdiniComponent } from './ordini/ordini.component';
import { PrenotazioniComponent } from './prenotazioni/prenotazioni.component';
import { AuthComponent } from './auth/auth.component';
import { AuthInterceptor } from './shared/services/auth.interceptor';
import { ServizioComponent } from './servizio/servizio.component';
import { TavoliStaffComponent } from './tavoli-staff/tavoli-staff.component';
import { GestioneStaffComponent } from './gestione-staff/gestione-staff.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    OrdiniComponent,
    PrenotazioniComponent,
    AuthComponent,
    ServizioComponent,
    TavoliStaffComponent,
    GestioneStaffComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
