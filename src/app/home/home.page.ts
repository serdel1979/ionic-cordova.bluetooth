import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { Subject } from 'rxjs';
import { BleClient, BleDevice, numbersToDataView } from '@capacitor-community/bluetooth-le';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  private isTouching: boolean = false;
  private lastTouchedButton: string | null = null;
  private elementInited$ = new Subject<boolean>();
  private isButtonTouched: boolean = false;
  private updateIntervalId: any;

  public devices: any;
  public deviceConnected: any;
  public directionLabel: string = 'Mantén presionado sobre una flecha';

  @ViewChild('button8') button8: ElementRef | undefined;
  @ViewChild('button4') button4: ElementRef | undefined;
  @ViewChild('button6') button6: ElementRef | undefined;
  @ViewChild('button2') button2: ElementRef | undefined;

  constructor(private platform: Platform, private bluetoothSerial: BluetoothSerial, private alertController: AlertController, private loadingCtrl: LoadingController) {
    this.platform.ready().then(() => {
      this.initializeBluetooth();
    });
  }

  ngOnInit() {
    this.elementInited$.subscribe(() => {});
  }

  ngAfterViewInit() {
    this.elementInited$.next(true);
  }

  async initializeBluetooth() {
    try {
      await BleClient.initialize();
      this.checkBluetoothPermissions();
    } catch (error) {
      this.presentAlert('Error', '', 'Ocurrió un error al inicializar Bluetooth: ' + error);
    }
  }

  async checkBluetoothPermissions() {
    try {
      const hasPermissions = await this.requestPermissions();
      if (hasPermissions) {
        this.activate();
      } else {
        this.presentAlert('Permisos denegados', '', 'No se pudo obtener los permisos necesarios para utilizar Bluetooth.');
      }
    } catch (error) {
      this.presentAlert('Error', '', 'Ocurrió un error al solicitar los permisos: ' + error);
    }
  }

  async requestPermissions() {
    try {
      await BleClient.requestLEScan({ services: [] }, (result) => {
        console.log('Device found', result);
      });
      return true;
    } catch (error) {
      console.error('Error requesting permissions', error);
      return false;
    }
  }

  async activate() {
    try {
      const isEnabled = await BleClient.isEnabled();
      if (isEnabled) {
        this.listDevices();
      } else {
        this.presentAlert('Error', '', 'No se pudo activar Bluetooth.');
      }
    } catch (error) {
      this.presentAlert('Error', '', 'Ocurrió un error al verificar el estado del Bluetooth: ' + error);
    }
  }



  async onListDevicesClick() {
    try {
      // Verifica si el Bluetooth está habilitado y actívalo si es necesario
      const isEnabled = await BleClient.isEnabled();
      if (!isEnabled) {
        await BleClient.enable();
      }
      this.listDevices();
    } catch (error) {
      this.presentAlert('Error', '', 'No se pudo activar Bluetooth: ' + error);
    }
  }
  



  async listDevices() {
    const loading = await this.loadingCtrl.create({
      message: 'Buscando dispositivos...',
      duration: 5000 // Opcional: duración máxima del loading spinner en milisegundos
    });
    
    await loading.present(); // Mostrar el spinner
  
    try {
      this.bluetoothSerial.list()
      .then(devs => {
        this.devices = devs;
        loading.dismiss(); // Ocultar el spinner cuando termine
      })
      .catch(async (error) => {
        await loading.dismiss(); // Ocultar el spinner en caso de error
        this.presentAlert('Error', '', 'Ocurrió un error al listar dispositivos: ' + error);
      });
  
      // Opción de uso de BleClient para el escaneo (descomentar si se necesita)
      /*
      await BleClient.requestLEScan({ services: [] }, (result) => {
        this.devices = result;
      });
  
      setTimeout(async () => {
        await BleClient.stopLEScan();
        await loading.dismiss(); // Ocultar el spinner al finalizar el escaneo
      }, 5000);
      */
  
    } catch (error) {
      await loading.dismiss(); // Ocultar el spinner en caso de error
      this.presentAlert('Error', '', 'Ocurrió un error al listar dispositivos: ' + error);
    }
  }
  
  async connect(address: any) {
    const loading = await this.loadingCtrl.create({
      message: 'Conectando...',
      duration: 5000 // Opcional: duración máxima del loading spinner en milisegundos
    });
    
    await loading.present(); // Mostrar el spinner
    this.bluetoothSerial.connect(address)
      .subscribe(
        succ => {
          this.connDev();
          loading.dismiss(); 
        },
        err => {
          this.presentAlert('Error', '', 'No se pudo conectar al dispositivo!!!');
          loading.dismiss(); 
        }
      );
  }

  connDev() {
    this.bluetoothSerial.subscribe('\n').subscribe(succ => {
      this.hundler(succ);
    });
  }

  hundler(succ: any) {
    this.deviceConnected = succ;
  }

  sendData(dataToSend: string) {
    this.bluetoothSerial.write(dataToSend).then(
      success => {
        // Acción en caso de éxito
      },
      error => {
        // Acción en caso de error
      }
    );
  }

  async presentAlert(header: string, subheader: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      subHeader: subheader,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  onButtonTouch(direction: string) {
    this.isButtonTouched = true;
    this.updateDirection(direction);
    this.updateIntervalId = setInterval(() => this.updateDirection(direction), 100);
  }

  onButtonRelease() {
    this.isButtonTouched = false;
    this.directionLabel = 'Mantén presionado sobre una flecha';
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }
  }

  private updateDirection(direction: string) {
    if (this.isButtonTouched) {
      requestAnimationFrame(() => {
        switch (direction) {
          case '8':
            this.directionLabel = 'up';
            break;
          case '4':
            this.directionLabel = 'left';
            break;
          case '6':
            this.directionLabel = 'right';
            break;
          case '2':
            this.directionLabel = 'down';
            break;
        }
        this.sendData(direction);
      });
    }
  }

  onTouchStart(event: TouchEvent) {
    this.isTouching = true;
    this.updateTouchedButton(event);
  }

  onTouchMove(event: TouchEvent) {
    if (this.isTouching) {
      this.updateTouchedButton(event);
    }
  }

  onTouchEnd() {
    this.isTouching = false;
    this.lastTouchedButton = null;
    this.directionLabel = 'Mantén presionado sobre una flecha';
  }

  private updateTouchedButton(event: TouchEvent) {
    const touch = event.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    let currentButton: string | null = null;

    if (this.button8 && this.isInsideButton(this.button8, x, y)) {
      currentButton = '8';
    } else if (this.button4 && this.isInsideButton(this.button4, x, y)) {
      currentButton = '4';
    } else if (this.button6 && this.isInsideButton(this.button6, x, y)) {
      currentButton = '6';
    } else if (this.button2 && this.isInsideButton(this.button2, x, y)) {
      currentButton = '2';
    }

    if (currentButton && currentButton !== this.lastTouchedButton) {
      this.lastTouchedButton = currentButton;
      this.directionLabel = this.getDirectionLabel(currentButton);
      this.sendData(currentButton);
    }
  }

  handleMove(event: TouchEvent, buttonNumber?: string) {
    event.preventDefault();
    if (buttonNumber) {
      this.directionLabel = this.getDirectionLabel(buttonNumber);
      this.sendData(buttonNumber);
    } else {
      const touch = event.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;

      if (this.button8 && this.isInsideButton(this.button8, x, y)) {
        this.directionLabel = 'up';
        this.sendData('8');
      } else if (this.button4 && this.isInsideButton(this.button4, x, y)) {
        this.directionLabel = 'left';
        this.sendData('4');
      } else if (this.button6 && this.isInsideButton(this.button6, x, y)) {
        this.directionLabel = 'right';
        this.sendData('6');
      } else if (this.button2 && this.isInsideButton(this.button2, x, y)) {
        this.directionLabel = 'down';
        this.sendData('2');
      } else {
        this.directionLabel = 'Mantén presionado sobre una flecha';
      }
    }
  }

  private getDirectionLabel(buttonNumber: string): string {
    switch (buttonNumber) {
      case '8': return 'up';
      case '4': return 'left';
      case '6': return 'right';
      case '2': return 'down';
      default: return 'Desliza para ver dirección';
    }
  }

  onButtonFocus(buttonNumber: string) {
    this.directionLabel = this.getDirectionLabel(buttonNumber);
    this.sendData(buttonNumber);
  }

  onButtonBlur() {
    this.directionLabel = 'Mantén presionado sobre una flecha';
  }

  private isInsideButton(button: ElementRef, x: number, y: number): boolean {
    if (!button.nativeElement) {
      return false;
    }
    const rect = button.nativeElement.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }
}


/*

En Android Studio, navega a android/app/src/main/AndroidManifest.xml. 

  <uses-permission android:name="android.permission.BLUETOOTH" />
  <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
  <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
  <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />


*/