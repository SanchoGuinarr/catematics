/* tslint:disable:no-trailing-whitespace one-line whitespace */
import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Cat, Data, Equation, Operation, Settings} from './models';
import {GeneratorService} from './generator.service';
import {interval, Subscription, timer} from 'rxjs';
import {take} from 'rxjs/operators';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('result', [
      state('normal', style({
        backgroundColor: 'white'
      })),
      state('right', style({
        backgroundColor: 'chartreuse'
      })),
      state('wrong', style({
        backgroundColor: 'red'
      })),
      transition('* => normal', [
        animate('1s')
      ]),
      transition('normal => *', [
        animate('0.2s')
      ]),
    ]),
  ],
})

export class AppComponent implements OnInit, OnDestroy {

  title = 'catematics';

  readonly defaultSettings = {
    gameLength: 2,
    catComputingRatio: 70,
    catComputingTime: 1,
    subtractingRatio: 70,
    rewardConstant: 2,
  };

  readonly defaultPrices = {
    subtraction: 25,
    overTen: 50,
    overDecimals: 250,
    subOverTen: 150,
    subOverDecimals: 350,
  };

  form: FormGroup;
  settingsForm: FormGroup;

  data: Data;
  nameEditing = false;
  catComputing = false;
  computingCatKey: number;
  settingsOpen = false;
  displayNextCat = false;
  nextNumPrice = 2;
  nextCatPrice = 50;
  purchasedCats: Cat[];
  settings: Settings;
  actEquation: Equation;
  resultEvaluation = 'normal';
  victory = false;
  victorySpeeder = 1;
  prices = this.defaultPrices;

  @ViewChild('result',{static: false}) resultInput: ElementRef;

  messages: string[] = [];
  moveSubscription: Subscription;

  constructor(
    private generator: GeneratorService
  ) {
    if (localStorage.getItem('catematicsSave')) {
      this.data = JSON.parse(localStorage.getItem('catematicsSave'));
    } else {
      this.data = {
        money: 0,
        maxNum: 1,
        subtraction: false,
        unicorn: 0,
        overDecimals: false,
        overTen: false,
        subOverDecimals: false,
        subOverTen: false,
        cats: [],
        cat: -1,
      };

      const randomCats = GeneratorService.shuffle(Array.from(Array(16).keys()));

      for (let i = 0; i < 10; i++) {
        this.data.cats.push({
          id: randomCats[i],
          purchased: false,
          name: '',
        });
      }
    }

    if (localStorage.getItem('catematicsSettings')) {
      this.settings = JSON.parse(localStorage.getItem('catematicsSettings'));
    } else {
      this.settings = this.defaultSettings;
    }

    this.actualizePrices();

    this.form = new FormGroup({
      result: new FormControl(''),
    });

    this.settingsForm = new FormGroup({
      gameLength: new FormControl(this.settings.gameLength,[Validators.required]),
      catComputingRatio: new FormControl(this.settings.catComputingRatio,[Validators.required]),
      catComputingTime: new FormControl(this.settings.catComputingTime,[Validators.required]),
      subtractingRatio: new FormControl(this.settings.subtractingRatio,[Validators.required]),
      rewardConstant: new FormControl(this.settings.rewardConstant,[Validators.required]),
      password: new FormControl('',[Validators.required]),
    });

    this.actualizeCats();

  }

  ngOnInit(): void {
    this.generateNewNumbers(true);
  }

  generateNewNumbers(catCheck: boolean) {
    this.form.controls.result.setValue('');
    this.actEquation = GeneratorService.prepareEquation(this.data, this.settings);
    if(catCheck) {
      this.checkCatComputing();
    }
  }

  evaluate() {
  //  this.moveSubscription.unsubscribe();
    if (Number(this.form.controls.result.value) === this.actEquation.result) {
      this.data.money = this.data.money + this.actEquation.reward;
      this.sendMessage(
        `Spočítáno ${this.actEquation.firstNumber} ${this.actEquation.operation} ${this.actEquation.secondNumber} = ${this.actEquation.result}. Dostáváš ${this.actEquation.reward} peněz.`);
      localStorage.setItem('catematicsSave', JSON.stringify(this.data));
      this.generateNewNumbers(true);
      this.resultEvaluation = 'right';
    } else {
      this.resultEvaluation = 'wrong';
      // this.sendMessage('Bohužel, výsledek je špatně.');
    }
    setTimeout(() => {
      this.resultEvaluation = 'normal';
    }, (this.settings.catComputingTime * 200));

    this.form.controls.result.setValue('');
  }

