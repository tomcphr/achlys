CREATE TABLE `users` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `moderator` INT(1) NOT NULL,
    `username` VARCHAR(30) NOT NULL,
    `password` VARCHAR(256) NOT NULL,
    `email` VARCHAR(256) NOT NULL,
    `avatar` VARCHAR(1) NOT NULL,
    `health` INT(3) NOT NULL DEFAULT "100",
    `muted` INT(1) NOT NULL DEFAULT "0",
    `active` INT(1) NOT NULL DEFAULT "1",
    PRIMARY KEY (`id`)
) ENGINE = InnoDB;

INSERT INTO `users` (moderator, username, password, email, avatar, health)
VALUES
(1, "test_1", "$2b$10$sqOFzeS9pRN5lIADiPTykOUH9TX0bM9s1XLebuGlnJCh2WCsPGOmO", "test1@test.test", "M", 50),
(2, "test_2", "$2b$10$sqOFzeS9pRN5lIADiPTykOUH9TX0bM9s1XLebuGlnJCh2WCsPGOmO", "test2@test.test", "F", 50);

CREATE TABLE `positions` (
    `username` VARCHAR(30) NOT NULL,
    `x` INT NOT NULL,
    `y` INT NOT NULL,
    `facing` VARCHAR(10) NOT NULL,
    PRIMARY KEY (`username`)
) ENGINE = InnoDB;

CREATE TABLE `items` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(256) NOT NULL,
    `tradable` INT NOT NULL,
    `equipable` INT NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB;

INSERT INTO `items` (name, description, tradable, equipable)
VALUES
("Coins", "Lovely Money!", 1, 0),
("Blade of Eben", "A sharp, distinctive blade", 0, 1);

CREATE TABLE `inventories` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(30) NOT NULL,
    `item` INT NOT NULL,
    `quantity` INT NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB;

INSERT INTO `inventories` (username, item, quantity)
VALUES
("test_1", 1, 2147483647),
("test_2", 2, 1);
