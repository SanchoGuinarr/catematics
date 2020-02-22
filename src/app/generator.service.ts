import {Injectable} from '@angular/core';
import {Data, Equation, Operation, Settings} from './models';

@Injectable({
  providedIn: 'root'
})
export class GeneratorService {

  constructor() {
  }

  static shuffle(array) {
    let tmp, current, top = array.length;
    if (top) {
      while (--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
      }
    }
    return array;
  }

  static prepareEquation(data: Data, settings: Settings): Equation {
    const firstNumber = GeneratorService.getRandomInt(data.maxNum);

    let operation: Operation;
    if (data.subtraction && Math.random() < (settings.subtractingRatio / 100)) {
      operation = Operation.minus;
    } else {
      operation = Operation.plus;
    }

    let max: number;
    let operationRewardCoefficient: number;
    switch (operation) {
      case Operation.plus:
        if (data.overDecimals) {
          max = firstNumber <= 20 ? (20 - (firstNumber || 1)) : 10;
          operationRewardCoefficient = 3;
        } else if (data.overTen) {
          max = firstNumber <= 20 ? (20 - (firstNumber || 1)) : (10 - (firstNumber % 10));
          operationRewardCoefficient = 2;
        } else {
          max = (10 - (firstNumber % 10));
          operationRewardCoefficient = 1;
        }
        break;
      case Operation.minus:
        if (data.subOverDecimals) {
          max = firstNumber <= 20 ? firstNumber : 10;
          operationRewardCoefficient = 4;
        } else if (data.subOverTen) {
          max = firstNumber <= 20 ? firstNumber : firstNumber % 10;
          operationRewardCoefficient = 3;
        } else {
          max = firstNumber % 10;
          operationRewardCoefficient = 2;
        }
        break;
    }

    if (max > data.maxNum) {
      max = data.maxNum;
    }
    const secondNumber = GeneratorService.getRandomInt(max);
    let result;
    switch (operation) {
      case Operation.minus:
        result = firstNumber - secondNumber;
        break;
      case Operation.plus:
        result = firstNumber + secondNumber;
        break;
    }
    let reward = Math.floor((firstNumber + secondNumber) * Math.random() * operationRewardCoefficient * settings.rewardConstant);
    if (!reward) {
      reward = 1;
    }
    return {
      firstNumber: firstNumber,
      secondNumber: secondNumber,
      operation: operation,
      result: result,
      reward: reward,
    };
  }

  static getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max + 1));
  }
}