  nextEquation() {
    // this.moveCats();

//    this.testGenerator();

    this.generateNewNumbers(false);
  }

  buy(price: number, type: string) {
    if (price > this.data.money) {
      this.sendMessage('Bohužel, nemáte dost peněz.');
    }
    this.data.money -= price;
    switch (type) {
      case 'maxNum':
        this.data.maxNum++;
        break;
      case 'subtraction':
        this.data.subtraction = true;
        break;
      case 'overTen':
        this.data.overTen = true;
        break;
      case 'overDecimals':
        this.data.overDecimals = true;
        break;
      case 'subOverTen':
        this.data.subOverTen = true;
        break;
      case 'subOverDecimals':
        this.data.subOverDecimals = true;
        break;
      case 'cat':
        this.data.cat++;
        this.data.cats[this.data.cat].purchased = true;
        this.nameEditing = true;
        break;
    }

    this.actualizeCats();
  }

  public computeNumberPrice(): number {
    return (this.data.maxNum + 1) * (this.data.maxNum + 1);
  }

  private checkCatComputing() {
    if (this.victory || (this.data.cat >= 0 && Math.random() < (this.settings.catComputingRatio/100))) {
      let checkNumber: number;
      // Problém je ten, že když jako číslo podle kterého určuju co kočka spočítá
      // je cokoli jiného než firstNumber, ztrácí se náhodnost. Např. když je to výsledek,
      // tak kočky s nízkým číslem počítají jen málo příkladů, protože výsledků s nízkými čísly je prostě méně.
      switch (this.actEquation.operation) {
        case Operation.plus:
          checkNumber = this.actEquation.firstNumber;
          break;
        case Operation.minus:
          checkNumber = this.actEquation.firstNumber;
          break;
      }

      if (this.victory || ((this.data.cat + 1) * this.settings.gameLength >= checkNumber)) {
        this.computingCatKey = Math.floor((Math.abs(checkNumber - 1)) / this.settings.gameLength);
        if (this.computingCatKey > this.data.cat){
          this.computingCatKey = this.purchasedCats[this.purchasedCats.length - 1].id;

        }
        let catComputingDuration;
        if(this.victory){
          this.actEquation.reward = Math.floor(this.actEquation.reward * this.victorySpeeder * 1.5);
          catComputingDuration = this.settings.catComputingTime / this.victorySpeeder;
          this.victorySpeeder = this.victorySpeeder + 0.08;
        }else{
          catComputingDuration = this.settings.catComputingTime;
        }

        this.sendMessage(this.data.cats[this.computingCatKey].name
          + ` počítá ${this.actEquation.firstNumber} ${this.actEquation.operation} ${this.actEquation.secondNumber} = ${this.actEquation.result}. Dostáváš ${this.actEquation.reward} peněz.`);
        this.data.money += this.actEquation.reward;
        this.catComputing = true;

        if(this.data.money > 1000000){
          this.data.money =  1000000;
          this.nameEditing = true; // aby se disablovali nakupovací tlačítka
          this.victory = false;
        }
        setTimeout(() => {
          this.catComputing = false;
          this.generateNewNumbers(true);
        }, (catComputingDuration * 1000));
      }
    }
  }

  sendMessage(message: string) {
    this.messages.push(message);
  }

  editName() {
    this.data.cats[this.data.cat].name = this.form.controls.result.value;
    this.nameEditing = false;
    this.form.controls.result.setValue('');
  }

  getComputingCat() {
    return this.data.cats[this.computingCatKey].id;
  }

  private actualizeCats(){
    this.nextCatPrice = (this.data.cat + 2) * 25 * this.settings.gameLength;
    this.nextNumPrice = (this.data.maxNum + 1) * (this.data.maxNum + 1);
    this.purchasedCats = this.data.cats.filter(c => c.purchased);
    this.displayNextCat =
      (this.data.cat < 9 && this.data.maxNum >=
        (((this.data.cat) + 3) * this.settings.gameLength));
    if (this.data.cat >= 9){
      this.victory = true;
    }
  }


  reset() {
    localStorage.removeItem('catematicsSave');
    window.location.reload();
  }

