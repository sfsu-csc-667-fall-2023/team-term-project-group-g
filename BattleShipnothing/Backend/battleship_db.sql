-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`Players`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Players` (
  `PlayerID` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Username` VARCHAR(255) NOT NULL,
  `Email` VARCHAR(255) NOT NULL,
  `Password` VARCHAR(255) NOT NULL,
  `RegistrationDate` DATETIME NOT NULL,
  `LastLoginDate` DATETIME NULL,
  PRIMARY KEY (`PlayerID`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`Games`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Games` (
  `GameID` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Status` ENUM('Waiting', 'In Progress', 'Completed') NOT NULL,
  `StartTime` DATETIME NULL,
  `EndTime` DATETIME NULL,
  `WinnerPlayerID` INT UNSIGNED NULL,
  PRIMARY KEY (`GameID`),
  CONSTRAINT `fk_Games_Players_Winner`
    FOREIGN KEY (`WinnerPlayerID`)
    REFERENCES `mydb`.`Players` (`PlayerID`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`PlayerStats`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`PlayerStats` (
  `StatID` INT UNSIGNED NOT NULL,
  `PlayerID` INT UNSIGNED NOT NULL,
  `Wins` INT UNSIGNED NOT NULL DEFAULT '0',
  `Losses` INT UNSIGNED NOT NULL DEFAULT '0',
  `TotalGames` INT UNSIGNED NOT NULL DEFAULT '0',
  PRIMARY KEY (`StatID`),
  CONSTRAINT `fk_PlayerStats_Players`
    FOREIGN KEY (`StatID`)
    REFERENCES `mydb`.`Players` (`PlayerID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`Boards`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Boards` (
  `BoardID` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `GameID` INT UNSIGNED NOT NULL,
  `PlayerID` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`BoardID`),
  CONSTRAINT `fk_Boards_Games`
    FOREIGN KEY (`GameID`)
    REFERENCES `mydb`.`Games` (`GameID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Boards_Players`
    FOREIGN KEY (`PlayerID`)
    REFERENCES `mydb`.`Players` (`PlayerID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`Ships`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Ships` (
  `ShipID` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Type` ENUM('Carrier', 'Battleship', 'Cruiser', 'Submarine', 'Destroyer') NOT NULL,
  `Size` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`ShipID`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`ShipPlacements`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`ShipPlacements` (
  `PlacementID` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ShipID` INT UNSIGNED NOT NULL,
  `BoardID` INT UNSIGNED NOT NULL,
  `StartPositionX` TINYINT UNSIGNED NOT NULL,
  `StartPositionY` TINYINT UNSIGNED NOT NULL,
  `Orientation` ENUM('Horizontal', 'Vertical') NOT NULL,
  `HitsRemaining` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`PlacementID`),
  CONSTRAINT `fk_ShipPlacements_Ships`
    FOREIGN KEY (`ShipID`)
    REFERENCES `mydb`.`Ships` (`ShipID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_ShipPlacements_Boards`
    FOREIGN KEY (`BoardID`)
    REFERENCES `mydb`.`Boards` (`BoardID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`Cells`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Cells` (
  `CellID` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `BoardID` INT UNSIGNED NOT NULL,
  `PositionX` TINYINT UNSIGNED NOT NULL,
  `PositionY` TINYINT UNSIGNED NOT NULL,
  `IsHit` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`CellID`),
  CONSTRAINT `fk_Cells_Boards`
    FOREIGN KEY (`BoardID`)
    REFERENCES `mydb`.`Boards` (`BoardID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`Turns`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Turns` (
  `TurnID` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `GameID` INT UNSIGNED NOT NULL,
  `PlayerID` INT UNSIGNED NOT NULL,
  `TimeStamp` DATETIME NOT NULL,
  `TargetCellID` INT UNSIGNED NOT NULL,
  `Result` ENUM('Miss', 'Hit') NOT NULL,
  PRIMARY KEY (`TurnID`),
  CONSTRAINT `fk_Turns_Games`
    FOREIGN KEY (`GameID`)
    REFERENCES `mydb`.`Games` (`GameID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Turns_Players`
    FOREIGN KEY (`PlayerID`)
    REFERENCES `mydb`.`Players` (`PlayerID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Turns_Cells`
    FOREIGN KEY (`TargetCellID`)
    REFERENCES `mydb`.`Cells` (`CellID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
