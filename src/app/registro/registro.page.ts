import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

interface DatosEnvio {
  nombre: string;
  email: string;
  fechaNacimiento: string;
  enviadoEl: string;
}

function fechaHoy(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Validador personalizado: la fecha no puede ser posterior a hoy
function fechaNoFutura(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (!valor) return null;
  return valor > fechaHoy() ? { fechaFutura: true } : null;
}

@Component({
  selector: 'app-registro',
  templateUrl: 'registro.page.html',
  styleUrls: ['registro.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
export class RegistroPage {
  public registroForm: FormGroup;
  public isSubmitting = signal<boolean>(false);
  public darkMode = signal<boolean>(false);
  public ultimoEnvio = signal<DatosEnvio | null>(null);
  public hoy = fechaHoy();

  constructor(private fb: FormBuilder, private toastCtrl: ToastController) {
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      fechaNacimiento: ['', [Validators.required, fechaNoFutura]],
      password: [
        '',
        [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)],
      ],
    });

    // Modo oscuro: recuerda la última elección o usa la preferencia del sistema
    const guardado = localStorage.getItem('modoOscuro');
    const inicial =
      guardado !== null
        ? guardado === 'true'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.aplicarModoOscuro(inicial);
  }

  get f() {
    return this.registroForm.controls;
  }

  get errorFecha(): string {
    const c = this.f['fechaNacimiento'];
    if (c.hasError('required')) return 'La fecha de nacimiento es obligatoria.';
    if (c.hasError('fechaFutura')) return 'La fecha no puede ser posterior a hoy.';
    return '';
  }

  public toggleDarkMode(): void {
    this.aplicarModoOscuro(!this.darkMode());
  }

  private aplicarModoOscuro(activo: boolean): void {
    this.darkMode.set(activo);
    document.documentElement.classList.toggle('ion-palette-dark', activo);
    localStorage.setItem('modoOscuro', String(activo));
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

  // Cifra la contraseña con SHA-256 (Web Crypto API) y la devuelve en hexadecimal
  private async cifrarPassword(password: string): Promise<string> {
    const datos = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', datos);
    return Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  public async onSubmit(): Promise<void> {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      const { password, ...resto } = this.registroForm.value;
      const payload = { ...resto, password: await this.cifrarPassword(password) };

      console.log('Payload a enviar a la API REST:', payload);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Guardamos una copia (sin la contraseña) antes de resetear el formulario
      this.ultimoEnvio.set({
        nombre: payload.nombre,
        email: payload.email,
        fechaNacimiento: payload.fechaNacimiento,
        enviadoEl: new Date().toLocaleString('es-ES'),
      });

      this.registroForm.reset();
      await this.mostrarToast('Formulario enviado correctamente', 'success');
    } catch (error) {
      console.error('Error al persistir los datos', error);
      await this.mostrarToast('Error al enviar el formulario', 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public async descargarPdf(): Promise<void> {
    const datos = this.ultimoEnvio();
    if (!datos) return;

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const [anio, mes, dia] = datos.fechaNacimiento.split('-');

    doc.setFontSize(18);
    doc.text('Datos del registro', 20, 25);

    doc.setFontSize(12);
    doc.text(`Nombre: ${datos.nombre}`, 20, 45);
    doc.text(`Correo electrónico: ${datos.email}`, 20, 55);
    doc.text(`Fecha de nacimiento: ${dia}/${mes}/${anio}`, 20, 65);
    doc.text(`Enviado el: ${datos.enviadoEl}`, 20, 75);

    doc.save('registro.pdf');
  }
}