  saveSettings() {
    if(this.settingsForm.valid && this.settingsForm.get('password').value.toString().toLowerCase() === 'matrix') {
      const formData = this.settingsForm.getRawValue();
      delete formData.password;
      this.settings = formData;
      localStorage.setItem('catematicsSettings', JSON.stringify(this.settings));
      this.settingsOpen = false;
      this.actualizePrices();
    }else{
      this.settingsForm.get('password').setValue('To není ono.');
    }
  }

  resetSettings() {
    this.settingsForm.patchValue(this.defaultSettings);
  }

  private actualizePrices() {
    this.prices = {
      subtraction: this.defaultPrices.subtraction * this.settings.gameLength,
      overTen: this.defaultPrices.overTen * this.settings.gameLength,
      overDecimals: this.defaultPrices.overDecimals * this.settings.gameLength,
      subOverTen: this.defaultPrices.subOverTen * this.settings.gameLength,
      subOverDecimals: this.defaultPrices.subOverDecimals * this.settings.gameLength,
    };
  }

  moveCats() {
    const avatarSpace = 100;
    const random = (min: number, max: number) => Math.random() * (max - min) + min;



    /* Every avatar will move on it's own: */
    const keyframes = (index: number): Keyframe[] => {
      return [
        /* It starts in a random position: */
        {transform: `translate(0px, 0px) scale(0.3) `},
       // {transform: `translate(0px, 0px) scale(1) rotate(0deg)`},

        {transform: `translate(0px, 0px) scale(1) `},
       // {transform: `translate(${random(1,100)}%, ${random(1, 100)}%) scale(1) rotate(${random(-180, 180)}deg)`},

        /* ...and ends up in a carefully calculated place: */
     //   {transform: `translate(${(index - 1) * avatarSpace}px, -120px) scale(1)`}
      ];
    };

    /* Every avatar will move with it's own speed */
    const options = (): KeyframeAnimationOptions => ({
      duration: random(400, 2000),
      easing: 'ease-in-out',
      fill: 'forwards'
    });

    /* Ok, not let's start moving! */
 //   this.moveSubscription = interval(2000).subscribe(_ => {
      timer(0, 125)                                        // Staggering animation
        .pipe(
          take(this.data.cat + 1)
        )
        .subscribe(index => {
          document.getElementById(`cat_${index}`)   // Web Animations API
            .animate(keyframes(index), options());     // - not that complex, right?
        });
 //   });
  }

  ngOnDestroy(): void {
    if(this.moveSubscription){
      this.moveSubscription.unsubscribe();
    }
  }

  private testGenerator() {
    this.messages = [];
    const a = this.form.get('result').value.split(':');
    switch (Number(a[0])) {
      case 1:
        this.data.maxNum = Number(a[1]);
        this.data.subtraction = false;
        this.data.overTen = false;
        this.data.overDecimals= false;
        this.data.subOverTen= false;
        this.data.subOverDecimals= false;
        break;
      case 2:
        this.data.maxNum = Number(a[1]);
        this.data.subtraction = false;
        this.data.overTen = true;
        this.data.overDecimals= false;
        this.data.subOverTen= false;
        this.data.subOverDecimals= false;
        break;
      case 3:
        this.data.maxNum = Number(a[1]);
        this.data.subtraction = false;
        this.data.overTen = true;
        this.data.overDecimals= true;
        this.data.subOverTen= false;
        this.data.subOverDecimals= false;
        break;
      case 4:
        this.data.maxNum = Number(a[1]);
        this.data.subtraction = true;
        this.data.overTen = false;
        this.data.overDecimals= false;
        this.data.subOverTen= false;
        this.data.subOverDecimals = false;
        this.settings.subtractingRatio = 100;
        break;
      case 5:
        this.data.maxNum = Number(a[1]);
        this.data.subtraction = true;
        this.data.overTen = false;
        this.data.overDecimals= false;
        this.data.subOverTen= true;
        this.data.subOverDecimals = false;
        this.settings.subtractingRatio = 100;
        break;
      case 6:
        this.data.maxNum = Number(a[1]);
        this.data.subtraction = true;
        this.data.overTen = false;
        this.data.overDecimals= false;
        this.data.subOverTen= true;
        this.data.subOverDecimals = true;
        this.settings.subtractingRatio = 100;
        break;
    }
    for (let i = 0; i < 50; i++) {
      this.actEquation = GeneratorService.prepareEquation(this.data, this.settings);
      this.sendMessage(
      `${this.actEquation.firstNumber} ${this.actEquation.operation} ${this.actEquation.secondNumber} = ${this.actEquation.result}. Reward: ${this.actEquation.reward}`);
    }
  }
}
