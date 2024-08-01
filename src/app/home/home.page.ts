import { Component } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';

import { AlertController } from '@ionic/angular';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
//https://ia-pplication.com/blog/ionic-bluetooth

  private startX: number | null = null;
  private startY: number | null = null;


  dataSend = "";


  constructor(private bluetoothSerial: BluetoothSerial, private alertController: AlertController) {}



  sendData(dataToSend: String) {
    this.dataSend = "\n";
    this.dataSend += dataToSend;

    this.bluetoothSerial.write(this.dataSend).then(success => {
        this.presentAlert("header","subh",success);
    }, error => {
        this.presentAlert("header","subh",error);
    })
}



  async presentAlert(header: string, subheader: string, message: string ) {
    const alert = await this.alertController.create({
      header: header,
      subHeader: subheader,
      message: message,
      buttons: ['OK']
    });
  
    await alert.present();
  }










  handleMove(event: TouchEvent) {
    if (!this.startX || !this.startY) {
      // Inicia la captura del punto de inicio
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
      return;
    }

    // Captura el punto final
    const endX = event.touches[0].clientX;
    const endY = event.touches[0].clientY;

    // Calcula la diferencia
    const diffX = endX - this.startX;
    const diffY = endY - this.startY;

    // Determina la dirección
    let direction = '';

    if (Math.abs(diffX) > Math.abs(diffY)) {
      direction = diffX > 0 ? 'Right' : 'Left';
    } else {
      direction = diffY > 0 ? 'Down' : 'Up';
    }

    // Muestra la dirección
    document.getElementById('direction-label')!.textContent = `Dirección: ${direction}`;

    // Reinicia el punto de inicio
    this.startX = null;
    this.startY = null;
  }

  

}
