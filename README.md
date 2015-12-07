
# README FOR URAN PROJECT#

This README would normally document whatever steps are necessary to get your application up and running.

## Mongo DB ##
Для правильной работы сервера нужно установить и запустить mongoDB.

### установка ###
В начале необходимо установить mongoDB на компьютер.

###### установка Linux ######
[информация по установке на Linux](https://docs.mongodb.org/manual/administration/install-on-linux/)
###### установка Windows ######
[информация по установке на Windows](https://docs.mongodb.org/manual/tutorial/install-mongodb-on-windows/)
###### установка Mac OS ######
[информация по установке на OS X](https://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/)

### Работа с mongoDB ###
Перед запуском сервера на node.js надо запустить сервер mongodb.
Для запуска сервера необходимо выполнить в отдельном окне терминала команду:

```
#!shell
mongod
```

После запуска сервера mongodb, необходимо открыть еще одно окно терминала и выполнить команду
	<p>mongo</p>
Данной командой мы запустим mongo shell, в данном окне мы можем выполнять команды для получения информации о базе данных.
[более подробная информация по mongo shell](https://docs.mongodb.org/manual/reference/mongo-shell/)

После запуска сервера mongodb можно запускать node.js сервер и работать с ним.