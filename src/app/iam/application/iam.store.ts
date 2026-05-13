import { Injectable, signal } from '@angular/core';
import { UserRole } from '../domain/model/user-role';

export interface AuthSession {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class IamStore {
  private readonly currentUserSignal = signal<AuthSession | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  private readonly successSignal = signal<string | null>(null);
  readonly success = this.successSignal.asReadonly();

  signIn(email: string, password: string, role: UserRole): boolean {
    this.clearMessages();

    if (!email || !password) {
      this.errorSignal.set('Ingrese correo electrónico y contraseña.');
      return false;
    }

    this.currentUserSignal.set({
      id: 1,
      fullName: role === 'Personal Administrativo' ? 'Administrador Hospitalario' : 'Personal Médico',
      email,
      role
    });

    this.successSignal.set('Inicio de sesión exitoso.');
    return true;
  }

  register(fullName: string, email: string, password: string, role: UserRole): boolean {
    this.clearMessages();

    if (!fullName || !email || !password) {
      this.errorSignal.set('Complete todos los campos requeridos.');
      return false;
    }

    this.currentUserSignal.set({
      id: 1,
      fullName,
      email,
      role
    });

    this.successSignal.set('Registro exitoso.');
    return true;
  }

  signOut(): void {
    this.currentUserSignal.set(null);
    this.clearMessages();
  }

  private clearMessages(): void {
    this.errorSignal.set(null);
    this.successSignal.set(null);
  }
}
