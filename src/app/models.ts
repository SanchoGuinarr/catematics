export enum Operation {
  plus = '+',
  minus = '-'
}

export interface Data {
  money: number;
  maxNum: number;
  unicorn: number;
  subtraction: boolean;
  overTen: boolean;
  overDecimals: boolean;
  subOverDecimals: boolean;
  subOverTen: boolean;
  cats: Cat[];
  cat: number;
}

export interface Cat {
  id: number;
  purchased: boolean;
  name: string;
}

export interface Settings {
  gameLength: number;
  rewardConstant: number;
  catComputingRatio: number;
  catComputingTime: number;
  subtractingRatio: number;
}

export interface Equation {
  firstNumber: number;
  secondNumber: number;
  operation: Operation;
  reward: number;
  result: number;
}

