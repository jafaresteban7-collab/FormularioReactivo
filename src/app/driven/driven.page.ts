import { Component, Directive, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormsModule,
  NG_VALIDATORS,
  NgForm,
  NgModel,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  ToastController,
} from '@ionic/angular';

function fechaHoy(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// En template-driven, un validador personalizado se implementa como directiva
@Directive({
  selector: '[fechaNoFutura]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => FechaNoFuturaDirective),
      multi: true,
    },
  ],
})
export class FechaNoFuturaDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const valor = control.value;
    if (!valor) return null;
    return valor > fechaHoy() ? { fechaFutura: true } : null;
  }
}

@Component({
  selector: 'app-driven',
  templateUrl: 'driven.page.html',
  styleUrls: ['driven.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    FechaNoFuturaDirective,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
  ],
})
export class DrivenPage {
  // El modelo es un objeto normal: ngModel lo mantiene sincronizado con la vista
  public model = { nombre: '', email: '', fechaNacimiento: '', password: '' };
  public isSubmitting = signal<boolean>(false);
  public hoy = fechaHoy();

  constructor(private toastCtrl: ToastController) {
    // Mantiene el modo oscuro elegido en la otra página
    const guardado = localStorage.getItem('modoOscuro');
    const oscuro =
      guardado !== null
        ? guardado === 'true'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('ion-palette-dark', oscuro);
  }

  public errorFecha(c: NgModel): string {
    if (c.hasError('required')) return 'La fecha de nacimiento es obligatoria.';
    if (c.hasError('fechaFutura')) return 'La fecha no puede ser posterior a hoy.';
    return '';
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  private async cifrarPassword(password: string): Promise<string> {
    const datos = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', datos);
    return Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  public async onSubmit(form: NgForm): Promise<void> {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      const { password, ...resto } = this.model;
      const payload = { ...resto, password: await this.cifrarPassword(password) };

      console.log('Payload (template-driven):', payload);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      form.resetForm({ nombre: '', email: '', fechaNacimiento: '', password: '' });
      await this.mostrarToast('Formulario enviado correctamente', 'success');
    } catch (error) {
      console.error('Error al persistir los datos', error);
      await this.mostrarToast('Error al enviar el formulario', 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}