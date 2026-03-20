import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const authHeader = this.authService.getAuthorizationHeader();
    if (!authHeader) {
      return next.handle(req);
    }

    const clone = req.clone({
      setHeaders: {
        Authorization: authHeader
      }
    });

    return next.handle(clone);
  }
}
