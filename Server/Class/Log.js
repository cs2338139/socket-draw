//Log管理
import chalk from "chalk";
import { Unit } from "./Unit.js";

export class Log {
  static connect(string) {
    console.log(chalk.gray(Unit.getCurrentDate()), ":  ", chalk.green(string));
  }

  static disconnect(string) {
    console.log(chalk.gray(Unit.getCurrentDate()), ":  ", chalk.red(string));
  }

  static info(string) {
    console.log(chalk.gray(Unit.getCurrentDate()), ":  ", chalk.gray(string));
  }

  static other(string) {
    console.log(chalk.gray(Unit.getCurrentDate()), ":  ", chalk.white(string));
  }

  static event(string) {
    console.log(chalk.gray(Unit.getCurrentDate()), ":  ", chalk.grey(string));
  }

  static debug(string) {
    console.log(chalk.gray(Unit.getCurrentDate()), ":  ", chalk.redBright(string));
  }
}
