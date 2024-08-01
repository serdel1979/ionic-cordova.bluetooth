import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';

import { AlertController } from '@ionic/angular';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  //https://ia-pplication.com/blog/ionic-bluetooth
  //ionic build
  //npx cap sync

  //npx cap open android

  private isTouching: boolean = false;
  private lastTouchedButton: string | null = null;

  private elementInited$ = new Subject<boolean>();

  public button8: ElementRef | undefined;
  public button4: ElementRef | undefined;
  public button6: ElementRef | undefined;
  public button2: ElementRef | undefined;


  @ViewChild('button8') set setButton8(el: ElementRef) {
    if (!!el) {
      this.button8 = el;
      this.elementInited$.next(true);
    }
  }

  @ViewChild('button4') set setButton4(el: ElementRef) {
    if (!!el) {
      this.button4 = el;
      this.elementInited$.next(true);
    }
  }

  @ViewChild('button6') set setButton6(el: ElementRef) {
    if (!!el) {
      this.button6 = el;
      this.elementInited$.next(true);
    }
  }

  @ViewChild('button2') set setButton2(el: ElementRef) {
    if (!!el) {
      this.button2 = el;
      this.elementInited$.next(true);
    }
  }

  directionLabel: string = 'Desliza para ver dirección';

  private isButtonTouched: boolean = false;



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

  private updateIntervalId: any;

onButtonTouch(direction: string) {
  this.isButtonTouched = true;
  this.updateDirection(direction);
  this.updateIntervalId = setInterval(() => this.updateDirection(direction), 100);
}

onButtonRelease() {
  this.isButtonTouched = false;
  this.directionLabel = 'Desliza para ver dirección';
  if (this.updateIntervalId) {
    clearInterval(this.updateIntervalId);
  }
}

  dataSend = "";

  onTouchStart(event: TouchEvent) {
    this.isTouching = true;
    this.updateTouchedButton(event);
  }

  onTouchMove(event: TouchEvent) {
    if (this.isTouching) {
      this.updateTouchedButton(event);
    }
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

  onTouchEnd() {
    this.isTouching = false;
    this.lastTouchedButton = null;
    this.directionLabel = 'Desliza para ver dirección';
  }


  ngOnInit() {
    console.log('HomePage initialized');
    this.elementInited$.subscribe(() => {
      console.log('Button 8:', this.button8);
      console.log('Button 4:', this.button4);
      console.log('Button 6:', this.button6);
      console.log('Button 2:', this.button2);
    });
  }

  ngAfterViewInit() {
    this.elementInited$.next(true);
    this.elementInited$.subscribe(() => {
      console.log('Button 8:', this.button8);
      console.log('Button 4:', this.button4);
      console.log('Button 6:', this.button6);
      console.log('Button 2:', this.button2);
    });
  }


  constructor(private bluetoothSerial: BluetoothSerial, private alertController: AlertController) { }




  sendData(dataToSend: String) {
    this.dataSend = "\n";
    this.dataSend += dataToSend;

    this.bluetoothSerial.write(this.dataSend).then(success => {
      // this.presentAlert("header","subh",success);

    }, error => {
      // this.presentAlert("header","subh",error);
    })
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


  handleMove(event: TouchEvent, buttonNumber?: string) {
    event.preventDefault(); // Previene el scroll
  
    if (buttonNumber) {
      // Si se proporciona un número de botón, es un evento de un botón específico
      this.directionLabel = this.getDirectionLabel(buttonNumber);
      this.sendData(buttonNumber);
    } else {
      // Si no hay número de botón, es el evento del ion-content
      const touch = event.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;
  
      console.log('Touch move detected', x, y);
  
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
        this.directionLabel = 'Desliza para ver dirección';
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
    this.directionLabel = 'Desliza para ver dirección';
  }






  private isInsideButton(button: ElementRef, x: number, y: number): boolean {
    //console.log(button);
    if (!button.nativeElement) {
      return false;
    }
    const rect = button.nativeElement.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }


}
