#!/usr/bin/env sh


## Usuniecie resource grupy
#az group delete --name chatroom-project-group

## Login into Azure account
echo "Logowanie do konta Azure"
az login

echo "Utworzenie grupy zasobów."
az group create --location westeurope --name chatroom-project-group

echo "Utworzenie bazy mongodb - CosmosDB"
az cosmosdb create --resource-group chatroom-project-group --name chat-room-baza-mongodb-accout --kind MongoDB --server-version 4.0 --locations "westeurope=0"

#echo "Dodaj zasade logowania - pozwolenie na adresy ip przychodzace"
#az cosmodb server firewall-rule create -g chatroom-project-group -s chat-room-baza-mongodb-accout -n allowip --start-ip-address 0.0.0.0 --end-ip-address 255.255.255.255

echo "Stworzenie bazy danych mongo db"
az cosmosdb mongodb database create -a chat-room-baza-mongodb-accout --resource-group chatroom-project-group -n chatbaza

echo "Stworzenie zmiennej z connection string potrzebnej do zalogowania sie do aplikacji"
connectionString=$(az cosmosdb keys list --resource-group chatroom-project-group --name chat-room-baza-mongodb-accout --type connection-strings --query connectionStrings[0].connectionString --output tsv)

echo "Wywietlenie connectionString: Skopiuj go i wklej jako wartość zmiennej connectionString w pliku server.js"
echo "================================================================================================================"
echo ${connectionString}
echo "================================================================================================================"
echo "Nacisnij dowolny klawisz aby kontynuowac"

read

echo "Stworzenie appservice plan na Azure"
az appservice plan create --name chatroom-appservice-plan --resource-group chatroom-project-group  --location westeurope --is-linux --sku FREE

#az configure --defaults location=westeurope group=chatroom-project-group

echo "Stworzenie webapp na azure"
az webapp up --name chatroom-prod --plan chatroom-appservice-plan --logs --launch-browser --sku FREE
